const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createPaymentType,
  getPaymentTypes,
  updatePaymentType,
  deletePaymentType,
} = require("../controllers/paymentTypeController");

router.use(verifyToken);

router.get("/", getPaymentTypes);
router.post("/", createPaymentType);
router.put("/:id", updatePaymentType);
router.delete("/:id", deletePaymentType);

module.exports = router;
