const express = require("express");
const router = express.Router();


//Import the gatekeeper (the authentication middleware)
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const {
  getSuppliers,
  getSupplierTransactions,
  addSupplier,
  deleteSupplier
} = require("../controllers/supplierController");

router.get("/",verifyToken, getSuppliers);
router.get("/:id",verifyToken, getSupplierTransactions);
router.post("/",verifyToken,authorizeRoles("Owner","Developer"), addSupplier);
router.delete("/:id", verifyToken,authorizeRoles("Owner","Developer"),deleteSupplier);
module.exports = router;
