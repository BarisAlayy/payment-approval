const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { respond } = require("../utils/response");
const { requireFields, assertLength } = require("../utils/validate");

exports.register = async (req, res, next) => {
  try {
    requireFields(req.body, ["username", "password", "role"]);
    const { username, password, role } = req.body;
    assertLength(username, "Kullanıcı adı", 3, 50, "USERNAME");
    assertLength(password, "Şifre", 6, 100, "PASSWORD");

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) throw new AppError("Bu kullanıcı adı zaten kullanılıyor", 409, "USERNAME_TAKEN");

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username: username.trim(), password: hashedPassword, role });

    return respond(req, res, 201, "USER_CREATED");
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    requireFields(req.body, ["username", "password"]);
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.trim() });
    if (!user) throw new AppError("Kullanıcı adı veya şifre hatalı", 401, "INVALID_CREDENTIALS");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Kullanıcı adı veya şifre hatalı", 401, "INVALID_CREDENTIALS");

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "3h" });

    return respond(req, res, 200, "LOGIN_SUCCESS", {
      token,
      user: { _id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new AppError("Token bulunamadı", 401, "TOKEN_MISSING");

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw new AppError("Kullanıcı bulunamadı", 401, "USER_NOT_FOUND");

    return respond(req, res, 200, "TOKEN_VALID", { user });
  } catch (err) {
    next(err);
  }
};
