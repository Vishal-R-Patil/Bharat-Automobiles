const db = require("../config/database");

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, gst_no FROM Suppliers ORDER BY name"
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
