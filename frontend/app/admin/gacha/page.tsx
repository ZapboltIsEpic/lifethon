"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface GachaItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  itemType: "CHARACTER" | "COSTUME" | "ACCESSORY" | "CONSUMABLE" | "RESOURCE";
  dropRate: number;
  bonusCoins: number;
  bonusEnergy: number;
  isActive: boolean;
}

const rarityColors = {
  COMMON: "bg-gray-200 text-gray-800",
  UNCOMMON: "bg-green-200 text-green-800",
  RARE: "bg-blue-200 text-blue-800",
  EPIC: "bg-purple-200 text-purple-800",
  LEGENDARY: "bg-yellow-200 text-yellow-800",
};

const AdminGachaPanel = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<GachaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GachaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalRate, setTotalRate] = useState(0);

  useEffect(() => {
    // Check if user is admin (you'll need to decode JWT or get from user context)
    const token = localStorage.getItem("token");
    if (token) {
      // Decode and check role - for now we'll fetch items to verify access
      fetchItems();
      validateRates();
    }
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8081/api/admin/gacha/items",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 403) {
        setError("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const validateRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8081/api/admin/gacha/validate-rates",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTotalRate(data.totalRate);
      }
    } catch (err) {
      console.error("Failed to validate rates:", err);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8081/api/admin/gacha/items/${id}/toggle-active`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchItems();
        validateRates();
      }
    } catch (err) {
      console.error("Failed to toggle item:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this item?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8081/api/admin/gacha/items/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchItems();
        validateRates();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  const ratesValid = totalRate >= 0.99 && totalRate <= 1.01;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Gacha Item Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage gacha items and drop rates
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            + Create New Item
          </button>
        </div>

        {/* Drop Rate Warning */}
        <div
          className={`mb-6 p-4 rounded-lg ${ratesValid ? "bg-green-100 border border-green-400" : "bg-red-100 border border-red-400"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={`font-bold ${ratesValid ? "text-green-800" : "text-red-800"}`}
              >
                {ratesValid ? "✓ Drop Rates Valid" : "⚠ Drop Rates Invalid"}
              </h3>
              <p className={ratesValid ? "text-green-700" : "text-red-700"}>
                Total: {(totalRate * 100).toFixed(2)}% (should be 100%)
              </p>
            </div>
            <button
              onClick={validateRates}
              className="px-4 py-2 bg-white rounded border hover:bg-gray-50"
            >
              Revalidate
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rarity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Drop Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bonuses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={!item.isActive ? "bg-gray-50 opacity-60" : ""}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.description?.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${rarityColors[item.rarity]}`}
                    >
                      {item.rarity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.itemType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(item.dropRate * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.bonusCoins > 0 && <div>💰 {item.bonusCoins}</div>}
                    {item.bonusEnergy > 0 && <div>⚡ {item.bonusEnergy}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${item.isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No items found. Create your first gacha item!
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Add your form component here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Item</h2>
            <p className="text-gray-600">Form component here...</p>
            <button
              onClick={() => {
                setShowCreateModal(false);
                fetchItems();
                validateRates();
              }}
              className="mt-4 px-4 py-2 bg-gray-200 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGachaPanel;
