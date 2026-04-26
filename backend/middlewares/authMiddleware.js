const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Yetkilendirme başarısız: Token bulunamadı", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw new AppError("Yetkilendirme başarısız: Kullanıcı bulunamadı", 401, "UNAUTHORIZED_USER");

    req.user = { userId: user._id, username: user.username, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

exports.checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError("Bu işlem için yetkiniz bulunmuyor", 403, "FORBIDDEN"));
  }
  next();
};
