const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('../config/database');

// Mail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email sender
const sendDailyReport = async (total, count) =>
{
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Create PDF in memory
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () =>
    {
        const pdfData = Buffer.concat(buffers);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.REPORT_RECEIVER,
            subject: `${formattedDate} Sales Report`,
            text: `Attached is the daily sales report.`,
            attachments: [
                {
                    filename: `Sales_Report_${formattedDate}.pdf`,
                    content: pdfData
                }
            ]
        });
    });

    // PDF content
    doc.fontSize(18).text('Bharat Automobiles', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Daily Sales Report`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Date: ${formattedDate}`);
    doc.moveDown();

    doc.text(`Total Sales: Rs.${Number(total).toLocaleString('en-IN')}`);
    doc.text(`Transactions: ${count}`);
    doc.moveDown();
    //ist time
    const istTime = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    doc.text(`Generated at: ${istTime}`);

    doc.end();
};

// Cron job starter
// for testing '*/1 * * * *' (every minute) change to '0 21 * * *' for 9PM daily
const startDailyReportJob = () =>
{
    console.log("External cron mode enabled. Waiting for /api/send-report trigger");
};

const handleSendReport = async (req, res) => {
    try {
        // Optional security check
        if (req.query.key !== process.env.CRON_SECRET) {
            return res.status(403).send("Unauthorized");
        }

        const [rows] = await db.query(`
            SELECT 
                SUM(final_amount) as total,
                COUNT(*) as transactions
            FROM Transactions
            WHERE DATE(CONVERT_TZ(sale_date, '+00:00', '+05:30')) = 
                  DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
        `);

        const total = rows[0].total || 0;
        const count = rows[0].transactions || 0;

        // respond immediately to avoid timeouts
        res.send("Report triggered");

        // run in background
        sendDailyReport(total, count)
            .then(() => console.log("✅ Report sent via external cron"))
            .catch(err => console.error("❌ Background report failed:", err));
    } catch (err) {
        console.error("❌ External cron error:", err);
        res.status(500).send("Error sending report");
    }
};

module.exports = { startDailyReportJob, handleSendReport };