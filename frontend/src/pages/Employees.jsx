import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  MenuItem
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import axios from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const Employees = () => {
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { user } = useAuth();

  const statusOptions = useMemo(
    () => [
      { value: "active", label: t("status.active") },
      { value: "passive", label: t("status.passive") },
      { value: "onLeave", label: t("status.onLeave") },
    ],
    [t]
  );

  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    identityNumber: "",
    birthDate: "",
    startDate: "",
    department: "",
    position: "",
    phone: "",
    email: "",
    address: "",
    status: "active",
    bankAccount: {
      bankName: "",
      branchName: "",
      accountNumber: "",
      iban: ""
    }
  });

  const canManageEmployees =
    user?.role === "admin" || user?.role === "boss" || user?.role === "finance";

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/employees");
      setEmployees(response.data);
    } catch {
      notify.error(t("employees.loadError"));
    }
  };

  const handleOpen = (mode, employee = null) => {
    setFormMode(mode);
    if (employee) {
      setFormData({
        ...employee,
        birthDate: employee.birthDate.split("T")[0],
        startDate: employee.startDate.split("T")[0]
      });
      setSelectedEmployee(employee);
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        identityNumber: "",
        birthDate: "",
        startDate: "",
        department: "",
        position: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
        bankAccount: {
          bankName: "",
          branchName: "",
          accountNumber: "",
          iban: ""
        }
      });
    }
    setOpen(true);
  };

  const handleViewOpen = (employee) => {
    setSelectedEmployee(employee);
    setViewOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewOpen(false);
    setSelectedEmployee(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "identityNumber") {
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 11) {
        setFormData(prev => ({ ...prev, identityNumber: cleanValue }));
      }
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.identityNumber.length !== 11) {
      notify.error(t("employees.identityLengthError"));
      return;
    }

    try {
      if (formMode === "create") {
        await axios.post("/employees", formData);
        notify.success(t("employees.createSuccess"));
      } else {
        await axios.put(`/employees/${selectedEmployee._id}`, formData);
        notify.success(t("employees.updateSuccess"));
      }
      handleClose();
      fetchEmployees();
    } catch (error) {
      notify.error(translateError(error, "employees.operationError"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("employees.confirmDelete"))) {
      try {
        await axios.delete(`/employees/${id}`);
        notify.success(t("employees.deleteSuccess"));
        fetchEmployees();
      } catch {
        notify.error(t("employees.deleteError"));
      }
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("employees.title")}
        </Typography>
        {canManageEmployees && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen("create")}
          >
            {t("employees.newEmployee")}
          </Button>
        )}
      </Box>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("employees.table.fullName")}</TableCell>
                <TableCell>{t("employees.table.identityNumber")}</TableCell>
                <TableCell>{t("employees.table.department")}</TableCell>
                <TableCell>{t("employees.table.position")}</TableCell>
                <TableCell>{t("employees.table.phone")}</TableCell>
                <TableCell>{t("employees.table.status")}</TableCell>
                <TableCell>{t("employees.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                  <TableCell>{employee.identityNumber}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{getStatusLabel(employee.status)}</TableCell>
                  <TableCell>
                    <Tooltip
                      title={canManageEmployees ? t("common.view") : t("common.onlyView")}
                    >
                      <IconButton onClick={() => handleViewOpen(employee)} size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canManageEmployees && (
                      <>
                        <Tooltip title={t("common.edit")}>
                          <IconButton onClick={() => handleOpen("edit", employee)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("common.delete")}>
                          <IconButton onClick={() => handleDelete(employee._id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === "create" ? t("employees.newEmployee") : t("employees.editEmployee")}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label={t("employees.form.firstName")}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label={t("employees.form.lastName")}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="identityNumber"
                  label={t("employees.form.identityNumber")}
                  value={formData.identityNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ maxLength: 11 }}
                  helperText={`${formData.identityNumber.length}/11`}
                  error={formData.identityNumber.length > 0 && formData.identityNumber.length !== 11}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="birthDate"
                  label={t("employees.form.birthDate")}
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="startDate"
                  label={t("employees.form.startDate")}
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="department"
                  label={t("employees.form.department")}
                  value={formData.department}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="position"
                  label={t("employees.form.position")}
                  value={formData.position}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="status"
                  select
                  label={t("employees.form.status")}
                  value={formData.status}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label={t("employees.form.phone")}
                  value={formData.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label={t("employees.form.email")}
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label={t("employees.form.address")}
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  multiline
                  rows={2}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("employees.form.bankInfo")}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bankAccount.bankName"
                  label={t("employees.form.bankName")}
                  value={formData.bankAccount.bankName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bankAccount.branchName"
                  label={t("employees.form.branchName")}
                  value={formData.bankAccount.branchName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bankAccount.accountNumber"
                  label={t("employees.form.accountNumber")}
                  value={formData.bankAccount.accountNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bankAccount.iban"
                  label={t("employees.form.iban")}
                  value={formData.bankAccount.iban}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" variant="contained">
              {formMode === "create" ? t("common.create") : t("common.update")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={viewOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{t("employees.employeeDetails")}</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.table.fullName")}</Typography>
                <Typography variant="body1">
                  {`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.identityNumber")}</Typography>
                <Typography variant="body1">{selectedEmployee.identityNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.birthDate")}</Typography>
                <Typography variant="body1">
                  {new Date(selectedEmployee.birthDate).toLocaleDateString(locale)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.startDate")}</Typography>
                <Typography variant="body1">
                  {new Date(selectedEmployee.startDate).toLocaleDateString(locale)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.department")}</Typography>
                <Typography variant="body1">{selectedEmployee.department}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.position")}</Typography>
                <Typography variant="body1">{selectedEmployee.position}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.phone")}</Typography>
                <Typography variant="body1">{selectedEmployee.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.email")}</Typography>
                <Typography variant="body1">{selectedEmployee.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">{t("employees.form.address")}</Typography>
                <Typography variant="body1">{selectedEmployee.address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.status")}</Typography>
                <Typography variant="body1">{getStatusLabel(selectedEmployee.status)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  {t("employees.form.bankInfo")}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.bankName")}</Typography>
                <Typography variant="body1">{selectedEmployee.bankAccount.bankName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.branchName")}</Typography>
                <Typography variant="body1">{selectedEmployee.bankAccount.branchName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.accountNumber")}</Typography>
                <Typography variant="body1">{selectedEmployee.bankAccount.accountNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("employees.form.iban")}</Typography>
                <Typography variant="body1">{selectedEmployee.bankAccount.iban}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("common.createdBy")}</Typography>
                <Typography variant="body1">
                  {selectedEmployee.createdBy?.username || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("common.updatedBy")}</Typography>
                <Typography variant="body1">
                  {selectedEmployee.updatedBy?.username || "-"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("common.close")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
