"use client";

import { useState } from "react";

const Dashboard = () => {
  // Initialize state directly from localStorage - no useEffect needed!
  const [email] = useState(() => localStorage.getItem("email") || "");
  const [userId] = useState(() => localStorage.getItem("userId") || "");

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Email: {email}</p>
      <p>User ID: {userId}</p>
    </div>
  );
};

export default Dashboard;
