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
          <Link href="/">
            <Button color="inherit">Home</Button>
          </Link>
          <Link href="/login">
            <Button color="inherit">Login</Button>
          </Link>
          <Link href="/register">
            <Button color="inherit">Register</Button>
          </Link>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default NavBar;
