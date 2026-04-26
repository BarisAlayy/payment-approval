import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const PaymentEntry = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    creditorName: "",
    amount: "",
    description: "",
    accountName: "",
    iban: "",
    paymentType: "",
    dueDate: new Date().toISOString().split("T")[0]
  });
  const [selectedCreditor, setSelectedCreditor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCreditorType, setSelectedCreditorType] = useState(null);

  const canCreatePayment =
    user?.role === "admin" || user?.role === "boss" || user?.role === "finance";

  const fetchPaymentTypes = async () => {
    try {
      const response = await axiosInstance.get("/payment-types");
      setPaymentTypes(response.data);
    } catch {
      notify.error(t("paymentEntry.paymentTypesLoadError"));
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get("/suppliers");
      setSuppliers(response.data);
    } catch {
      /* noop */
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/employees");
      setEmployees(response.data);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
    fetchSuppliers();
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const numericValue = value.replace(/\D/g, '');

      if (!numericValue) {
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
        return;
      }

      const amount = Number(numericValue) / 100;

      setFormData(prev => ({
        ...prev,
        [name]: amount.toFixed(2)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDisplayAmount = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleCreditorSelect = (event, value, type) => {
    if (!value) {
      setSelectedCreditor(null);
      setSelectedCreditorType(null);
      setFormData((prev) => ({
        ...prev,
        creditorName: "",
        accountName: "",
        iban: ""
      }));
      return;
    }

    setSelectedCreditor({ ...value, type });
    setSelectedCreditorType(type);

    if (type === "supplier") {
      setFormData((prev) => ({
        ...prev,
        creditorName: value.name,
        accountName: value.name,
        iban: value.iban || ""
      }));
    } else if (type === "employee") {
      setFormData((prev) => ({
        ...prev,
        creditorName: `${value.firstName} ${value.lastName}`,
        accountName: `${value.firstName} ${value.lastName}`,
        iban: value.bankAccount?.iban || ""
      }));
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ibanRegex = /^TR\d{2}(\d{4}){5}\d{2}$/;
      const cleanIban = formData.iban.replace(/\s/g, "").toUpperCase();

      if (!ibanRegex.test(cleanIban)) {
        notify.error(t("paymentEntry.invalidIban"));
        return;
      }

      const response = await axiosInstance.post("/payments", {
        ...formData,
        iban: cleanIban,
        creditorType: selectedCreditor?.type,
        creditorId: selectedCreditor?._id
      });

      if (selectedFile) {
        const invoiceForm = new FormData();
        invoiceForm.append("invoice", selectedFile);
        await axiosInstance.post(
          `/payments/${response.data.payment.id}/upload-invoice`,
          invoiceForm,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
      }

      notify.success(t("paymentEntry.successMessage"));

      setFormData({
        creditorName: "",
        amount: "",
        description: "",
        accountName: "",
        iban: "",
        paymentType: "",
        dueDate: new Date().toISOString().split("T")[0]
      });
      setSelectedCreditor(null);
      setSelectedFile(null);
    } catch (error) {
      notify.error(translateError(error, "paymentEntry.errorMessage"));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, p: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ mb: 3 }}
        >
          {t("common.back")}
        </Button>

        <Typography variant="h5" sx={{ mb: 4 }}>
          {t("paymentEntry.title")}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("paymentEntry.creditorSelection")}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={(option) => option.name}
                      onChange={(event, value) =>
                        handleCreditorSelect(event, value, "supplier")
                      }
                      isOptionEqualToValue={(option, value) =>
                        option._id === value._id
                      }
                      disabled={selectedCreditorType === "employee"}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("paymentEntry.selectSupplier")}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={employees}
                      getOptionLabel={(option) =>
                        `${option.firstName} ${option.lastName}`
                      }
                      onChange={(event, value) =>
                        handleCreditorSelect(event, value, "employee")
                      }
                      isOptionEqualToValue={(option, value) =>
                        option._id === value._id
                      }
                      disabled={selectedCreditorType === "supplier"}
                      renderInput={(params) => (
                        <TextField {...params} label={t("paymentEntry.selectEmployee")} fullWidth />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.creditorName")}
                  name="creditorName"
                  value={formData.creditorName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.accountName")}
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.iban")}
                  name="iban"
                  value={formData.iban}
                  onChange={handleInputChange}
                  required
                  placeholder={t("common.ibanPlaceholder")}
                  inputProps={{
                    maxLength: 32
                  }}
                  helperText={t("paymentEntry.ibanHelper")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t("paymentEntry.paymentType")}</InputLabel>
                  <Select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    label={t("paymentEntry.paymentType")}
                  >
                    {paymentTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.amount")}
                  name="amount"
                  type="text"
                  value={formatDisplayAmount(formData.amount)}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₺</InputAdornment>
                    )
                  }}
                  placeholder={t("paymentEntry.amountPlaceholder")}
                  helperText={t("paymentEntry.amountHelper")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.dueDate")}
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("paymentEntry.description")}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("paymentEntry.invoice")}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mt: 1 }}
                >
                  {selectedFile ? selectedFile.name : t("paymentEntry.selectInvoice")}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {t("paymentEntry.selectedFile", { name: selectedFile.name })}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!canCreatePayment}
                >
                  {canCreatePayment ? t("paymentEntry.submit") : t("common.noPermission")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default PaymentEntry;
