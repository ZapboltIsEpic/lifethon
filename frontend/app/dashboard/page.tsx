"use client";

import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
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
  const api = useApi();
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/coins")
      .then((r) => r.ok && r.json().then(setCoins))
      .catch(console.error);
    api
      .get("/api/inventory/stats")
      .then((r) => r.ok && r.json().then(setInventoryStats))
      .catch(console.error);
  }, [user]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Your Coins</h2>
              <p className="text-3xl font-bold">
                {coins ? `💰 ${coins.coins}` : "💰 0"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Items Collected</h2>
              <p className="text-3xl font-bold">
                {inventoryStats?.totalItems ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  href: "/gacha",
                  icon: "🎰",
                  title: "Gacha Pull",
                  sub: "Try your luck!",
                  gradient: "from-yellow-400 to-orange-500",
                },
                {
                  href: "/inventory",
                  icon: "🎒",
                  title: "Inventory",
                  sub: "View your items",
                  gradient: "from-green-400 to-teal-500",
                },
                {
                  href: "/shop",
                  icon: "🏪",
                  title: "Coin Shop",
                  sub: "Get more coins",
                  gradient: "from-blue-400 to-purple-500",
                },
                {
                  href: "/tasks",
                  icon: "✅",
                  title: "Tasks",
                  sub: "Earn rewards",
                  gradient: "from-pink-400 to-red-500",
                },
                {
                  href: "/flashcards",
                  icon: "🃏",
                  title: "Flashcard Practice",
                  sub: "Study & learn",
                  gradient: "from-indigo-400 to-blue-500",
                },
                {
                  href: "/game",
                  icon: "🏃",
                  title: "Runner",
                  sub: "Keep progressing",
                  gradient: "from-indigo-400 to-blue-500",
                },
              ].map(({ href, icon, title, sub, gradient }) => (
                <Link
                  key={href}
                  href={href}
                  className={`bg-gradient-to-br ${gradient} text-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center`}
                >
                  <div className="text-4xl mb-2">{icon}</div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="text-sm opacity-90">{sub}</p>
                </Link>
              ))}
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
