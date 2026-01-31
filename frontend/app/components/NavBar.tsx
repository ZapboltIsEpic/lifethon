"use client";

import Link from "next/link";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

const NavBar = () => {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            LifeThon
          </Typography>
          <Button color="inherit">
            <Link href="/">Home</Link>
          </Button>
          <Button color="inherit">
            <Link href="/login">Login</Link>
          </Button>
          <Button color="inherit">
            <Link href="/register">Register</Link>
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default NavBar;
