// controllers/supplyController.js
const db = require('../config/database');

const receiveSupply = async (req, res) => {
    const { supplyInfo, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert Master Record (Supply Delivery)
        const [deliveryResult] = await connection.query(
            'INSERT INTO supply_deliveries (supplier_name, invoice_number, total_cost) VALUES (?, ?, ?)',
            [supplyInfo.supplierName, supplyInfo.invoiceNumber, supplyInfo.totalCost]
        );
        const deliveryId = deliveryResult.insertId;

        // 2. Loop through every item strictly
        for (let item of items) {
            let currentProductId = item.product_id;

            // If frontend didn't pass an ID, try one last time to find it by exact name
            if (!currentProductId) {
                const [existingProduct] = await connection.query(
                    'SELECT id FROM Products WHERE LOWER(name) = LOWER(?)',
                    [item.name]
                );
                
                if (existingProduct.length > 0) {
                    currentProductId = existingProduct[0].id;
                } else {
                    // STRICT RULE ENFORCEMENT: It doesn't exist. Cancel everything!
                    throw new Error(`Product "${item.name}" is not in the database. Please add it to your inventory first.`);
                }
            }

            // A. Add to supply_items history
            await connection.query(
                'INSERT INTO supply_items (delivery_id, product_id, quantity_added, wholesale_price) VALUES (?, ?, ?, ?)',
                [deliveryId, currentProductId, item.quantity, item.wholesale_price]
            );

            // B. Strictly UPDATE the existing inventory
            await connection.query(
                'UPDATE Products SET stock_qty = stock_qty + ?, price = ? WHERE id = ?',
                [Number(item.quantity), Number(item.retail_price), currentProductId]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Supply processed and inventory successfully updated!" });

    } catch (error) {
        await connection.rollback();
        console.error("Transaction Error:", error);
        // Send the exact error message back to React!
        res.status(400).json({ error: error.message || "Failed to process supply delivery. No data was saved." });
    } finally {
        connection.release();
    }
};

module.exports = { receiveSupply };