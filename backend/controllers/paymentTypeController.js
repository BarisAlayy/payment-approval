const PaymentType = require("../models/paymentTypeModel");
const AppError = require("../utils/AppError");
const { requireFields, assertLength } = require("../utils/validate");
const { respond } = require("../utils/response");

const TR_COLLATION = { locale: "tr", strength: 2 };

const populatePaymentType = (query) =>
  query.populate("createdBy", "username").populate("updatedBy", "username");

const findDuplicateName = (name, excludeId) => {
  const filter = {
    name: { $regex: new RegExp(`^${name}$`, "i") },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return PaymentType.findOne(filter).collation(TR_COLLATION);
};

exports.createPaymentType = async (req, res, next) => {
  try {
    requireFields(req.body, ["name"]);
    const name = req.body.name.trim();
    assertLength(name, "Ödeme türü adı", 2, 100, "PAYMENT_TYPE_NAME");

    const existing = await findDuplicateName(name);
    if (existing) throw new AppError("Bu isimde bir ödeme türü zaten mevcut", 409, "PAYMENT_TYPE_DUPLICATE");

    const paymentType = await PaymentType.create({
      name,
      description: req.body.description?.trim(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const populated = await populatePaymentType(PaymentType.findById(paymentType._id));
    return respond(req, res, 201, "PAYMENT_TYPE_CREATED", { paymentType: populated });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentTypes = async (req, res, next) => {
  try {
    const paymentTypes = await populatePaymentType(PaymentType.find({ isActive: true }))
      .sort({ name: 1 })
      .collation(TR_COLLATION);
    res.status(200).json(paymentTypes);
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentType = async (req, res, next) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) throw new AppError("Ödeme türü bulunamadı", 404, "PAYMENT_TYPE_NOT_FOUND");

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      assertLength(name, "Ödeme türü adı", 2, 100, "PAYMENT_TYPE_NAME");
      if (name !== paymentType.name) {
        const existing = await findDuplicateName(name, paymentType._id);
        if (existing) throw new AppError("Bu isimde bir ödeme türü zaten mevcut", 409, "PAYMENT_TYPE_DUPLICATE");
        paymentType.name = name;
      }
    }

    if (req.body.description !== undefined) {
      paymentType.description = (req.body.description || "").trim();
    }

    if (req.body.isActive !== undefined) {
      paymentType.isActive = Boolean(req.body.isActive);
    }

    paymentType.updatedBy = req.user.userId;
    await paymentType.save();

    const populated = await populatePaymentType(PaymentType.findById(paymentType._id));
    return respond(req, res, 200, "PAYMENT_TYPE_UPDATED", { paymentType: populated });
  } catch (err) {
    next(err);
  }
};

exports.deletePaymentType = async (req, res, next) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) throw new AppError("Ödeme türü bulunamadı", 404, "PAYMENT_TYPE_NOT_FOUND");
    paymentType.isActive = false;
    paymentType.updatedBy = req.user.userId;
    await paymentType.save();
    return respond(req, res, 200, "PAYMENT_TYPE_DELETED");
  } catch (err) {
    next(err);
  }
};
