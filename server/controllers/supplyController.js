// controllers/supplyController.js
const db = require('../config/database');

const receiveSupply = async (req, res) => {
    const { supplyInfo, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Compute total cost securely in backend
        const totalCost = items.reduce(
            (sum, item) => sum + (Number(item.wholesale_price || 0) * Number(item.quantity || 0)),
            0
        );

        // STRICT supplier validation
        const [existingSupplier] = await connection.query(
            'SELECT id, name FROM Suppliers WHERE LOWER(name) = LOWER(?)',
            [supplyInfo.supplierName.trim()]
        );

        // Supplier must already exist
        if (existingSupplier.length === 0) {
            throw new Error(
                `Supplier "${supplyInfo.supplierName}" does not exist. Please create it first in SupplyBook.`
            );
        }

        const supplierId = existingSupplier[0].id;
        const supplierName = existingSupplier[0].name;

        // 1. Insert Master Record (Supply Delivery)
        const [deliveryResult] = await connection.query(
            'INSERT INTO Supply_Deliveries (supplier_name, supplier_id, invoice_number, issued_date, total_cost) VALUES (?, ?, ?, ?, ?)',
            [supplierName, supplierId, supplyInfo.invoiceNumber, supplyInfo.issued_date, totalCost]
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

            // A. Add to Supply_items history
            await connection.query(
                'INSERT INTO Supply_Items (delivery_id, product_id, quantity_added, wholesale_price) VALUES (?, ?, ?, ?)',
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
// 1. Get the list of all deliveries
const getSupplyHistory = async (req, res) => {
    try {
        // Fetches the master records, ordered by newest first
        const sql = `
            SELECT sd.id, s.name AS supplier_name, sd.invoice_number, sd.delivery_date, sd.issued_date, sd.total_cost
            FROM Supply_Deliveries sd
            LEFT JOIN Suppliers s ON sd.supplier_id = s.id
            ORDER BY sd.id DESC
        `;
        const [rows] = await db.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch supply history" });
    }
};

// 2. THE FIX: Get specific items using a JOIN
const getSupplyItems = async (req, res) => {
    try {
        const deliveryId = req.params.id;
        
        // This SQL joins the historical Supply_items with the live Products table.
        // It assumes you are matching them by name (or you can change p.name = si.name to p.id = si.product_id if your schema uses IDs).
        const sql = `
            SELECT 
                p.name AS Product_name,
                p.category AS category,
                si.wholesale_price AS Wholesale_price,
                p.price AS Retail_price,
                si.quantity_added AS Quantity_added
            FROM Supply_Items si
            LEFT JOIN Products p ON si.product_id = p.id
            WHERE si.delivery_id = ?
        `;
        
        const [rows] = await db.query(sql, [deliveryId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch delivery items" });
    }
};


module.exports = { receiveSupply, getSupplyHistory, getSupplyItems };
