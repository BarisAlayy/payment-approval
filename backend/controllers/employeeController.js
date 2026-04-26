const Employee = require("../models/employeeModel");
const AppError = require("../utils/AppError");
const { requireFields } = require("../utils/validate");
const { respond } = require("../utils/response");

const EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "identityNumber",
  "birthDate",
  "startDate",
  "department",
  "position",
  "phone",
  "email",
  "address",
  "status",
  "salary",
  "bankAccount",
  "emergencyContact",
];

const populateEmployee = (query) =>
  query.populate("createdBy", "username").populate("updatedBy", "username");

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await populateEmployee(Employee.find()).sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    next(err);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await populateEmployee(Employee.findById(req.params.id));
    if (!employee) throw new AppError("Personel bulunamadı", 404, "EMPLOYEE_NOT_FOUND");
    res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    requireFields(req.body, ["firstName", "lastName", "identityNumber"]);

    const existing = await Employee.findOne({ identityNumber: req.body.identityNumber });
    if (existing) throw new AppError("Bu kimlik numarası ile kayıtlı bir personel mevcut", 409, "EMPLOYEE_IDENTITY_DUPLICATE");

    const employee = await Employee.create({
      ...Object.fromEntries(EMPLOYEE_FIELDS.map((f) => [f, req.body[f]])),
      createdBy: req.user.userId,
    });

    const populated = await populateEmployee(Employee.findById(employee._id));
    return respond(req, res, 201, "EMPLOYEE_CREATED", { employee: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new AppError("Personel bulunamadı", 404, "EMPLOYEE_NOT_FOUND");

    if (req.body.identityNumber && req.body.identityNumber !== employee.identityNumber) {
      const existing = await Employee.findOne({ identityNumber: req.body.identityNumber });
      if (existing) {
        throw new AppError("Bu kimlik numarası ile kayıtlı başka bir personel mevcut", 409, "EMPLOYEE_IDENTITY_DUPLICATE_OTHER");
      }
    }

    EMPLOYEE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) employee[f] = req.body[f];
    });
    employee.updatedBy = req.user.userId;
    await employee.save();

    const populated = await populateEmployee(Employee.findById(employee._id));
    return respond(req, res, 200, "EMPLOYEE_UPDATED", { employee: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new AppError("Personel bulunamadı", 404, "EMPLOYEE_NOT_FOUND");
    await Employee.deleteOne({ _id: employee._id });
    return respond(req, res, 200, "EMPLOYEE_DELETED");
  } catch (err) {
    next(err);
  }
};
