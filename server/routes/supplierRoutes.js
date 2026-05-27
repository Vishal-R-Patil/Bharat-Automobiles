const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});


//Import the gatekeeper (the authentication middleware)
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const {
  getSuppliers,
  getSupplierTransactions,
  getSupplierLedger,
  getSupplierBills,
  addSupplierPayment,
  addAttachment,
  deleteAttachment,
  addSupplier,
  deleteSupplier,
  searchSuppliers
} = require("../controllers/supplierController");

router.get("/",verifyToken, getSuppliers);
router.get("/bills", verifyToken, getSupplierBills);
router.post(
  "/attachments",
  verifyToken,
  authorizeRoles("Owner","Developer"),
  upload.single("image"),
  addAttachment
);
router.delete(
  "/attachments/:id",
  verifyToken,
  authorizeRoles("Owner","Developer"),
  deleteAttachment
);
router.get("/:id/ledger", verifyToken, getSupplierLedger);
router.post(
  "/:id/payments",
  verifyToken,
  authorizeRoles("Owner","Developer"),
  upload.single("image"),
  addSupplierPayment
);
router.get("/:id",verifyToken, getSupplierTransactions);
router.post("/",verifyToken,authorizeRoles("Owner","Developer"), addSupplier);
router.delete("/:id", verifyToken,authorizeRoles("Owner","Developer"),deleteSupplier);
module.exports = router;
