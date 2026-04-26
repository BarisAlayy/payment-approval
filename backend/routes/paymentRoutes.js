const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPayments,
  approvePayment,
  rejectPayment,
  uploadInvoice,
  downloadInvoice,
  completePayment,
  downloadProof,
} = require("../controllers/paymentController");

const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/fileUpload");

router.use(verifyToken);

router.get("/", getPayments);
router.post("/", createPayment);
router.patch("/:paymentId/approve", approvePayment);
router.patch("/:paymentId/reject", rejectPayment);
router.patch("/:id/complete", upload.single("file"), completePayment);
router.post("/:id/upload-invoice", upload.single("invoice"), uploadInvoice);
router.get("/:id/download-invoice", downloadInvoice);
router.get("/:id/download-proof", downloadProof);

module.exports = router;
