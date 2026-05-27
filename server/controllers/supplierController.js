const db = require("../config/database");
const { v2: cloudinary } = require("cloudinary");

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    try {
      const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);

      cloudinary.config({
        cloud_name: cloudinaryUrl.hostname,
        api_key: decodeURIComponent(cloudinaryUrl.username),
        api_secret: decodeURIComponent(cloudinaryUrl.password),
        secure: true,
      });
      return;
    } catch (err) {
      console.error("Invalid CLOUDINARY_URL:", err.message);
    }
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

configureCloudinary();

const uploadImageToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return reject(
        new Error(
          "Cloudinary credentials are missing. Set CLOUDINARY_URL or all CLOUDINARY_* variables."
        )
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bharat-automobiles/supplier-bills",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });

const getCloudinaryPublicId = (fileUrl) => {
  const { pathname } = new URL(fileUrl);
  const uploadMarker = "/upload/";
  const uploadIndex = pathname.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    return null;
  }

  let publicPath = pathname.slice(uploadIndex + uploadMarker.length);
  publicPath = publicPath.replace(/^v\d+\//, "");

  return publicPath.replace(/\.[^/.]+$/, "");
};

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        s.id,
        s.name,
        s.gst_no,
        MAX(COALESCE(sd.issued_date, sd.delivery_date)) AS last_interaction_at,
        MAX(sd.id) AS last_interaction_id
       FROM Suppliers s
       LEFT JOIN Supply_Deliveries sd ON sd.supplier_id = s.id
       GROUP BY s.id, s.name, s.gst_no
       ORDER BY last_interaction_at DESC, last_interaction_id DESC, s.name ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};

// Get supplier transactions
exports.getSupplierTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT sd.*
       FROM Supply_Deliveries sd
       WHERE sd.supplier_id = ?
       ORDER BY sd.id DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch supplier transactions" });
  }
};

const mapAttachmentsToEntities = (entities, entityType, attachments) => {
  const attachmentMap = attachments.reduce((map, attachment) => {
    const key = `${attachment.entity_type}:${attachment.entity_id}`;
    if (!map[key]) map[key] = [];
    map[key].push(attachment);
    return map;
  }, {});

  return entities.map((entity) => ({
    ...entity,
    attachments: attachmentMap[`${entityType}:${entity.id}`] || [],
  }));
};

// Get supplier ledger: deliveries, payments, attachments, and net balance
exports.getSupplierLedger = async (req, res) => {
  try {
    const { id } = req.params;

    const [[supplier]] = await db.query(
      "SELECT id, name, gst_no FROM Suppliers WHERE id = ?",
      [id]
    );

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const [deliveries] = await db.query(
      `SELECT sd.*
       FROM Supply_Deliveries sd
       WHERE sd.supplier_id = ?
       ORDER BY sd.id DESC`,
      [id]
    );

    const [payments] = await db.query(
      `SELECT sp.*
       FROM Supplier_Payments sp
       WHERE sp.supplier_id = ?
       ORDER BY sp.payment_date DESC, sp.id DESC`,
      [id]
    );

    const deliveryIds = deliveries.map((delivery) => delivery.id);
    const paymentIds = payments.map((payment) => payment.id);
    const attachments = [];

    if (deliveryIds.length > 0) {
      const [deliveryAttachments] = await db.query(
        `SELECT *
         FROM Attachments
         WHERE entity_type = 'supply_delivery'
           AND entity_id IN (?)`,
        [deliveryIds]
      );
      attachments.push(...deliveryAttachments);
    }

    if (paymentIds.length > 0) {
      const [paymentAttachments] = await db.query(
        `SELECT *
         FROM Attachments
         WHERE entity_type = 'supplier_payment'
           AND entity_id IN (?)`,
        [paymentIds]
      );
      attachments.push(...paymentAttachments);
    }

    const totalSupplies = deliveries.reduce(
      (sum, delivery) => sum + Number(delivery.total_cost || 0),
      0
    );
    const totalPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const balance = totalSupplies - totalPayments;

    res.json({
      supplier,
      deliveries: mapAttachmentsToEntities(
        deliveries,
        "supply_delivery",
        attachments
      ),
      payments: mapAttachmentsToEntities(
        payments,
        "supplier_payment",
        attachments
      ),
      summary: {
        totalSupplies,
        totalPayments,
        balance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch supplier ledger" });
  }
};

// Get bill/payment images across suppliers with optional filters
exports.getSupplierBills = async (req, res) => {
  try {
    const { supplier_id, type = "both" } = req.query;
    const includeSupply = type === "both" || type === "supply";
    const includePayment = type === "both" || type === "payment";
    const queries = [];
    const params = [];

    if (includeSupply) {
      queries.push(
        `SELECT
          a.id,
          a.file_url,
          a.uploaded_at,
          'supply' AS bill_type,
          sd.id AS entity_id,
          sd.invoice_number,
          sd.total_cost AS amount,
          COALESCE(sd.issued_date, sd.delivery_date) AS transaction_date,
          s.id AS supplier_id,
          s.name AS supplier_name
         FROM Attachments a
         INNER JOIN Supply_Deliveries sd
           ON a.entity_type = 'supply_delivery'
          AND a.entity_id = sd.id
         INNER JOIN Suppliers s ON s.id = sd.supplier_id
         WHERE (? IS NULL OR s.id = ?)`
      );
      params.push(supplier_id || null, supplier_id || null);
    }

    if (includePayment) {
      queries.push(
        `SELECT
          a.id,
          a.file_url,
          a.uploaded_at,
          'payment' AS bill_type,
          sp.id AS entity_id,
          NULL AS invoice_number,
          sp.amount,
          sp.payment_date AS transaction_date,
          s.id AS supplier_id,
          s.name AS supplier_name
         FROM Attachments a
         INNER JOIN Supplier_Payments sp
           ON a.entity_type = 'supplier_payment'
          AND a.entity_id = sp.id
         INNER JOIN Suppliers s ON s.id = sp.supplier_id
         WHERE (? IS NULL OR s.id = ?)`
      );
      params.push(supplier_id || null, supplier_id || null);
    }

    if (queries.length === 0) {
      return res.json([]);
    }

    const [rows] = await db.query(
      `${queries.join(" UNION ALL ")}
       ORDER BY transaction_date DESC, uploaded_at DESC, id DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch supplier bills" });
  }
};

// Create a supplier payment
exports.addSupplierPayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const {
      payment_date,
      amount,
      payment_method,
      note,
    } = req.body;

    if (!payment_date || !amount) {
      return res
        .status(400)
        .json({ error: "Payment date and amount are required" });
    }

    await connection.beginTransaction();

    const [[supplier]] = await connection.query(
      "SELECT id FROM Suppliers WHERE id = ?",
      [id]
    );

    if (!supplier) {
      await connection.rollback();
      return res.status(404).json({ error: "Supplier not found" });
    }

    const [result] = await connection.query(
      `INSERT INTO Supplier_Payments
        (supplier_id, payment_date, amount, payment_method, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        payment_date,
        amount,
        payment_method || null,
        note || null,
      ]
    );

    const attachmentUrl = await uploadImageToCloudinary(req.file);

    if (attachmentUrl) {
      await connection.query(
        `INSERT INTO Attachments (entity_type, entity_id, file_url)
         VALUES ('supplier_payment', ?, ?)`,
        [result.insertId, attachmentUrl]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Supplier payment added",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({
      error: "Failed to add supplier payment",
      details: err.message,
    });
  } finally {
    connection.release();
  }
};

// Upload and attach an image to a supply delivery or supplier payment
exports.addAttachment = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    const validEntityTypes = ["supply_delivery", "supplier_payment"];

    if (!validEntityTypes.includes(entity_type) || !entity_id || !req.file) {
      return res.status(400).json({
        error: "Valid entity type, entity id, and image file are required",
      });
    }

    const fileUrl = await uploadImageToCloudinary(req.file);

    const [result] = await db.query(
      `INSERT INTO Attachments (entity_type, entity_id, file_url)
       VALUES (?, ?, ?)`,
      [entity_type, entity_id, fileUrl]
    );

    res.status(201).json({
      message: "Attachment added",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to add attachment",
      details: err.message,
    });
  }
};

// Delete an attachment from Cloudinary and the local attachment table
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const [[attachment]] = await db.query(
      "SELECT id, file_url FROM Attachments WHERE id = ?",
      [id]
    );

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const publicId = getCloudinaryPublicId(attachment.file_url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    await db.query("DELETE FROM Attachments WHERE id = ?", [id]);

    res.json({ message: "Attachment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to delete attachment",
      details: err.message,
    });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether supplier has transactions
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM Supply_Deliveries WHERE supplier_id = ?",
      [id]
    );

    if (rows[0].count > 0) {
      return res.status(409).json({
        hasTransactions: true,
        error:
          "Cannot delete supplier because previous supply transactions exist.",
      });
    }

    // Safe to delete
    await db.query("DELETE FROM Suppliers WHERE id = ?", [id]);

    res.json({
      message: "Supplier deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error while deleting supplier",
    });
  }
};

// Add supplier
exports.addSupplier = async (req, res) => {
  try {
    const { name, gst_no } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Supplier name required" });
    }

    const [result] = await db.query(
      "INSERT INTO Suppliers (name, gst_no) VALUES (?, ?)",
      [name, gst_no || null]
    );

    res.json({ message: "Supplier added", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
