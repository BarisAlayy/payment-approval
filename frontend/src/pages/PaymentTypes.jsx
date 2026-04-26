import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { translateError } from "../utils/i18nError";

const PaymentTypes = () => {
  const notify = useNotify();
  const { t } = useTranslation();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchPaymentTypes = async () => {
    try {
      const response = await axiosInstance.get("/payment-types");
      setPaymentTypes(response.data);
    } catch {
      notify.error(t("paymentTypes.loadError"));
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || ""
      });
    } else {
      setEditingType(null);
      setFormData({ name: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
    setFormData({ name: "", description: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axiosInstance.put(`/payment-types/${editingType.id}`, formData);
        notify.success(t("paymentTypes.updateSuccess"));
      } else {
        await axiosInstance.post("/payment-types", formData);
        notify.success(t("paymentTypes.createSuccess"));
      }
      handleCloseDialog();
      fetchPaymentTypes();
    } catch (error) {
      notify.error(translateError(error, "paymentTypes.operationError"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("paymentTypes.confirmDelete"))) {
      try {
        await axiosInstance.delete(`/payment-types/${id}`);
        notify.success(t("paymentTypes.deleteSuccess"));
        fetchPaymentTypes();
      } catch {
        notify.error(t("paymentTypes.deleteError"));
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">{t("paymentTypes.title")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t("paymentTypes.newType")}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("paymentTypes.table.name")}</TableCell>
              <TableCell>{t("paymentTypes.table.description")}</TableCell>
              <TableCell>{t("paymentTypes.table.createdBy")}</TableCell>
              <TableCell align="right">{t("paymentTypes.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentTypes.map((type) => (
              <TableRow key={type._id}>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.description}</TableCell>
                <TableCell>{type.createdBy?.username}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(type)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(type.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingType ? t("paymentTypes.editType") : t("paymentTypes.newType")}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label={t("paymentTypes.form.name")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t("paymentTypes.form.description")}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t("common.cancel")}</Button>
            <Button type="submit" variant="contained">
              {editingType ? t("common.update") : t("common.create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PaymentTypes;
