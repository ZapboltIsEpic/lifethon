"use client";

import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

interface UserCoins {
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

interface InventoryStats {
  totalItems: number;
  uniqueItems: number;
}

const Dashboard = () => {
  const { user, logout, isLoading, isAdmin } = useAuth();
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null,
  );

  useEffect(() => {
    if (user) {
      fetchCoins();
      fetchInventoryStats();
    }
  }, [user]);

  const fetchCoins = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/api/coins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoins(data);
      }
    } catch (err) {
      console.error("Failed to fetch coins:", err);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8081/api/inventory/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setInventoryStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory stats:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Welcome back!
              </h2>
              <p className="text-gray-600">User ID: {user.userId}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Your Coins</h2>
              <p className="text-3xl font-bold">
                {coins ? `💰 ${coins.coins}` : "💰 0"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Items Collected</h2>
              <p className="text-3xl font-bold">
                {inventoryStats ? inventoryStats.totalItems : 0}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/gacha"
                className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">🎰</div>
                <h3 className="font-bold text-lg">Gacha Pull</h3>
                <p className="text-sm opacity-90">Try your luck!</p>
              </Link>

              <Link
                href="/inventory"
                className="bg-gradient-to-br from-green-400 to-teal-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">🎒</div>
                <h3 className="font-bold text-lg">Inventory</h3>
                <p className="text-sm opacity-90">View your items</p>
              </Link>

              <Link
                href="/shop"
                className="bg-gradient-to-br from-blue-400 to-purple-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">🏪</div>
                <h3 className="font-bold text-lg">Coin Shop</h3>
                <p className="text-sm opacity-90">Get more coins</p>
              </Link>

              <Link
                href="/tasks"
                className="bg-gradient-to-br from-pink-400 to-red-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-bold text-lg">Tasks</h3>
                <p className="text-sm opacity-90">Earn rewards</p>
              </Link>

              <Link
                href="/flashcards"
                className="bg-gradient-to-br from-indigo-400 to-blue-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">🃏</div>
                <h3 className="font-bold text-lg">Flashcard Practice</h3>
                <p className="text-sm opacity-90">Study & learn</p>
              </Link>

              <Link
                href="/game"
                className="bg-gradient-to-br from-indigo-400 to-blue-500 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">🏃</div>
                <h3 className="font-bold text-lg">Runner</h3>
                <p className="text-sm opacity-90">Keep progressing</p>
              </Link>

              {isAdmin() && (
                <Link
                  href="/admin/gacha"
                  className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center border-2 border-red-600"
                >
                  <div className="text-4xl mb-2">🔧</div>
                  <h3 className="font-bold text-lg">Admin Panel</h3>
                  <p className="text-sm opacity-90">Manage gacha items</p>
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity</p>
              <p className="text-sm mt-2">
                Start playing to see your activity here!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
