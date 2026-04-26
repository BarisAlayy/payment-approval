const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    taxNumber: { 
      type: String, 
      required: true,
      unique: true,
      trim: true
    },
    taxOffice: { 
      type: String, 
      required: true,
      trim: true
    },
    address: { 
      type: String, 
      required: true 
    },
    phone: { 
      type: String,
      required: true,
      trim: true
    },
    email: { 
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    contactPerson: { 
      type: String,
      required: true,
      trim: true
    },
    status: { 
      type: String,
      enum: ['active', 'passive'],
      default: 'active'
    },
    description: { 
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model("Supplier", supplierSchema); 