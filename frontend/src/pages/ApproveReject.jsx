import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  TablePagination,
  Card,
  CardContent
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError, translateServer } from "../utils/i18nError";

const ApproveReject = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const canApproveReject = user?.role === "admin" || user?.role === "boss";

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payments", {
        params: { status: "pending" }
      });
      setPayments(response.data);
    } catch (err) {
      notify.error(translateError(err, "approveReject.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (payment) => {
    try {
      const response = await axiosInstance.patch(`/payments/${payment._id}/approve`);
      if (response.data) {
        notify.success(t("approveReject.approveSuccess"));
        fetchPayments();
      }
    } catch (error) {
      notify.error(translateError(error, "approveReject.approveError"));
    }
  };

  const handleOpenRejectDialog = (payment) => {
    setSelectedPayment(payment);
    setRejectReason("");
    setOpenDialog(true);
  };

  const handleCloseModal = () => {
    setOpenDialog(false);
    setSelectedPayment(null);
    setRejectReason("");
  };

  const handleReject = async () => {
    try {
      await axiosInstance.patch(`/payments/${selectedPayment._id}/reject`, {
        reason: rejectReason
      });
      notify.success(t("approveReject.rejectSuccess"));
      handleCloseModal();
      fetchPayments();
    } catch (error) {
      notify.error(translateError(error, "approveReject.rejectError"));
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    try {
      const response = await axiosInstance.get(
        `/payments/${paymentId}/download-invoice`,
        { responseType: "blob" }
      );

      if (response.data.size === 0) {
        throw new Error(t("common.emptyFile"));
      }

      const contentType = response.headers["content-type"];
      if (contentType === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            notify.error(translateServer(errorData) || t("approveReject.invoiceDownloadError"));
          } catch {
            notify.error(t("approveReject.invoiceDownloadError"));
          }
        };
        reader.readAsText(response.data);
        return;
      }

      const contentDisposition = response.headers["content-disposition"];
      let filename = "invoice";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      let extension = ".pdf";
      if (contentType === "image/jpeg") extension = ".jpg";
      if (contentType === "image/png") extension = ".png";

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filename}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const fallback = error.response
        ? t("approveReject.invoiceDownloadErrorWithCode", {
            status: error.response.status,
            statusText: error.response.statusText
          })
        : t("approveReject.invoiceDownloadRetry");

      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            notify.error(translateServer(errorData) || fallback);
          } catch {
            notify.error(fallback);
          }
        };
        reader.readAsText(error.response.data);
      } else {
        notify.error(translateError(error) || fallback);
      }
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

  const MobilePaymentCard = ({ payment }) => {
    return (
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[2],
          "&:hover": {
            boxShadow: (theme) => theme.shadows[4]
          }
        }}
      >
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {payment.creditorName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "text.secondary",
                mb: 1
              }}
            >
              {t("approveReject.mobile.createdBy")}: {payment.createdBy?.username}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                color: "text.secondary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {payment.description}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                {t("approveReject.mobile.amount")}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: "success.main", fontWeight: "bold" }}
              >
                {formatCurrency(payment.amount)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                {t("approveReject.mobile.dueDate")}
              </Typography>
              <Typography variant="subtitle1">
                {formatDate(payment.dueDate)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                {t("approveReject.mobile.paymentType")}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {payment.paymentType?.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                {t("approveReject.mobile.iban")}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "monospace",
                  letterSpacing: 0.5
                }}
              >
                {payment.iban.replace(/(.{4})/g, "$1 ").trim()}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleApprove(payment)}
              startIcon={<CheckCircleIcon />}
              fullWidth
            >
              {t("approveReject.approve")}
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleOpenRejectDialog(payment)}
              startIcon={<CloseIcon />}
              fullWidth
            >
              {t("approveReject.reject")}
            </Button>
            {payment.invoicePath && (
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleDownloadInvoice(payment._id)}
                sx={{ flexShrink: 0 }}
              >
                <DownloadIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 3 }}
      >
        {t("common.back")}
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {t("approveReject.title")}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : payments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary">
            {t("approveReject.noPending")}
          </Typography>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
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
                    <TableCell>{t("approveReject.table.creditor")}</TableCell>
                    <TableCell>{t("approveReject.table.accountName")}</TableCell>
                    <TableCell>{t("approveReject.table.iban")}</TableCell>
                    <TableCell>{t("approveReject.table.amount")}</TableCell>
                    <TableCell>{t("approveReject.table.paymentType")}</TableCell>
                    <TableCell>{t("approveReject.table.dueDate")}</TableCell>
                    <TableCell>{t("approveReject.table.description")}</TableCell>
                    <TableCell>{t("approveReject.table.createdBy")}</TableCell>
                    <TableCell>{t("approveReject.table.invoice")}</TableCell>
                    <TableCell>{t("approveReject.table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment) => (
                      <TableRow
                        key={payment._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)"
                          }
                        }}
                      >
                        <TableCell>{payment.creditorName}</TableCell>
                        <TableCell>{payment.accountName}</TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.875rem"
                          }}
                        >
                          {payment.iban.replace(/(.{4})/g, "$1 ").trim()}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            color: "success.main"
                          }}
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
                            textOverflow: "ellipsis"
                          }}
                        >
                          <Tooltip
                            title={payment.description}
                            placement="top-start"
                            arrow
                            sx={{
                              maxWidth: "none",
                              "& .MuiTooltip-tooltip": {
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                                maxWidth: "500px",
                                whiteSpace: "pre-wrap"
                              }
                            }}
                          >
                            <Box component="span" sx={{ cursor: "help" }}>
                              {payment.description}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{payment.createdBy?.username}</TableCell>
                        <TableCell>
                          {payment.invoicePath && (
                            <Tooltip title={t("approveReject.downloadInvoice")}>
                              <IconButton
                                color="primary"
                                onClick={() => handleDownloadInvoice(payment._id)}
                                size="small"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip
                              title={
                                canApproveReject
                                  ? t("approveReject.approve")
                                  : t("common.noPermission")
                              }
                            >
                              <span>
                                <IconButton
                                  color="success"
                                  onClick={() => handleApprove(payment)}
                                  disabled={!canApproveReject}
                                  size="small"
                                >
                                  <CheckIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                canApproveReject
                                  ? t("approveReject.reject")
                                  : t("common.noPermission")
                              }
                            >
                              <span>
                                <IconButton
                                  color="error"
                                  onClick={() => handleOpenRejectDialog(payment)}
                                  disabled={!canApproveReject}
                                  size="small"
                                >
                                  <CloseIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {payments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((payment) => (
                <MobilePaymentCard key={payment._id} payment={payment} />
              ))}
          </Box>

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
        </>
      )}

      <Dialog
        open={openDialog}
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
          {t("approveReject.paymentDetails")}
        </DialogTitle>
        {selectedPayment && (
          <DialogContent
            sx={{
              mt: 2,
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 }
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("approveReject.companyName")}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedPayment.creditorName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("approveReject.amount")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: "success.main"
                    }}
                  >
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("approveReject.description")}
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.description || t("common.dash")}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 600 }}
                gutterBottom
              >
                {t("approveReject.rejectReason")}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                multiline
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                placeholder={t("approveReject.rejectReasonPlaceholder")}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5
                  }
                }}
              />
            </Box>
          </DialogContent>
        )}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTop: "1px solid",
            borderColor: "divider",
            gap: 1
          }}
        >
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              px: 3,
              "&:hover": {
                backgroundColor: "grey.50"
              }
            }}
          >
            {t("approveReject.dismiss")}
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim()}
            sx={{
              borderRadius: 1.5,
              px: 3,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" }
            }}
          >
            {t("approveReject.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApproveReject;
