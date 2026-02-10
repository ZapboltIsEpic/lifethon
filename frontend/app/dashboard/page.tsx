"use client";

import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();

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
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">LifeThon</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

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
              <p className="text-3xl font-bold">Loading...</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Items Collected</h2>
              <p className="text-3xl font-bold">0</p>
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
