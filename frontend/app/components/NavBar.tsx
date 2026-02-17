"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          LifeThon
        </Typography>

        {isAuthenticated ? (
          <>
            <Link href="/dashboard">
              <Button color="inherit">Dashboard</Button>
            </Link>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/">
              <Button color="inherit">Home</Button>
            </Link>
            <Link href="/login">
              <Button color="inherit">Login</Button>
            </Link>
            <Link href="/register">
              <Button
                color="inherit"
                variant="outlined"
                style={{ marginLeft: 8 }}
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
