import React, { useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  TablePagination,
  DialogContentText
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const ApprovedPayments = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [descriptionDialog, setDescriptionDialog] = useState({
    open: false,
    text: "",
    title: ""
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedCreditor, setSelectedCreditor] = useState("");

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  const fetchApprovedPayments = async () => {
    try {
      const res = await axiosInstance.get("/payments");
      const all = res.data;
      const approved = all
        .filter((p) => p.status === "approved")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setPayments(approved);
    } catch (err) {
      notify.error(translateError(err, "approvedPayments.loadError"));
    }
  };

  useEffect(() => {
    fetchApprovedPayments();
  }, []);

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setSelectedFile(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPayment(null);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleCopyIban = async (iban) => {
    try {
      await navigator.clipboard.writeText(iban);
      notify.success(t("approvedPayments.ibanCopied"));
    } catch {
      notify.error(t("approvedPayments.ibanCopyError"));
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedPayment) return;

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await axiosInstance.patch(
        `/payments/${selectedPayment._id}/complete`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      notify.success(t("approvedPayments.completeSuccess"));

      setPayments(payments.filter((p) => p._id !== selectedPayment._id));
      handleCloseModal();
    } catch (err) {
      notify.error(translateError(err, "approvedPayments.completeError"));
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "TRY"
    }).format(amount);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleOpenDescription = (description, creditor) => {
    setSelectedDescription(description);
    setSelectedCreditor(creditor);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, p: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          {t("common.back")}
        </Button>

        <Typography variant="h5" sx={{ mb: 2 }}>
          {t("approvedPayments.title")}
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            maxWidth: "100%",
            overflowX: "auto",
            "&::-webkit-scrollbar": { height: 10 },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "background.default",
              borderRadius: 2
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "primary.light",
              borderRadius: 2,
              "&:hover": { backgroundColor: "primary.main" }
            }
          }}
        >
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t("approvedPayments.table.creditor")}</TableCell>
                <TableCell>{t("approvedPayments.table.accountName")}</TableCell>
                <TableCell>{t("approvedPayments.table.iban")}</TableCell>
                <TableCell>{t("approvedPayments.table.amount")}</TableCell>
                <TableCell>{t("approvedPayments.table.paymentType")}</TableCell>
                <TableCell>{t("approvedPayments.table.dueDate")}</TableCell>
                <TableCell>{t("approvedPayments.table.description")}</TableCell>
                <TableCell>{t("approvedPayments.table.createdBy")}</TableCell>
                <TableCell>{t("approvedPayments.table.approvedBy")}</TableCell>
                <TableCell>{t("approvedPayments.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment) => (
                  <TableRow
                    key={payment._id}
                    onClick={() => handleRowClick(payment)}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                      cursor: "pointer"
                    }}
                  >
                    <TableCell>{payment.creditorName}</TableCell>
                    <TableCell>{payment.accountName}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 1
                      }}
                    >
                      {payment.iban.replace(/(.{4})/g, "$1 ").trim()}
                      <Tooltip title={t("approvedPayments.copyIban")}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyIban(payment.iban);
                          }}
                          sx={{ ml: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 500, color: "success.main" }}
                    >
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{payment.paymentType?.name}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "200px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: { xs: "pointer", md: "default" }
                      }}
                    >
                      {payment.description && payment.description.length > 100 ? (
                        <>
                          <Box
                            component="span"
                            sx={{ display: { xs: "inline", md: "none" } }}
                            onClick={() => handleOpenDescription(payment.description, payment.creditorName)}
                          >
                            {payment.description.substring(0, 100)}...
                          </Box>
                          <Tooltip
                            title={payment.description}
                            placement="top-start"
                            arrow
                            sx={{
                              display: { xs: "none", md: "inline-block" },
                              maxWidth: "none",
                              "& .MuiTooltip-tooltip": {
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                                maxWidth: "500px",
                                whiteSpace: "pre-wrap"
                              }
                            }}
                          >
                            <Box component="span">
                              {payment.description.substring(0, 100)}...
                            </Box>
                          </Tooltip>
                        </>
                      ) : (
                        payment.description
                      )}
                    </TableCell>
                    <TableCell>{payment.createdBy?.username}</TableCell>
                    <TableCell>{payment.approvedBy?.username}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(payment);
                        }}
                        size="small"
                        sx={{
                          bgcolor: "primary.lighter",
                          "&:hover": { bgcolor: "primary.light" }
                        }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={payments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}`
            }
          />
        </TableContainer>
      </Box>

      <Dialog
        open={descriptionDialog.open}
        onClose={() => setDescriptionDialog({ ...descriptionDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{descriptionDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {descriptionDialog.text}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescriptionDialog({ ...descriptionDialog, open: false })}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)"
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTypography-root": {
              fontSize: { xs: "1.2rem", sm: "1.4rem" },
              fontWeight: 600
            }
          }}
        >
          {t("approvedPayments.paymentDetails")}
        </DialogTitle>
        {selectedPayment && (
          <DialogContent
            sx={{
              mt: 2,
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 }
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.creditor")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedPayment.creditorName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.accountName")}
                </Typography>
                <Typography variant="body1">{selectedPayment.accountName}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.iban")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {selectedPayment.iban.replace(/(.{4})/g, "$1 ").trim()}
                  </Typography>
                  <Tooltip title={t("approvedPayments.copyIban")}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyIban(selectedPayment.iban);
                      }}
                      sx={{ color: "primary.main" }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.amount")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                  {formatCurrency(selectedPayment.amount)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.paymentType")}
                </Typography>
                <Typography variant="body1">{selectedPayment.paymentType?.name}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.dueDate")}
                </Typography>
                <Typography variant="body1">{formatDate(selectedPayment.dueDate)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.createdAt")}
                </Typography>
                <Typography variant="body1">{formatDate(selectedPayment.createdAt)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.createdBy")}
                </Typography>
                <Typography variant="body1">{selectedPayment.createdBy?.username}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.approvedBy")}
                </Typography>
                <Typography variant="body1">{selectedPayment.approvedBy?.username}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("approvedPayments.description")}
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.description || t("common.dash")}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  color: "text.primary"
                }}
              >
                {t("approvedPayments.paymentDocument")}
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  mt: 2,
                  color: "primary.main",
                  borderColor: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.lighter"
                  }
                }}
              >
                {selectedFile ? selectedFile.name : t("approvedPayments.selectPaymentDocument")}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseModal} variant="outlined" color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCompletePayment}
            variant="contained"
            color="primary"
            disabled={!selectedFile}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": { bgcolor: "action.disabledBackground" }
            }}
          >
            {t("approvedPayments.completePayment")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            margin: { xs: "16px", sm: "32px" },
            width: "calc(100% - 32px)",
            maxHeight: "calc(100% - 32px)"
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {selectedCreditor}{t("approvedPayments.descriptionDialogSuffix")}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
            {selectedDescription}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ApprovedPayments;
