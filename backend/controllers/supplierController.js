const Supplier = require("../models/supplierModel");
const AppError = require("../utils/AppError");
const { requireFields } = require("../utils/validate");
const { respond } = require("../utils/response");

const SUPPLIER_FIELDS = [
  "name",
  "taxNumber",
  "taxOffice",
  "address",
  "phone",
  "email",
  "contactPerson",
  "description",
  "status",
];

const populateSupplier = (query) =>
  query.populate("createdBy", "username").populate("updatedBy", "username");

exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await populateSupplier(Supplier.find()).sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (err) {
    next(err);
  }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await populateSupplier(Supplier.findById(req.params.id));
    if (!supplier) throw new AppError("Tedarikçi bulunamadı", 404, "SUPPLIER_NOT_FOUND");
    res.status(200).json(supplier);
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "taxNumber"]);

    const existing = await Supplier.findOne({ taxNumber: req.body.taxNumber });
    if (existing) throw new AppError("Bu vergi numarası ile kayıtlı bir tedarikçi mevcut", 409, "SUPPLIER_TAX_DUPLICATE");

    const supplier = await Supplier.create({
      ...Object.fromEntries(SUPPLIER_FIELDS.map((f) => [f, req.body[f]])),
      createdBy: req.user.userId,
    });

    const populated = await populateSupplier(Supplier.findById(supplier._id));
    return respond(req, res, 201, "SUPPLIER_CREATED", { supplier: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) throw new AppError("Tedarikçi bulunamadı", 404, "SUPPLIER_NOT_FOUND");

    if (req.body.taxNumber && req.body.taxNumber !== supplier.taxNumber) {
      const existing = await Supplier.findOne({ taxNumber: req.body.taxNumber });
      if (existing) {
        throw new AppError("Bu vergi numarası ile kayıtlı başka bir tedarikçi mevcut", 409, "SUPPLIER_TAX_DUPLICATE_OTHER");
      }
    }

    SUPPLIER_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) supplier[f] = req.body[f];
    });
    supplier.updatedBy = req.user.userId;
    await supplier.save();

    const populated = await populateSupplier(Supplier.findById(supplier._id));
    return respond(req, res, 200, "SUPPLIER_UPDATED", { supplier: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) throw new AppError("Tedarikçi bulunamadı", 404, "SUPPLIER_NOT_FOUND");
    await Supplier.deleteOne({ _id: supplier._id });
    return respond(req, res, 200, "SUPPLIER_DELETED");
  } catch (err) {
    next(err);
  }
};
