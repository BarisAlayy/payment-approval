const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    identityNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "passive", "onLeave"],
      default: "active",
    },
    bankAccount: {
      bankName: { type: String, required: true },
      branchName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      iban: { type: String, required: true },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual("statusText").get(function () {
  switch (this.status) {
    case "active":
      return "Aktif";
    case "passive":
      return "Pasif";
    case "onLeave":
      return "İzinli";
    default:
      return this.status;
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
