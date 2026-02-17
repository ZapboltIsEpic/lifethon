"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface GachaItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  itemType: "CHARACTER" | "COSTUME" | "ACCESSORY" | "CONSUMABLE" | "RESOURCE";
  bonusCoins: number;
  bonusEnergy: number;
}

interface PullResult {
  items: GachaItem[];
  remainingCoins: number;
  isNew: boolean;
  pityCounter: number;
}

interface UserCoins {
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

interface GachaInfo {
  singlePullCost: number;
  multiPullCost: number;
  multiPullCount: number;
  pityThreshold: number;
  softPityStart: number;
}

const rarityColors = {
  COMMON: "bg-gray-400 border-gray-500",
  UNCOMMON: "bg-green-400 border-green-500",
  RARE: "bg-blue-400 border-blue-500",
  EPIC: "bg-purple-400 border-purple-500",
  LEGENDARY: "bg-yellow-400 border-yellow-500",
};

const rarityGlow = {
  COMMON: "shadow-lg",
  UNCOMMON: "shadow-xl shadow-green-300",
  RARE: "shadow-xl shadow-blue-300",
  EPIC: "shadow-2xl shadow-purple-400",
  LEGENDARY: "shadow-2xl shadow-yellow-400 animate-pulse",
};

const GachaPull = () => {
  const { user } = useAuth();
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [gachaInfo, setGachaInfo] = useState<GachaInfo | null>(null);
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user coins and gacha info on mount
  useEffect(() => {
    fetchCoins();
    fetchGachaInfo();
  }, []);

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

  const fetchGachaInfo = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/gacha/info");
      if (response.ok) {
        const data = await response.json();
        setGachaInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch gacha info:", err);
    }
  };

  const performPull = async (isMulti: boolean) => {
    setError(null);
    setPulling(true);
    setShowResult(false);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const endpoint = isMulti
        ? "/api/gacha/pull/multi"
        : "/api/gacha/pull/single";

      const response = await fetch(`http://localhost:8081${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Simulate pull animation delay
        setTimeout(() => {
          setResult(data);
          setShowResult(true);
          setPulling(false);

          // Update coins
          setCoins({
            coins: data.remainingCoins,
            totalEarned: coins?.totalEarned || 0,
            totalSpent:
              (coins?.totalSpent || 0) +
              (isMulti ? gachaInfo!.multiPullCost : gachaInfo!.singlePullCost),
          });
        }, 2000); // 2 second animation
      } else {
        setError(data.error || "Pull failed");
        setPulling(false);
      }
    } catch (err) {
      setError("Network error occurred");
      setPulling(false);
    }
  };

  const handleSinglePull = () => {
    if (coins && gachaInfo && coins.coins >= gachaInfo.singlePullCost) {
      performPull(false);
    }
  };

  const handleMultiPull = () => {
    if (coins && gachaInfo && coins.coins >= gachaInfo.multiPullCost) {
      performPull(true);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
  };

  if (!gachaInfo || !coins) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            ✨ Gacha System ✨
          </h1>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 inline-block">
            <p className="text-2xl font-bold text-yellow-300">
              💰 {coins.coins} Coins
            </p>
          </div>
        </div>

        {/* Pity Counter */}
        {result && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 text-center">
            <p className="text-white">
              Pulls until guaranteed Legendary:{" "}
              {gachaInfo.pityThreshold - result.pityCounter}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(result.pityCounter / gachaInfo.pityThreshold) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Pull Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Single Pull */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">Single Pull</h3>
            <p className="text-white/80 mb-4">
              {gachaInfo.singlePullCost} Coins
            </p>
            <button
              onClick={handleSinglePull}
              disabled={pulling || coins.coins < gachaInfo.singlePullCost}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                pulling || coins.coins < gachaInfo.singlePullCost
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
              }`}
            >
              {pulling ? "Pulling..." : "Pull x1"}
            </button>
          </div>

          {/* Multi Pull */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 border-yellow-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-white">Multi Pull</h3>
              <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold">
                10% OFF
              </span>
            </div>
            <p className="text-white/80 mb-4">
              {gachaInfo.multiPullCost} Coins (10 pulls)
            </p>
            <p className="text-yellow-300 text-sm mb-4">
              ✨ Guaranteed RARE or better!
            </p>
            <button
              onClick={handleMultiPull}
              disabled={pulling || coins.coins < gachaInfo.multiPullCost}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                pulling || coins.coins < gachaInfo.multiPullCost
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 shadow-lg"
              }`}
            >
              {pulling ? "Pulling..." : "Pull x10"}
            </button>
          </div>
        </div>

        {/* Pulling Animation */}
        {pulling && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎰</div>
              <p className="text-white text-2xl font-bold">Pulling...</p>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {showResult && result && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🎉 You got {result.items.length} item
                {result.items.length > 1 ? "s" : ""}! 🎉
              </h2>

              {/* Items Grid */}
              <div
                className={`grid ${result.items.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"} gap-4 mb-6`}
              >
                {result.items.map((item, index) => (
                  <div
                    key={index}
                    className={`${rarityColors[item.rarity]} ${rarityGlow[item.rarity]} rounded-lg p-4 border-4 transform hover:scale-105 transition-all`}
                  >
                    <div className="text-center">
                      {/* Placeholder image */}
                      <div className="w-full aspect-square bg-white/20 rounded-lg mb-2 flex items-center justify-center text-4xl">
                        {item.itemType === "CHARACTER" && "👤"}
                        {item.itemType === "COSTUME" && "👔"}
                        {item.itemType === "ACCESSORY" && "💎"}
                        {item.itemType === "CONSUMABLE" && "🧪"}
                        {item.itemType === "RESOURCE" && "💰"}
                      </div>
                      <p className="font-bold text-white text-sm mb-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-white/80">{item.rarity}</p>
                      {item.bonusCoins > 0 && (
                        <p className="text-xs text-yellow-300 mt-1">
                          +{item.bonusCoins} coins
                        </p>
                      )}
                      {result.isNew && index === 0 && (
                        <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mt-2">
                          NEW!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={closeResult}
                className="w-full py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Collect Items
              </button>
            </div>
          </div>
        )}

        {/* Drop Rates Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Drop Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-400 rounded-full mx-auto mb-2"></div>
              <p className="text-white font-bold">Common</p>
              <p className="text-white/60 text-sm">60%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-400 rounded-full mx-auto mb-2"></div>
              <p className="text-white font-bold">Uncommon</p>
              <p className="text-white/60 text-sm">25%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-400 rounded-full mx-auto mb-2"></div>
              <p className="text-white font-bold">Rare</p>
              <p className="text-white/60 text-sm">10%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-400 rounded-full mx-auto mb-2"></div>
              <p className="text-white font-bold">Epic</p>
              <p className="text-white/60 text-sm">4%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-white font-bold">Legendary</p>
              <p className="text-white/60 text-sm">1%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GachaPull;
