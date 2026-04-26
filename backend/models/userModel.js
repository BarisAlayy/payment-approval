const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Kullanıcı adı zorunludur"],
      unique: true,
      trim: true,
      minlength: [3, "Kullanıcı adı en az 3 karakter olmalıdır"],
      maxlength: [50, "Kullanıcı adı en fazla 50 karakter olabilir"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "E-posta adresi zorunludur"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Geçerli bir e-posta adresi giriniz",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Şifre zorunludur"],
      minlength: [6, "Şifre en az 6 karakter olmalıdır"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "boss", "finance", "purchaser"],
        message: "Geçersiz rol. Roller: admin, boss, finance, purchaser",
      },
      required: [true, "Rol zorunludur"],
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
