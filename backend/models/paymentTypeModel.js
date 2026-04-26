const mongoose = require("mongoose");

const paymentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ödeme türü adı zorunludur"],
      unique: true,
      trim: true,
      minlength: [2, "Ödeme türü adı en az 2 karakter olmalıdır"],
      maxlength: [50, "Ödeme türü adı en fazla 50 karakter olabilir"],
      index: {
        unique: true,
        collation: { locale: "tr", strength: 2 },
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "paymenttypes",
    versionKey: false,
  }
);

paymentTypeSchema.index({ isActive: 1 });

paymentTypeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

paymentTypeSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

const PaymentType = mongoose.model("PaymentType", paymentTypeSchema);

module.exports = PaymentType;
