import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = { username: "", email: "", password: "", role: "purchaser" };

const AdminPanel = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { user: currentUser } = useAuth();

  const roleOptions = useMemo(
    () => [
      { value: "admin", label: t("roles.admin") },
      { value: "boss", label: t("roles.boss") },
      { value: "finance", label: t("roles.finance") },
      { value: "purchaser", label: t("roles.purchaser") },
    ],
    [t]
  );

  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (err) {
      notify.error(translateError(err, "adminPanel.loadError"));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpen = (mode, user = null) => {
    setFormMode(mode);
    if (user) {
      setFormData({ username: user.username, email: user.email, password: "", role: user.role });
      setSelectedUser(user);
    } else {
      setFormData(initialForm);
    }
    setOpen(true);
  };

  const handleViewOpen = (user) => {
    setSelectedUser(user);
    setViewOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewOpen(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(formData.email)) {
      notify.error(t("adminPanel.invalidEmail"));
      return;
    }

    setSubmitting(true);
    try {
      if (formMode === "create") {
        await axios.post("/users", formData);
        notify.success(t("adminPanel.createSuccess"));
      } else {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await axios.put(`/users/${selectedUser._id}`, updateData);
        notify.success(t("adminPanel.updateSuccess"));
      }
      handleClose();
      fetchUsers();
    } catch (err) {
      notify.error(translateError(err, "adminPanel.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/users/${id}`);
      notify.success(t("adminPanel.deleteSuccess"));
      fetchUsers();
    } catch (err) {
      notify.error(translateError(err, "adminPanel.deleteError"));
    }
  };

  const getRoleLabel = (role) => roleOptions.find((opt) => opt.value === role)?.label || role;

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        {t("common.back")}
      </Button>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t("adminPanel.title")}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("adminPanel.userManagement")}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen("create")}>
          {t("adminPanel.newUser")}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("adminPanel.table.username")}</TableCell>
              <TableCell>{t("adminPanel.table.email")}</TableCell>
              <TableCell>{t("adminPanel.table.role")}</TableCell>
              <TableCell>{t("adminPanel.table.createdAt")}</TableCell>
              <TableCell>{t("adminPanel.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleLabel(user.role)}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString(locale)}</TableCell>
                <TableCell>
                  <Tooltip title={t("adminPanel.tooltipView")}>
                    <IconButton onClick={() => handleViewOpen(user)} size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("adminPanel.tooltipEdit")}>
                    <IconButton onClick={() => handleOpen("edit", user)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {String(user._id) !== String(currentUser?._id) && (
                    <Tooltip title={t("adminPanel.tooltipDelete")}>
                      <IconButton onClick={() => handleDelete(user._id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === "create" ? t("adminPanel.newUser") : t("adminPanel.editUser")}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("adminPanel.form.username")}
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  inputProps={{ minLength: 3, maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("adminPanel.form.email")}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder={t("adminPanel.form.emailPlaceholder")}
                  helperText={t("adminPanel.form.emailHelper")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("adminPanel.form.password")}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={formMode === "create"}
                  inputProps={{ minLength: formMode === "create" ? 6 : 0 }}
                  helperText={
                    formMode === "edit"
                      ? t("adminPanel.form.passwordHelperEdit")
                      : t("adminPanel.form.passwordHelperCreate")
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label={t("adminPanel.form.role")}
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {formMode === "create" ? t("adminPanel.create") : t("adminPanel.update")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={viewOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("adminPanel.userDetails")}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">{t("adminPanel.form.username")}</Typography>
                <Typography variant="body1">{selectedUser.username}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">{t("adminPanel.form.email")}</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">{t("adminPanel.form.role")}</Typography>
                <Typography variant="body1">{getRoleLabel(selectedUser.role)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">{t("adminPanel.table.createdAt")}</Typography>
                <Typography variant="body1">
                  {new Date(selectedUser.createdAt).toLocaleDateString(locale)}
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

export default AdminPanel;
