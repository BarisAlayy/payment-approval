import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  AccountCircle as AccountCircleIcon,
  Close as CloseIcon,
  Key as KeyIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { useLanguage } from "../context/LanguageContext";
import PaletteIcon from "@mui/icons-material/Palette";

const drawerWidth = 280;
const miniDrawerWidth = 65;

const buildMenuItems = (t) => [
  {
    text: t("menu.dashboard"),
    path: "/dashboard",
    icon: <DashboardIcon />,
    roles: [],
    description: t("menu.dashboardDesc"),
  },
  {
    text: t("menu.paymentEntry"),
    path: "/paymententry",
    icon: <PaymentIcon />,
    roles: [],
    description: t("menu.paymentEntryDesc"),
  },
  {
    text: t("menu.approveReject"),
    path: "/approvereject",
    icon: <CheckCircleIcon />,
    roles: [],
    description: t("menu.approveRejectDesc"),
  },
  {
    text: t("menu.approvedPayments"),
    path: "/approvedpayments",
    icon: <DoneIcon />,
    roles: [],
    description: t("menu.approvedPaymentsDesc"),
  },
  {
    text: t("menu.rejectedPayments"),
    path: "/rejectedpayments",
    icon: <CloseIcon />,
    roles: [],
    description: t("menu.rejectedPaymentsDesc"),
  },
  {
    text: t("menu.completedPayments"),
    path: "/completedpayments",
    icon: <WalletIcon />,
    roles: [],
    description: t("menu.completedPaymentsDesc"),
  },
  {
    text: t("menu.definitions"),
    icon: <SettingsIcon />,
    roles: [],
    description: t("menu.definitionsDesc"),
    subItems: [
      {
        text: t("menu.suppliers"),
        path: "/suppliers",
        icon: <BusinessIcon />,
        description: t("menu.suppliersDesc"),
      },
      {
        text: t("menu.employees"),
        path: "/employees",
        icon: <GroupIcon />,
        description: t("menu.employeesDesc"),
      },
      {
        text: t("menu.paymentTypes"),
        path: "/payment-types",
        icon: <PaymentIcon />,
        description: t("menu.paymentTypesDesc"),
      },
    ],
  },
  {
    text: t("menu.adminPanel"),
    path: "/admin",
    icon: <AdminIcon />,
    roles: ["admin"],
    description: t("menu.adminPanelDesc"),
  },
  {
    text: t("menu.branding"),
    path: "/branding",
    icon: <PaletteIcon />,
    roles: ["admin"],
    description: t("menu.brandingDesc"),
  },
];

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleChange = (_event, value) => {
    if (value) setLanguage(value);
  };

  return (
    <Tooltip title={t("common.language")}>
      <ToggleButtonGroup
        value={language}
        exclusive
        size="small"
        onChange={handleChange}
        sx={{
          "& .MuiToggleButton-root": {
            border: "1px solid",
            borderColor: "divider",
            px: 1.25,
            py: 0.25,
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "text.secondary",
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            },
          },
        }}
      >
        <ToggleButton value="en" aria-label={t("common.english")}>
          <LanguageIcon sx={{ fontSize: 16, mr: 0.5 }} />
          EN
        </ToggleButton>
        <ToggleButton value="tr" aria-label={t("common.turkish")}>
          TR
        </ToggleButton>
      </ToggleButtonGroup>
    </Tooltip>
  );
};

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const [anchorElUser, setAnchorElUser] = useState(null);

  const menuItems = buildMenuItems(t);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    handleCloseUserMenu();
    navigate(path);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
  };

  const handleSubMenuClick = (text) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [text]: !prev[text],
    }));
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        pt: { xs: 8, sm: 0 },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 100,
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={() => navigate("/dashboard")}
      >
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            style={{
              height: isDrawerOpen ? 80 : 40,
              width: "auto",
              objectFit: "contain",
            }}
          />
        ) : (
          <Typography
            variant={isDrawerOpen ? "h6" : "caption"}
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            {isDrawerOpen ? branding.companyName : (branding.companyName || "").slice(0, 3).toUpperCase()}
          </Typography>
        )}
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, px: isDrawerOpen ? 2 : 1, py: 1 }}>
        {menuItems
          .filter(
            (item) => !item.roles?.length || item.roles.includes(user?.role)
          )
          .map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    } else if (item.subItems) {
                      handleSubMenuClick(item.text);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: isDrawerOpen ? "initial" : "center",
                    px: 2.5,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:hover": {
                      bgcolor: "primary.lighter",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isDrawerOpen ? 2 : "auto",
                      justifyContent: "center",
                      color:
                        location.pathname === item.path
                          ? "inherit"
                          : "primary.main",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {isDrawerOpen && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color:
                            location.pathname === item.path
                              ? "inherit"
                              : "text.secondary",
                          opacity: location.pathname === item.path ? 1 : 0.6,
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
              {isDrawerOpen && item.subItems && openSubMenus[item.text] && (
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem
                      key={subItem.text}
                      disablePadding
                      sx={{ pl: 4, mb: 1 }}
                    >
                      <ListItemButton
                        selected={location.pathname === subItem.path}
                        onClick={() => navigate(subItem.path)}
                        sx={{
                          borderRadius: 2,
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            bgcolor: "primary.lighter",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color:
                              location.pathname === subItem.path
                                ? "inherit"
                                : "primary.main",
                            minWidth: 40,
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {subItem.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color:
                                location.pathname === subItem.path
                                  ? "inherit"
                                  : "text.secondary",
                              opacity:
                                location.pathname === subItem.path ? 1 : 0.6,
                            }}
                          >
                            {subItem.description}
                          </Typography>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </React.Fragment>
          ))}
      </List>

      <Divider />

      <ListItem disablePadding sx={{ display: 'block', mt: 'auto', mb: 2, px: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 48,
            justifyContent: isDrawerOpen ? 'initial' : 'center',
            borderRadius: 2,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isDrawerOpen ? 3 : 'auto',
              justifyContent: 'center',
              color: 'error.main',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={t("menu.logout")}
            sx={{
              opacity: isDrawerOpen ? 1 : 0,
              '& .MuiTypography-root': {
                fontWeight: 500
              }
            }}
          />
        </ListItemButton>
      </ListItem>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: {
            xs: "100%",
            sm: `calc(100% - ${
              isDrawerOpen ? drawerWidth : miniDrawerWidth
            }px)`,
          },
          ml: {
            xs: 0,
            sm: isDrawerOpen ? `${drawerWidth}px` : `${miniDrawerWidth}px`,
          },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => {
                if (window.innerWidth < 600) {
                  handleDrawerToggle();
                } else {
                  setIsDrawerOpen(!isDrawerOpen);
                }
              }}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {branding.companyName} · {branding.headerTitle}
            </Typography>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "block", sm: "none" } }}
            >
              {branding.headerTitle}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LanguageSwitcher />
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  fontSize: "0.875rem",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {user?.username}
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={() => setAnchorElUser(true)}
              sx={{
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: isDrawerOpen ? drawerWidth : miniDrawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              zIndex: (theme) => theme.zIndex.appBar - 1,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: isDrawerOpen ? drawerWidth : miniDrawerWidth,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: "hidden",
              bgcolor: "background.default",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: {
            sm: `calc(100% - ${
              isDrawerOpen ? drawerWidth : miniDrawerWidth
            }px)`,
          },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ minHeight: "calc(100vh - 140px)" }}>{children}</Box>
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: 2,
            backgroundColor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            {branding.footerText}
          </Typography>
        </Box>
      </Box>

      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem onClick={() => handleMenuClick("/change-password")}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <Typography textAlign="center">{t("menu.changePassword")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography textAlign="center">{t("menu.logout")}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
