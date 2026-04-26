const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    creditorName: {
      type: String,
      required: [true, "Alacaklı adı zorunludur"],
      trim: true,
    },
    creditorType: {
      type: String,
      enum: ["supplier", "employee", "other"],
      default: "other",
    },
    creditorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Ödeme tutarı zorunludur"],
      min: [0, "Ödeme tutarı 0'dan küçük olamaz"],
    },
    description: {
      type: String,
      required: [true, "Açıklama zorunludur"],
      trim: true,
    },
    accountName: {
      type: String,
      required: [true, "Hesap adı zorunludur"],
      trim: true,
    },
    iban: {
      type: String,
      required: [true, "IBAN zorunludur"],
      trim: true,
      uppercase: true,
      match: [/^TR\d{2}\s?(\d{4}\s?){5}\d{2}$/, "Geçerli bir IBAN giriniz"],
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentType",
      required: [true, "Ödeme türü zorunludur"],
    },
    dueDate: {
      type: Date,
      required: [true, "Vade tarihi zorunludur"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "completed"],
        message:
          "Geçersiz durum değeri. Geçerli değerler: pending, approved, rejected, completed",
      },
      default: "pending",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
    rejectedReason: { type: String },
    proofDocumentPath: { type: String },
    invoicePath: { type: String },
  },
  {
    timestamps: true,
    collection: "payments",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

paymentSchema.virtual("statusText").get(function () {
  switch (this.status) {
    case "pending":
      return "Onay Bekliyor";
    case "approved":
      return "Onaylandı";
    case "rejected":
      return "Reddedildi";
    case "completed":
      return "Tamamlandı";
    default:
      return this.status;
  }
});

paymentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
