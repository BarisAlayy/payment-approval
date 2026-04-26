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
  CircularProgress,
  Tooltip,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const RejectedPayments = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedCreditor, setSelectedCreditor] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payments", {
        params: { status: "rejected" }
      });
      const sortedPayments = response.data
        .filter(p => p.status === "rejected")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setPayments(sortedPayments);
    } catch (err) {
      notify.error(translateError(err, "rejectedPayments.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
          notify.error(t("rejectedPayments.invoiceDownloadError"));
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
    } catch {
      notify.error(t("rejectedPayments.invoiceDownloadError"));
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return "-";
    }
  };

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
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 3 }}
      >
        {t("common.back")}
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {t("rejectedPayments.title")}
      </Typography>

      {payments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary">
            {t("rejectedPayments.noRejected")}
          </Typography>
        </Paper>
      ) : (
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
                <TableCell>{t("rejectedPayments.table.creditor")}</TableCell>
                <TableCell>{t("rejectedPayments.table.accountName")}</TableCell>
                <TableCell>{t("rejectedPayments.table.iban")}</TableCell>
                <TableCell>{t("rejectedPayments.table.amount")}</TableCell>
                <TableCell>{t("rejectedPayments.table.paymentType")}</TableCell>
                <TableCell>{t("rejectedPayments.table.dueDate")}</TableCell>
                <TableCell>{t("rejectedPayments.table.description")}</TableCell>
                <TableCell>{t("rejectedPayments.table.createdBy")}</TableCell>
                <TableCell>{t("rejectedPayments.table.rejectedBy")}</TableCell>
                <TableCell>{t("rejectedPayments.table.rejectReason")}</TableCell>
                <TableCell>{t("rejectedPayments.table.invoice")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.creditorName}</TableCell>
                    <TableCell>{payment.accountName}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {payment.iban.replace(/(.{4})/g, "$1 ").trim()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "error.main" }}>
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
                        cursor: { xs: "pointer", md: "help" }
                      }}
                    >
                      {payment.description && (
                        <>
                          <Box
                            component="span"
                            sx={{ display: { xs: "inline", md: "none" } }}
                            onClick={() => handleOpenDescription(payment.description, payment.creditorName)}
                          >
                            {payment.description.length > 50
                              ? `${payment.description.substring(0, 50)}...`
                              : payment.description}
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
                              {payment.description.length > 50
                                ? `${payment.description.substring(0, 50)}...`
                                : payment.description}
                            </Box>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{payment.createdBy?.username}</TableCell>
                    <TableCell>{payment.rejectedBy?.username}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "200px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: { xs: "pointer", md: "help" }
                      }}
                    >
                      {payment.rejectedReason && (
                        <>
                          <Box
                            component="span"
                            sx={{ display: { xs: "inline", md: "none" } }}
                            onClick={() => handleOpenDescription(payment.rejectedReason, t("rejectedPayments.rejectReasonTitle"))}
                          >
                            {payment.rejectedReason.length > 50
                              ? `${payment.rejectedReason.substring(0, 50)}...`
                              : payment.rejectedReason}
                          </Box>
                          <Tooltip
                            title={payment.rejectedReason}
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
                              {payment.rejectedReason.length > 50
                                ? `${payment.rejectedReason.substring(0, 50)}...`
                                : payment.rejectedReason}
                            </Box>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.invoicePath && (
                        <Tooltip title={t("rejectedPayments.downloadInvoice")}>
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
      )}

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
          {selectedCreditor}{t("rejectedPayments.descriptionDialogSuffix")}
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

export default RejectedPayments;
