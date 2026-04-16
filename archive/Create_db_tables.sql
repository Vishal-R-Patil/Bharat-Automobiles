
-- 1. Create Users Table (Independent)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Owner', 'Developer') NOT NULL
);

-- 2. Create Products Table (Independent)
CREATE TABLE Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
	product_description TEXT              -- NEW: Description added here
);

-- 3. Create Transactions Table (Depends on Users)

CREATE TABLE Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,  -- NEW: Automatically records the exact time
    sub_total DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 4. Create Transaction_Items Table (Depends on Transactions & Products)
CREATE TABLE Transaction_Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    price_at_sale DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT
);
-- Supply handling
-- 1. The Header Table (The Truck / The Invoice)
CREATE TABLE Supply_Deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(50),                     -- Tracks the physical paper bill
    delivery_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Automatically records the exact time
    total_cost DECIMAL(10,2)                        -- Total amount paid to the supplier
);

-- 2. The Items Table (The specific products on the truck)
CREATE TABLE Supply_Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT,
    product_id INT,
    quantity_added INT NOT NULL,
    wholesale_price DECIMAL(10,2),                  -- How much you paid PER ITEM
    
    -- Links this item back to the specific truck delivery
    FOREIGN KEY (delivery_id) REFERENCES Supply_Deliveries(id) ON DELETE CASCADE,
    
    -- Links this item to your master inventory list
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT
);