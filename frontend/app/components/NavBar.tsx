"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../contexts/AuthContext";

const NavBar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const open = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);
  const navigate = (path: string) => {
    close();
    router.push(path);
  };

  const handleLogout = async () => {
    close();
    await logout();
  };

  const initials = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(90deg, #1a237e 0%, #283593 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 1 }}
        >
          <DirectionsRunIcon sx={{ fontSize: 28, color: "#90caf9" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: "0.05em", color: "#fff" }}
          >
            LIFE<span style={{ color: "#90caf9" }}>THON</span>
          </Typography>
        </Box>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <Button
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Dashboard
              </Button>
            </Link>

            {/* Profile avatar button */}
            <Avatar
              onClick={open}
              sx={{
                ml: 1,
                width: 36,
                height: 36,
                cursor: "pointer",
                bgcolor: "#3949ab",
                border: "2px solid rgba(144,202,249,0.4)",
                fontSize: 15,
                fontWeight: 700,
                transition: "border-color 0.2s, box-shadow 0.2s",
                "&:hover": {
                  borderColor: "#90caf9",
                  boxShadow: "0 0 0 3px rgba(144,202,249,0.15)",
                },
              }}
            >
              {initials}
            </Avatar>

            {/* Dropdown */}
            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={close}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{
                paper: {
                  elevation: 8,
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: 2,
                    background: "#1a2744",
                    border: "1px solid rgba(144,202,249,0.15)",
                    color: "#e3eafc",
                    overflow: "visible",
                    // Arrow
                    "&::before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: -6,
                      right: 14,
                      width: 12,
                      height: 12,
                      background: "#1a2744",
                      border: "1px solid rgba(144,202,249,0.15)",
                      borderBottom: "none",
                      borderRight: "none",
                      transform: "rotate(45deg)",
                    },
                    "& .MuiMenuItem-root": {
                      borderRadius: 1.5,
                      mx: 0.75,
                      px: 1.5,
                      "&:hover": { background: "rgba(144,202,249,0.09)" },
                    },
                  },
                },
              }}
            >
              {/* User info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography
                  sx={{
                    color: "#90caf9",
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {user?.email}
                </Typography>
                <Typography
                  sx={{ color: "rgba(255,255,255,0.3)", fontSize: 11, mt: 0.3 }}
                >
                  User #{user?.userId}
                </Typography>
              </Box>

              <Divider
                sx={{ borderColor: "rgba(144,202,249,0.12)", my: 0.5 }}
              />

              <MenuItem onClick={() => navigate("/dashboard")}>
                <ListItemIcon>
                  <DashboardIcon sx={{ fontSize: 17, color: "#90caf9" }} />
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ fontSize: 14, color: "#e3eafc" }}
                >
                  Dashboard
                </ListItemText>
              </MenuItem>

              <MenuItem onClick={() => navigate("/profile")}>
                <ListItemIcon>
                  <PersonIcon sx={{ fontSize: 17, color: "#90caf9" }} />
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ fontSize: 14, color: "#e3eafc" }}
                >
                  Profile
                </ListItemText>
              </MenuItem>

              <MenuItem onClick={() => navigate("/settings")}>
                <ListItemIcon>
                  <SettingsIcon sx={{ fontSize: 17, color: "#90caf9" }} />
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ fontSize: 14, color: "#e3eafc" }}
                >
                  Settings
                </ListItemText>
              </MenuItem>

              <Divider
                sx={{ borderColor: "rgba(144,202,249,0.12)", my: 0.5 }}
              />

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon sx={{ fontSize: 17, color: "#f87171" }} />
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ fontSize: 14, color: "#f87171" }}
                >
                  Logout
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Home
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Login
              </Button>
            </Link>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                sx={{
                  ml: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#90caf9",
                  borderColor: "#90caf9",
                  "&:hover": {
                    background: "rgba(144,202,249,0.1)",
                    borderColor: "#90caf9",
                  },
                }}
              >
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
