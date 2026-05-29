const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getSuppliers,
  addSupplier,
  deleteSupplier,
  updateSupplier,
  getSupplierLedger,
  addDelivery,
  addPayment,
  updateTransaction,
  deleteTransaction,
  addAttachment,
  deleteAttachment,
  getBills,
} = require("../controllers/supplyBookController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
  {
    if (!file.mimetype.startsWith("image/"))
    {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/suppliers", verifyToken, getSuppliers);
router.post(
  "/suppliers",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  addSupplier
);
router.delete(
  "/suppliers/:id",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  deleteSupplier
);
router.get("/suppliers/:id/ledger", verifyToken, getSupplierLedger);
router.post(
  "/suppliers/:id/deliveries",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  upload.single("image"),
  addDelivery
);
router.post(
  "/suppliers/:id/payments",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  upload.single("image"),
  addPayment
);
router.patch(
  "/suppliers/:id",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  updateSupplier
);
router.patch(
  "/suppliers/:id/transactions",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  updateTransaction
);
router.delete(
  "/suppliers/:id/transactions",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  deleteTransaction
);
router.post(
  "/attachments",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  upload.single("image"),
  addAttachment
);
router.delete(
  "/attachments/:id",
  verifyToken,
  authorizeRoles("Owner", "Developer"),
  deleteAttachment
);
router.get("/bills", verifyToken, getBills);

module.exports = router;
