# 🚗 Bharat Automobiles - POS & Inventory Management System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

A full-stack, cloud-hosted Point of Sale (POS) and Inventory Management web application built specifically for **Bharat Automobiles**, a legacy automobile lubricant dealership operating since 1983 in Haveri, Karnataka.

## 📖 About the Project

This application modernizes physical retail business by replacing traditional bookkeeping with a lightning-fast, cloud-based SERN stack (SQL, Express, React, Node.js) architecture.

It features a public-facing storefront for customers and a highly secure, role-based "Back Office" dashboard for the owner. It is engineered to handle complex supply deliveries, real-time inventory deductions, and hardware-native 80mm thermal receipt printing.

## ✨ Key Features

### 🏢 Public Storefront

- Responsive landing page detailing the shop's history, location (Siddappa Circle, Haveri), and authorized dealership status (HP, Servo, Gulf).

### 🔐 Security & Auth

- **Role-Based Access Control (RBAC):** Secure login routing dividing access between 'Owner' and 'Developer'.
- **Stateless Authentication:** Powered by `bcrypt` password hashing and `jsonwebtoken` (JWT) stored safely in the client.

### 📦 Inventory & Supply Ledger

- **Live Inventory Dashboard:** Full CRUD operations with low-stock visual warnings (qty < 5).
- **Master-Detail Supply Routing:** Handles complex incoming truck deliveries by splitting data into `Supply_Deliveries` (Header) and `Supply_Items` (Details) to track wholesale costs and accurately calculate profit margins.

### 💰 Point of Sale (Billing Desk)

- **Reactive Cart Math:** Auto-calculates subtotals, applies manual overrides for discounts, and guards against negative quantities or out-of-stock sales using Database Row Locking (`FOR UPDATE`).
- **Thermal Printer Integration:** Custom CSS `@media print` logic strictly formatted for standard 80mm continuous-roll POS receipt printers.
- **Mobile-Optimized Print Handling:** Implements asynchronous `setTimeout` safeguards to prevent React state race conditions when printing from iPads/mobile browsers.

### 📈 Sales History

- Filter and view past transactions, review exact discounts applied, and instantly reprint duplicate receipts.

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Axios, React Router DOM, Custom CSS Design System (CSS Variables).
- **Backend:** Node.js, Express.js.
- **Database:** MySQL (using `mysql2` driver with connection pooling for raw, high-performance SQL queries).
- **Hosting:** \* Frontend & Backend API hosted on **Render**.
  - Managed MySQL Database hosted on **Aiven Cloud**.

---

## 🗄️ Database Architecture

The backend abandons bulky ORMs in favor of highly optimized raw SQL queries to ensure absolute ACID compliance during financial transactions.

**Core Tables:**

1. `Users` - Credentials and RBAC roles.
2. `Products` - Master inventory list.
3. `Transactions` - Bill headers (Date, Subtotal, Discount, Final Amount).
4. `Transaction_Items` - Junction table (Products sold per bill + price lock).
5. `Supply_Deliveries` - Incoming truck/invoice headers.
6. `Supply_Items` - Incoming boxes per delivery + wholesale price logging.

_Strict `ON DELETE RESTRICT` and `CASCADE` constraints are enforced to protect historical accounting._

---

## 🚀 Local Development Setup

To run this project locally, you will need Node.js and a local instance of MySQL installed.

### 1. Clone the repository

```bash
git clone [https://github.com/YOUR_USERNAME/bharat-automobiles.git](https://github.com/YOUR_USERNAME/bharat-automobiles.git)
cd bharat-automobiles
```
