const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const AppError = require("../utils/AppError");
const { requireFields, assertLength, assertEmail, assertOneOf } = require("../utils/validate");
const { respond } = require("../utils/response");
const { pickLang, translate } = require("../utils/messages");

const MAIL_ENABLED = process.env.MAIL_ENABLED === "true";
const VALID_ROLES = ["admin", "boss", "finance", "purchaser"];

let transporter = null;
if (MAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

const sendEmail = async (mailOptions) => {
  if (!MAIL_ENABLED) {
    return { success: true, messageId: "disabled" };
  }
  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) throw new AppError("Kullanıcı bulunamadı", 404, "USER_NOT_FOUND");
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    requireFields(req.body, ["username", "email", "password", "role"]);
    const { username, email, password, role } = req.body;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    assertLength(cleanUsername, "Kullanıcı adı", 3, 50, "USERNAME");
    assertEmail(cleanEmail);
    assertLength(password, "Şifre", 6, 100, "PASSWORD");
    assertOneOf(role, "Rol", VALID_ROLES, "ROLE");

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });
    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        throw new AppError("Bu kullanıcı adı zaten kullanılıyor", 409, "USERNAME_TAKEN");
      }
      throw new AppError("Bu e-posta adresi zaten kullanılıyor", 409, "EMAIL_TAKEN");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const savedUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role,
    });

    const { password: _pw, ...safeUser } = savedUser.toObject();
    return respond(req, res, 201, "USER_CREATED", { user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("Kullanıcı bulunamadı", 404, "USER_NOT_FOUND");

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      assertLength(cleanUsername, "Kullanıcı adı", 3, 50, "USERNAME");
      const exists = await User.findOne({ username: cleanUsername });
      if (exists) throw new AppError("Bu kullanıcı adı zaten kullanılıyor", 409, "USERNAME_TAKEN");
      user.username = cleanUsername;
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      assertEmail(cleanEmail);
      const exists = await User.findOne({ email: cleanEmail });
      if (exists) throw new AppError("Bu e-posta adresi zaten kullanılıyor", 409, "EMAIL_TAKEN");
      user.email = cleanEmail;
    }

    if (password) {
      assertLength(password, "Şifre", 6, 100, "PASSWORD");
      user.password = await bcrypt.hash(password, 10);
    }

    if (role && role !== user.role) {
      assertOneOf(role, "Rol", VALID_ROLES, "ROLE");
      if (user.role === "admin" && role !== "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          throw new AppError("Sistemdeki tek admin kullanıcısının rolü değiştirilemez", 400, "LAST_ADMIN_ROLE");
        }
      }
      user.role = role;
    }

    await user.save();
    const { password: _pw, ...safeUser } = user.toObject();
    return respond(req, res, 200, "USER_UPDATED", { user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("Kullanıcı bulunamadı", 404, "USER_NOT_FOUND");

    if (String(user._id) === String(req.user.userId)) {
      throw new AppError("Kendi hesabınızı silemezsiniz", 400, "SELF_DELETE");
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw new AppError("Sistemdeki tek admin kullanıcısı silinemez", 400, "LAST_ADMIN_DELETE");
      }
    }

    await User.deleteOne({ _id: user._id });
    return respond(req, res, 200, "USER_DELETED");
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    requireFields(req.body, ["currentPassword", "newPassword", "confirmPassword"]);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError("Yeni şifre ve onay şifresi eşleşmiyor", 400, "PASSWORD_MISMATCH");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&.])[A-Za-z\d@$!%*#?&.]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new AppError(
        "Yeni şifre en az 8 karakter olmalı ve bir harf, rakam ve özel karakter (@ $ ! % * # ? & .) içermelidir",
        400,
        "PASSWORD_WEAK"
      );
    }

    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("Kullanıcı bulunamadı", 404, "USER_NOT_FOUND");

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError("Mevcut şifre yanlış", 400, "CURRENT_PASSWORD_WRONG");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return respond(req, res, 200, "PASSWORD_UPDATED");
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    requireFields(req.body, ["identifier"]);
    const { identifier } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier.trim().toLowerCase() }, { username: identifier.trim() }],
    });
    if (!user) throw new AppError("Bu bilgilere sahip bir kullanıcı bulunamadı", 404, "USER_BY_IDENTIFIER_NOT_FOUND");

    if (user.resetPasswordExpires && user.resetPasswordExpires > Date.now()) {
      const remaining = Math.ceil((user.resetPasswordExpires - Date.now()) / 60000);
      throw new AppError(
        `Lütfen ${remaining} dakika bekleyin ve tekrar deneyin`,
        429,
        "FORGOT_PASSWORD_RATE_LIMIT",
        { minutes: remaining }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const lang = pickLang(req.headers["accept-language"]);
    const mailSubject = lang === "tr" ? "Şifre Sıfırlama" : "Password Reset";
    const mailGreeting = lang === "tr" ? `Merhaba ${user.username},` : `Hello ${user.username},`;
    const mailBody =
      lang === "tr"
        ? "Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:"
        : "Click the link below to reset your password:";
    const mailButton = lang === "tr" ? "Şifremi Sıfırla" : "Reset My Password";
    const mailExpiry =
      lang === "tr"
        ? "Bu bağlantı 5 dakika süreyle geçerlidir."
        : "This link is valid for 5 minutes.";
    const mailHeading = lang === "tr" ? "Şifre Sıfırlama" : "Password Reset";
    const fromName = lang === "tr" ? "Ödeme Onay Sistemi" : "Payment Approval System";

    await sendEmail({
      from: { name: fromName, address: process.env.EMAIL_USER },
      to: user.email,
      subject: mailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #004d8d;">${mailHeading}</h2>
          <p>${mailGreeting}</p>
          <p>${mailBody}</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #004d8d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${mailButton}</a>
          </p>
          <p>${mailExpiry}</p>
        </div>
      `,
    });

    return respond(req, res, 200, "RESET_LINK_SENT");
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    requireFields(req.body, ["password"]);
    const { password } = req.body;
    assertLength(password, "Şifre", 8, 100, "PASSWORD");

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) throw new AppError("Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı", 400, "RESET_TOKEN_INVALID");

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return respond(req, res, 200, "PASSWORD_UPDATED");
  } catch (err) {
    next(err);
  }
};

exports.verifyResetToken = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) throw new AppError("Geçersiz veya süresi dolmuş bağlantı", 400, "RESET_LINK_INVALID");
    return respond(req, res, 200, "TOKEN_VALID", { userId: user._id });
  } catch (err) {
    next(err);
  }
};
