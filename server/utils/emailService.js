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
const sendDailyReport = async (total, count) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Create PDF in memory
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
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

    doc.text(`Total Sales: ₹${Number(total).toLocaleString('en-IN')}`);
    doc.text(`Transactions: ${count}`);
    doc.moveDown();

    doc.text(`Generated at: ${today.toLocaleString('en-IN')}`);

    doc.end();
};

// Cron job starter
// for testing '*/1 * * * *' (every minute) change to '0 21 * * *' for 9PM daily
const startDailyReportJob = () => {
    cron.schedule('*/1 * * * *', async () => {
        console.log("⏰ Running Daily Sales Report...");

        try {
            const [rows] = await db.query(`
                SELECT 
                    SUM(final_amount) as total,
                    COUNT(*) as transactions
                FROM transactions
                WHERE DATE(sale_date) = CURDATE()
            `);

            const total = rows[0].total || 0;
            const count = rows[0].transactions || 0;

            await sendDailyReport(total, count);

            console.log("✅ Daily report email sent");
        } catch (err) {
            console.error("❌ Error sending report:", err);
        }
    });
};

module.exports = { startDailyReportJob };