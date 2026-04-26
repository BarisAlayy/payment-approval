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
  IconButton,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import { translateError } from "../utils/i18nError";

const CompletedPayments = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedCreditor, setSelectedCreditor] = useState("");

  const fetchCompletedPayments = async () => {
    try {
      const res = await axiosInstance.get("/payments");
      const all = res.data;
      const completed = all
        .filter((p) => p.status === "completed")
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      setPayments(completed);
    } catch (err) {
      notify.error(translateError(err, "completedPayments.loadError"));
    }
  };

  useEffect(() => {
    fetchCompletedPayments();
  }, []);

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  const handleDownloadProof = async (paymentId) => {
    try {
      const response = await axiosInstance.get(
        `/payments/${paymentId}/download-proof`,
        { responseType: "blob" }
      );

      if (response.data.size === 0) {
        throw new Error(t("common.emptyFile"));
      }

      const contentType = response.headers["content-type"];
      if (contentType === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
          notify.error(t("completedPayments.downloadError"));
        };
        reader.readAsText(response.data);
        return;
      }

      const contentDisposition = response.headers["content-disposition"];
      let filename = "payment_document";

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

      notify.success(t("completedPayments.downloadSuccess"));
    } catch (err) {
      notify.error(translateError(err, "completedPayments.downloadError"));
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  const formatDate = (date) => new Date(date).toLocaleDateString(locale);

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
          {t("completedPayments.title")}
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
                <TableCell sx={{ width: "12%", p: 1.5 }}>{t("completedPayments.table.creditor")}</TableCell>
                <TableCell sx={{ width: "10%", p: 1.5 }}>{t("completedPayments.table.accountName")}</TableCell>
                <TableCell sx={{ width: "15%", p: 1.5 }}>{t("completedPayments.table.iban")}</TableCell>
                <TableCell sx={{ width: "8%", p: 1.5 }}>{t("completedPayments.table.amount")}</TableCell>
                <TableCell sx={{ width: "8%", p: 1.5 }}>{t("completedPayments.table.paymentType")}</TableCell>
                <TableCell sx={{ width: "8%", p: 1.5 }}>{t("completedPayments.table.dueDate")}</TableCell>
                <TableCell sx={{ width: "8%", p: 1.5 }}>{t("completedPayments.table.paidAt")}</TableCell>
                <TableCell sx={{ width: "12%", p: 1.5 }}>{t("completedPayments.table.description")}</TableCell>
                <TableCell sx={{ width: "7%", p: 1.5 }}>{t("completedPayments.table.createdBy")}</TableCell>
                <TableCell sx={{ width: "7%", p: 1.5 }}>{t("completedPayments.table.approvedBy")}</TableCell>
                <TableCell sx={{ width: "7%", p: 1.5 }}>{t("completedPayments.table.completedBy")}</TableCell>
                <TableCell sx={{ width: "5%", p: 1.5 }}>{t("completedPayments.table.document")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment) => (
                  <TableRow
                    key={payment._id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" }
                    }}
                  >
                    <TableCell sx={{ p: 1.5 }}>{payment.creditorName}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>{payment.accountName}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        p: 1.5
                      }}
                    >
                      {payment.iban.replace(/(.{4})/g, "$1 ").trim()}
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 500, color: "success.main", p: 1.5 }}
                    >
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell sx={{ p: 1.5 }}>{payment.paymentType?.name}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>{formatDate(payment.completedAt)}</TableCell>
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
                            {payment.description}
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
                            <Box component="span">{payment.description}</Box>
                          </Tooltip>
                        </>
                      ) : (
                        payment.description
                      )}
                    </TableCell>
                    <TableCell sx={{ p: 1.5 }}>{payment.createdBy?.username}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>{payment.approvedBy?.username}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>{payment.completedBy?.username}</TableCell>
                    <TableCell sx={{ p: 1.5 }}>
                      {payment.proofDocumentPath && (
                        <Tooltip title={t("completedPayments.downloadDocument")}>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadProof(payment._id)}
                            sx={{ color: "primary.main" }}
                          >
                            <DownloadIcon fontSize="small" />
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
            {selectedCreditor}{t("completedPayments.descriptionDialogSuffix")}
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
    </Box>
  );
};

export default CompletedPayments;
