const db= require('../config/database'); // Import your new database pool

// Fetch all products from the database
// Fetch all products
const getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Products');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
};

// Add a new product
const addProduct = async (req, res) => {
    try {
        const { name, brand, product_description, price, stock_qty } = req.body;
        const sql = `
            INSERT INTO Products (name, brand, product_description, price, stock_qty) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [name, brand, product_description, price, stock_qty];

        const [result] = await db.query(sql, values);
        res.status(201).json({ message: "Product added successfully!", insertedId: result.insertId });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to add new product" });
    }
};

// Update an existing product
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, brand, product_description, price, stock_qty } = req.body;
        
        const sql = `
            UPDATE Products 
            SET name=?, brand=?, product_description=?, price=?, stock_qty=? 
            WHERE id=?
        `;
        const values = [name, brand, product_description, price, stock_qty, productId];

        const [result] = await db.query(sql, values);
        
        // Check if the product actually existed
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.status(200).json({ message: "Product updated successfully!" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const [result] = await db.query('DELETE FROM Products WHERE id=?', [productId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.status(200).json({ message: "Product deleted successfully!" });
    } catch (error) {
        console.error("Database error:", error);
        // If a product is linked to a past sale, MySQL will block the deletion!
        res.status(500).json({ error: "Failed to delete product. It may be linked to existing sales." });
    }
};

// Don't forget to export the new functions at the bottom!
module.exports = {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct
};

