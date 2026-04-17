SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Transaction_Items;

TRUNCATE TABLE Transactions;

TRUNCATE TABLE Supply_Items;

TRUNCATE TABLE Supply_Deliveries;

TRUNCATE TABLE Products;

SET FOREIGN_KEY_CHECKS = 1;

-- Alter brand to category
ALTER TABLE Products
MODIFY COLUMN category ENUM('misc', 'lubricant', 'tyres') NOT NULL DEFAULT 'misc';