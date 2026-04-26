import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { translateError } from "../utils/i18nError";
import { useLanguage } from "../context/LanguageContext";

export default function Dashboard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState({
    totalPayments: { amount: 0, count: 0 },
    pendingPayments: { amount: 0, count: 0 },
    approvedPayments: { amount: 0, count: 0 },
    completedPayments: { amount: 0, count: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [error, setError] = useState(null);

  const calculateStats = (payments) => {
    const stats = {
      totalPayments: { amount: 0, count: 0 },
      pendingPayments: { amount: 0, count: 0 },
      approvedPayments: { amount: 0, count: 0 },
      completedPayments: { amount: 0, count: 0 },
    };

    payments.forEach((payment) => {
      stats.totalPayments.amount += payment.amount;
      stats.totalPayments.count += 1;

      switch (payment.status) {
        case "pending":
          stats.pendingPayments.amount += payment.amount;
          stats.pendingPayments.count += 1;
          break;
        case "approved":
          stats.approvedPayments.amount += payment.amount;
          stats.approvedPayments.count += 1;
          break;
        case "completed":
          stats.completedPayments.amount += payment.amount;
          stats.completedPayments.count += 1;
          break;
      }
    });

    return stats;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payments");
      const payments = response.data;

      setDashboardStats(calculateStats(payments));

      const latest = payments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentPayments(latest);
    } catch (err) {
      setError(translateError(err, "dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return theme.palette.warning;
      case "approved":
        return theme.palette.success;
      case "rejected":
        return theme.palette.error;
      case "completed":
        return theme.palette.primary;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <PaymentIcon />;
      case "approved":
        return <CheckCircleIcon />;
      case "rejected":
        return <CloseIcon />;
      case "completed":
        return <WalletIcon />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const key = `status.${status}`;
    const translated = t(key, { defaultValue: "" });
    return translated || status;
  };

  const StatCard = ({ title, amount, count, icon: Icon, color }) => (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Box sx={{ position: "relative", height: "100%", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: color.lighter,
                color: color.main,
              }}
            >
              <Icon />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: color.dark,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              {title}
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{ mb: 1, fontWeight: 700, color: theme.palette.text.primary }}
          >
            {amount}
          </Typography>

          {count ? (
            <Typography
              variant="body2"
              sx={{ mb: 1, color: theme.palette.text.secondary }}
            >
              {t("dashboard.transactionsCount", { count })}
            </Typography>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "TRY",
    }).format(amount);

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          {t("dashboard.welcome")}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          {t("dashboard.description")}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.totalPayments")}
            amount={formatCurrency(dashboardStats.totalPayments.amount)}
            icon={WalletIcon}
            color={theme.palette.primary}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.pendingPayments")}
            amount={formatCurrency(dashboardStats.pendingPayments.amount)}
            count={dashboardStats.pendingPayments.count}
            icon={PaymentIcon}
            color={theme.palette.warning}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.approvedPayments")}
            amount={formatCurrency(dashboardStats.approvedPayments.amount)}
            count={dashboardStats.approvedPayments.count}
            icon={CheckCircleIcon}
            color={theme.palette.success}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.completedPayments")}
            amount={formatCurrency(dashboardStats.completedPayments.amount)}
            count={dashboardStats.completedPayments.count}
            icon={WalletIcon}
            color={theme.palette.info}
          />
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  {t("dashboard.recentActivity")}
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : error ? (
                <Typography color="error" align="center" sx={{ py: 4 }}>
                  {error}
                </Typography>
              ) : recentPayments.length === 0 ? (
                <Typography
                  align="center"
                  sx={{ py: 4, color: theme.palette.text.secondary }}
                >
                  {t("dashboard.noActivity")}
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {recentPayments.map((payment, index) => (
                    <React.Fragment key={payment._id}>
                      <Box
                        sx={{
                          py: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          transition: "background-color 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: theme.palette.background.default,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: getStatusColor(payment.status).lighter,
                            color: getStatusColor(payment.status).main,
                          }}
                        >
                          {getStatusIcon(payment.status)}
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {payment.description || payment.creditorName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: getStatusColor(payment.status).main,
                                fontWeight: 500,
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: getStatusColor(payment.status).lighter,
                              }}
                            >
                              {getStatusText(payment.status)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                letterSpacing: "0.02em",
                              }}
                            >
                              {new Date(payment.createdAt).toLocaleDateString(
                                locale,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </Typography>
                            {payment.createdBy && (
                              <>
                                <Typography
                                  variant="caption"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  •
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    letterSpacing: "0.02em",
                                  }}
                                >
                                  {payment.createdBy.username}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>

                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: getStatusColor(payment.status).main,
                          }}
                        >
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </Box>
                      {index < recentPayments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
