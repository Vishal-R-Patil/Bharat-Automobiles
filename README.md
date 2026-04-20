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

---

## 🌐 Live Demo

🔗 https://bharat-automobiles.onrender.com

---

## ✨ Key Features

### 🏢 Public Storefront

- **Modern Public Landing Page:** Responsive home page with business overview, Kannada/English language toggle, dark/light theme support, embedded Google Maps location, and direct call-to-action buttons (Call Now, Open Maps).

### 🔐 Security & Auth

- **Role-Based Access Control (RBAC):** Secure login routing dividing access between 'Owner' and 'Developer'.
- **Stateless Authentication:** Powered by `bcrypt` password hashing and `jsonwebtoken` (JWT) stored safely in the client.
- **Session Expiry Warning System:** Non-blocking UI banner warns users 5 minutes before session expiry with dismiss option for better UX.

### 📦 Inventory & Supply Ledger

- **Live Inventory Dashboard:** Full CRUD operations with low-stock visual warnings (qty < 5).
- **Master-Detail Supply Routing:** Handles complex incoming truck deliveries by splitting data into `Supply_Deliveries` (Header) and `Supply_Items` (Details) to track wholesale costs and accurately calculate profit margins.
- **Category System Upgrade:** Replaced free-text brand field with ENUM-based category (`misc`, `lubricant`, `tyres`) for data consistency.

### 💰 Point of Sale (Billing Desk)

- **Reactive Cart Math:** Auto-calculates subtotals, applies manual overrides for discounts, and guards against negative quantities or out-of-stock sales using Database Row Locking (`FOR UPDATE`).
- **Thermal Printer Integration:** Custom CSS `@media print` logic strictly formatted for standard 80mm continuous-roll POS receipt printers.
- **Mobile-Optimized Print Handling:** Implements asynchronous `setTimeout` safeguards to prevent React state race conditions when printing from iPads/mobile browsers.
- **Robust Stock Validation:** Aggregates duplicate products in cart before validation to prevent negative inventory issues.
- **Mobile-Safe Printing:** Uses snapshot-based print data to avoid ₹0 total issue on mobile browsers.
- **Improved Receipt UI:** Enhanced readability with bold product names and optimized thermal layout.
- **Indian Currency Formatting:** All monetary values displayed using Indian numbering format (₹1,00,000) for better readability.
- **Accurate Timestamp Handling:** Ensures billing, sales history, and printed receipts all display consistent IST time across devices and environments.

### 📈 Sales History

- **Grouped Sales Analytics:** Transactions grouped by day with total daily revenue summaries and time-wise breakdown.
- **Duplicate Receipt Printing:** Instantly reprint past bills with improved thermal formatting.
- **Timezone-Safe Grouping:** Sales grouped by day using consistent IST parsing to avoid midnight edge-case errors.

---

### 📧 Automated Reporting

- **Daily Email Reports (External Cron, IST Accurate):** Uses an external scheduler (cron-job.org) to trigger `GET /api/send-report` with `Asia/Kolkata` timezone, ensuring reliable execution independent of server uptime.
- **Secure Trigger Endpoint:** Protected route `GET /api/send-report?key=CRON_SECRET` to prevent unauthorized access to report generation.
- **PDF Report Generation (Correct Time Formatting):** Generates PDFs with IST-correct timestamps using `toLocaleTimeString` with timezone and displays clean `hh:mm` format.

---

## 🧠 Challenges & Learnings

- **Handling Race Conditions in Inventory:** Implemented SQL transactions with `FOR UPDATE` locking to prevent overselling and negative stock.
- **Mobile Print Issues:** Resolved asynchronous rendering issues in mobile browsers by using snapshot-based state for printing instead of live React state.
- **Cron Jobs in Cloud Environments:** Identified limitations of in-app schedulers (`node-cron`) on free hosting (sleeping instances) and migrated to external cron (cron-job.org) for reliable, uptime-independent execution.
- **Database Reliability:** Faced downtime issues with managed database services and understood the importance of choosing stable/free-tier providers.
- **UI Consistency & Design System:** Built a reusable CSS variable-based design system with dark/light mode support for consistent UI across pages.
- **Real-world System Thinking:** Designed the app not just as a project, but as a real POS system handling inventory, billing, reporting, and customer-facing pages.
- **Timezone Consistency Across Environments:** Solved discrepancies between localhost (IST) and cloud (UTC) by explicitly controlling timezone at backend (DB session) and frontend parsing using `+05:30` offset.
- **Cron Debugging in Production:** Learned that invalid cron expressions and missing timezone configs can crash `node-cron` with `Invalid time value` errors.
- **Date Parsing Pitfalls in JavaScript:** Understood that `new Date()` behaves differently across environments and fixed it using ISO formatting with explicit offsets.
- **Robust Frontend Rendering:** Fixed React key warnings and sorting issues by avoiding formatted date strings and using raw timestamps.

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Axios, React Router DOM, Custom CSS Design System (CSS Variables), Dark Mode Theming.
- **Backend:** Node.js, Express.js. Uses `nodemailer` for automated email delivery and external schedulers (cron-job.org) for reliable job execution.
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

### 2. Setup Backend (Server)

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
DB_URL=your_database_url
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
REPORT_RECEIVER=recipient_email@gmail.com
CRON_SECRET=your_secret_key_for_external_cron
```

Start backend:

```bash
npm start
```

---

### 3. Setup Frontend (Client)

```bash
cd ../client
npm install
```

Create `.env` in `/client`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Run frontend:

```bash
npm run dev
```

---

### 4. Database Setup

- Create MySQL database
- Import schema (tables: Users, Products, Transactions, Transaction_Items, Supply_Deliveries, Supply_Items)

---

### 5. Run the App

- Backend → http://localhost:3000
- Frontend → http://localhost:5173

Login with seeded credentials or manually insert a user.

---

### 6. Test Flow

1. Add products (Inventory)
2. Add supply (Stock increases)
3. Perform billing
4. Print receipt (test mobile + desktop)
5. Check sales history

---

## ⏱️ External Cron Setup (Production)

1. Create a secure endpoint (already available):
   ```
   GET /api/send-report?key=CRON_SECRET
   ```
2. Verify locally and on deployed app (should send email and return success JSON).
3. Configure job on cron-job.org:
   - URL: `https://<your-domain>/api/send-report?key=CRON_SECRET`
   - Method: GET
   - Timezone: Asia/Kolkata
   - Schedule: 21:00 (daily)
4. Optional: Use UptimeRobot to ping `/health` every 5 minutes if running other in-app jobs.

## 🧪 Troubleshooting

- If no email is received, check server logs for "External cron" messages.
- Ensure `CRON_SECRET`, `EMAIL_USER`, and `EMAIL_PASS` are set correctly in environment variables.
- Verify database date handling uses IST (`CONVERT_TZ`) to avoid midnight boundary issues.
- Test endpoint manually via browser or curl before relying on scheduler.

- Do not modify anything else.
