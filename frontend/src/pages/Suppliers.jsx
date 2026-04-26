import React, { useState, useEffect } from "react";
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
  Tooltip
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
import { translateError } from "../utils/i18nError";

const Suppliers = () => {
  const notify = useNotify();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState({
    name: "",
    taxNumber: "",
    taxOffice: "",
    address: "",
    phone: "",
    email: "",
    contactPerson: "",
    description: "",
    iban: ""
  });

  const canManageSuppliers =
    user?.role === "admin" || user?.role === "boss" || user?.role === "finance";

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("/suppliers");
      setSuppliers(response.data);
    } catch {
      notify.error(t("suppliers.loadError"));
    }
  };

  const handleOpen = (mode, supplier = null) => {
    setFormMode(mode);
    if (supplier) {
      setFormData(supplier);
      setSelectedSupplier(supplier);
    } else {
      setFormData({
        name: "",
        taxNumber: "",
        taxOffice: "",
        address: "",
        phone: "",
        email: "",
        contactPerson: "",
        description: "",
        iban: ""
      });
    }
    setOpen(true);
  };

  const handleViewOpen = (supplier) => {
    setSelectedSupplier(supplier);
    setViewOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewOpen(false);
    setSelectedSupplier(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "taxNumber") {
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
      }
      return;
    }

    if (name === "iban") {
      const cleanValue = value.replace(/\s/g, '').toUpperCase();
      const formattedValue = cleanValue.replace(/(.{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.taxNumber.length !== 10) {
      notify.error(t("suppliers.taxNumberError"));
      return;
    }

    const cleanIban = formData.iban.replace(/\s/g, '');
    const ibanRegex = /^TR\d{2}(\d{4}){5}\d{2}$/;
    if (!ibanRegex.test(cleanIban)) {
      notify.error(t("suppliers.invalidIban"));
      return;
    }

    try {
      const submitData = { ...formData, iban: cleanIban };

      if (formMode === "create") {
        await axios.post("/suppliers", submitData);
        notify.success(t("suppliers.createSuccess"));
      } else {
        await axios.put(`/suppliers/${selectedSupplier._id}`, submitData);
        notify.success(t("suppliers.updateSuccess"));
      }
      handleClose();
      fetchSuppliers();
    } catch (error) {
      notify.error(translateError(error, "suppliers.operationError"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("suppliers.confirmDelete"))) {
      try {
        await axios.delete(`/suppliers/${id}`);
        notify.success(t("suppliers.deleteSuccess"));
        fetchSuppliers();
      } catch {
        notify.error(t("suppliers.deleteError"));
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("suppliers.title")}
        </Typography>
        {canManageSuppliers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen("create")}
          >
            {t("suppliers.newSupplier")}
          </Button>
        )}
      </Box>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("suppliers.table.name")}</TableCell>
                <TableCell>{t("suppliers.table.taxNumber")}</TableCell>
                <TableCell>{t("suppliers.table.taxOffice")}</TableCell>
                <TableCell>{t("suppliers.table.contactPerson")}</TableCell>
                <TableCell>{t("suppliers.table.phone")}</TableCell>
                <TableCell>{t("suppliers.table.email")}</TableCell>
                <TableCell>{t("suppliers.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.taxNumber}</TableCell>
                  <TableCell>{supplier.taxOffice}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>
                    <Tooltip
                      title={canManageSuppliers ? t("common.view") : t("common.onlyView")}
                    >
                      <IconButton
                        onClick={() => handleViewOpen(supplier)}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canManageSuppliers && (
                      <>
                        <Tooltip title={t("common.edit")}>
                          <IconButton
                            onClick={() => handleOpen("edit", supplier)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("common.delete")}>
                          <IconButton
                            onClick={() => handleDelete(supplier._id)}
                            size="small"
                          >
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
          {formMode === "create" ? t("suppliers.newSupplier") : t("suppliers.editSupplier")}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label={t("suppliers.form.name")}
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="taxNumber"
                  label={t("suppliers.form.taxNumber")}
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ maxLength: 10 }}
                  helperText={`${formData.taxNumber.length}/10`}
                  error={formData.taxNumber.length > 0 && formData.taxNumber.length !== 10}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="taxOffice"
                  label={t("suppliers.form.taxOffice")}
                  value={formData.taxOffice}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="contactPerson"
                  label={t("suppliers.form.contactPerson")}
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label={t("suppliers.form.phone")}
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
                  label={t("suppliers.form.email")}
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
                  label={t("suppliers.form.address")}
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label={t("suppliers.form.description")}
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="iban"
                  label={t("suppliers.form.iban")}
                  value={formData.iban}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  placeholder={t("common.ibanPlaceholder")}
                  inputProps={{ maxLength: 32 }}
                  helperText={t("suppliers.form.ibanHelper")}
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
        <DialogTitle>{t("suppliers.supplierDetails")}</DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.name")}</Typography>
                <Typography variant="body1">{selectedSupplier.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.taxNumber")}</Typography>
                <Typography variant="body1">{selectedSupplier.taxNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.taxOffice")}</Typography>
                <Typography variant="body1">{selectedSupplier.taxOffice}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.contactPerson")}</Typography>
                <Typography variant="body1">{selectedSupplier.contactPerson}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.phone")}</Typography>
                <Typography variant="body1">{selectedSupplier.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.email")}</Typography>
                <Typography variant="body1">{selectedSupplier.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">{t("suppliers.form.address")}</Typography>
                <Typography variant="body1">{selectedSupplier.address}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">{t("suppliers.form.description")}</Typography>
                <Typography variant="body1">
                  {selectedSupplier.description || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.details.createdBy")}</Typography>
                <Typography variant="body1">
                  {selectedSupplier.createdBy?.username || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.details.updatedBy")}</Typography>
                <Typography variant="body1">
                  {selectedSupplier.updatedBy?.username || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t("suppliers.form.iban")}</Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {selectedSupplier.iban?.replace(/(.{4})/g, '$1 ').trim() || "-"}
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

export default Suppliers;
