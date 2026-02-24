"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import { useAuth } from "../contexts/AuthContext";

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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
        {/* Logo + Title */}
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

        {/* Nav links */}
        {isAuthenticated ? (
          <>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <Button
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Dashboard
              </Button>
            </Link>
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Logout
            </Button>
          </>
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
