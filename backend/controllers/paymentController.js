const path = require("path");
const fs = require("fs");
const Payment = require("../models/paymentModel");
const { sendSMSToBoss } = require("../services/smsService");
const AppError = require("../utils/AppError");
const { requireFields } = require("../utils/validate");
const { respond } = require("../utils/response");
const { pickLang, translate } = require("../utils/messages");

const VALID_STATUSES = ["pending", "approved", "rejected", "completed"];
const IBAN_REGEX = /^TR\d{2}(\d{4}){5}\d{2}$/;

const populatePayment = (query) =>
  query
    .populate({ path: "paymentType", select: "name description" })
    .populate({ path: "createdBy", select: "username" })
    .populate({ path: "approvedBy", select: "username" })
    .populate({ path: "rejectedBy", select: "username" })
    .populate({ path: "completedBy", select: "username" });

const contentTypeFor = (ext) => {
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/pdf";
};

const streamFile = (req, res, filePath, fallbackCode) => {
  const lang = pickLang(req.headers["accept-language"]);
  res.setHeader("Content-Type", contentTypeFor(path.extname(filePath).toLowerCase()));
  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  const fileStream = fs.createReadStream(filePath);
  fileStream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({
        errorCode: fallbackCode,
        message: translate(lang, fallbackCode),
      });
    }
  });
  fileStream.pipe(res);
};

const resolveExistingPath = (candidates) => {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
};

exports.createPayment = async (req, res, next) => {
  try {
    requireFields(req.body, [
      "creditorName",
      "amount",
      "description",
      "accountName",
      "iban",
      "paymentType",
      "dueDate",
    ]);

    const { creditorName, amount, description, accountName, iban, paymentType, dueDate } = req.body;

    const cleanIban = iban.replace(/\s/g, "").toUpperCase();
    if (!IBAN_REGEX.test(cleanIban)) {
      throw new AppError("Geçerli bir IBAN giriniz", 400, "PAYMENT_INVALID_IBAN");
    }

    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      throw new AppError("Geçerli bir vade tarihi giriniz", 400, "PAYMENT_INVALID_DUE_DATE");
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new AppError("Tutar pozitif bir sayı olmalı", 400, "PAYMENT_AMOUNT_POSITIVE");
    }

    const payment = await Payment.create({
      creditorName: creditorName.trim(),
      amount: numericAmount,
      description: description.trim(),
      accountName: accountName.trim(),
      iban: cleanIban,
      paymentType,
      dueDate: dueDateObj,
      createdBy: req.user.userId,
      status: "pending",
    });

    await payment.populate([
      { path: "paymentType", select: "name" },
      { path: "createdBy", select: "username" },
    ]);

    if (payment.paymentType?.name) {
      await sendSMSToBoss(payment.amount, payment.paymentType.name).catch(() => null);
    }

    return respond(req, res, 201, "PAYMENT_CREATED", { payment });
  } catch (err) {
    next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        throw new AppError("Geçersiz status değeri", 400, "PAYMENT_INVALID_STATUS");
      }
      filter.status = req.query.status;
    }

    const payments = await populatePayment(Payment.find(filter))
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(payments);
  } catch (err) {
    next(err);
  }
};

exports.approvePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) throw new AppError("Ödeme bulunamadı", 404, "PAYMENT_NOT_FOUND");
    if (payment.status !== "pending") {
      throw new AppError("Bu ödeme zaten onaylanmış veya reddedilmiş", 400, "PAYMENT_ALREADY_PROCESSED");
    }

    payment.status = "approved";
    payment.approvedBy = req.user.userId;
    payment.approvedAt = new Date();
    await payment.save();

    const populated = await populatePayment(Payment.findById(payment._id));
    return respond(req, res, 200, "PAYMENT_APPROVED", { payment: populated });
  } catch (err) {
    next(err);
  }
};

exports.rejectPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) throw new AppError("Ödeme bulunamadı", 404, "PAYMENT_NOT_FOUND");
    if (payment.status !== "pending") {
      throw new AppError("Bu ödeme zaten onaylanmış veya reddedilmiş", 400, "PAYMENT_ALREADY_PROCESSED");
    }

    payment.status = "rejected";
    payment.rejectedBy = req.user.userId;
    payment.rejectedAt = new Date();
    payment.rejectedReason = req.body.reason || "";
    await payment.save();

    const populated = await populatePayment(Payment.findById(payment._id));
    return respond(req, res, 200, "PAYMENT_REJECTED", { payment: populated });
  } catch (err) {
    next(err);
  }
};

exports.completePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError("Ödeme bulunamadı", 404, "PAYMENT_NOT_FOUND");
    if (payment.status !== "approved") {
      throw new AppError("Sadece onaylanmış ödemeler tamamlanabilir", 400, "PAYMENT_ONLY_APPROVED_COMPLETED");
    }

    if (req.file) payment.proofDocumentPath = req.file.path;
    payment.status = "completed";
    payment.completedBy = req.user.userId;
    payment.completedAt = new Date();
    await payment.save();

    const populated = await populatePayment(Payment.findById(payment._id));
    return respond(req, res, 200, "PAYMENT_COMPLETED", { payment: populated });
  } catch (err) {
    next(err);
  }
};

exports.uploadInvoice = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("Dosya yüklenmedi", 400, "FILE_NOT_UPLOADED");
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError("Ödeme bulunamadı", 404, "PAYMENT_NOT_FOUND");

    payment.invoicePath = req.file.path;
    await payment.save();
    return respond(req, res, 200, "INVOICE_UPLOADED", { payment });
  } catch (err) {
    next(err);
  }
};

const downloadStoredFile = (field, notFoundCode, streamErrorCode) =>
  async (req, res, next) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) throw new AppError("Ödeme bulunamadı", 404, "PAYMENT_NOT_FOUND");
      if (!payment[field]) throw new AppError("Dosya bulunamadı", 404, notFoundCode);

      const uploadsDir = path.join(__dirname, "..", "uploads");
      const invoicesDir = path.join(uploadsDir, "invoices");
      const storedPath = payment[field];
      const base = path.basename(storedPath);

      const filePath = resolveExistingPath([
        path.join(invoicesDir, base),
        path.join(uploadsDir, base),
        path.join(uploadsDir, storedPath),
        storedPath,
      ]);
      if (!filePath) throw new AppError("Dosya sistemde bulunamadı", 404, "FILE_NOT_ON_DISK");

      streamFile(req, res, filePath, streamErrorCode);
    } catch (err) {
      next(err);
    }
  };

exports.downloadInvoice = downloadStoredFile("invoicePath", "INVOICE_NOT_FOUND", "INVOICE_READ_ERROR");
exports.downloadProof = downloadStoredFile("proofDocumentPath", "PROOF_NOT_FOUND", "PROOF_READ_ERROR");
