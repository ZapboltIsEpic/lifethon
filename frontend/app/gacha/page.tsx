"use client";

import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
import { useState, useEffect } from "react";

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
const typeEmoji: Record<string, string> = {
  CHARACTER: "👤",
  COSTUME: "👔",
  ACCESSORY: "💎",
  CONSUMABLE: "🧪",
  RESOURCE: "💰",
};

const GachaPull = () => {
  const { user } = useAuth();
  const api = useApi();
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [gachaInfo, setGachaInfo] = useState<GachaInfo | null>(null);
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/coins")
      .then((r) => r.ok && r.json().then(setCoins))
      .catch(console.error);
    // gacha info is public — no token needed
    fetch("http://localhost:8081/api/gacha/info").then(
      (r) => r.ok && r.json().then(setGachaInfo),
    );
  }, []);

  const performPull = async (isMulti: boolean) => {
    setError(null);
    setPulling(true);
    setShowResult(false);
    setResult(null);
    try {
      const endpoint = isMulti
        ? "/api/gacha/pull/multi"
        : "/api/gacha/pull/single";
      const res = await api.post(endpoint);
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          setResult(data);
          setShowResult(true);
          setPulling(false);
          setCoins({
            coins: data.remainingCoins,
            totalEarned: coins?.totalEarned ?? 0,
            totalSpent:
              (coins?.totalSpent ?? 0) +
              (isMulti ? gachaInfo!.multiPullCost : gachaInfo!.singlePullCost),
          });
        }, 2000);
      } else {
        setError(data.error || "Pull failed");
        setPulling(false);
      }
    } catch {
      setError("Network error occurred");
      setPulling(false);
    }
  };

  if (!gachaInfo || !coins)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );

  const canSingle = coins.coins >= gachaInfo.singlePullCost;
  const canMulti = coins.coins >= gachaInfo.multiPullCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
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
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">Single Pull</h3>
            <p className="text-white/80 mb-4">
              {gachaInfo.singlePullCost} Coins
            </p>
            <button
              onClick={() => performPull(false)}
              disabled={pulling || !canSingle}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                pulling || !canSingle
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
              }`}
            >
              {pulling ? "Pulling..." : "Pull x1"}
            </button>
          </div>

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
              onClick={() => performPull(true)}
              disabled={pulling || !canMulti}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                pulling || !canMulti
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 shadow-lg"
              }`}
            >
              {pulling ? "Pulling..." : "Pull x10"}
            </button>
          </div>
        </div>

        {pulling && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎰</div>
              <p className="text-white text-2xl font-bold">Pulling...</p>
            </div>
          </div>
        )}

        {showResult && result && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🎉 You got {result.items.length} item
                {result.items.length > 1 ? "s" : ""}! 🎉
              </h2>
              <div
                className={`grid ${result.items.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"} gap-4 mb-6`}
              >
                {result.items.map((item, i) => (
                  <div
                    key={i}
                    className={`${rarityColors[item.rarity]} ${rarityGlow[item.rarity]} rounded-lg p-4 border-4 transform hover:scale-105 transition-all`}
                  >
                    <div className="text-center">
                      <div className="w-full aspect-square bg-white/20 rounded-lg mb-2 flex items-center justify-center text-4xl">
                        {typeEmoji[item.itemType]}
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
                      {result.isNew && i === 0 && (
                        <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mt-2">
                          NEW!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowResult(false);
                  setResult(null);
                }}
                className="w-full py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Collect Items
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Drop Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ["Common", "bg-gray-400", "60%"],
              ["Uncommon", "bg-green-400", "25%"],
              ["Rare", "bg-blue-400", "10%"],
              ["Epic", "bg-purple-400", "4%"],
              ["Legendary", "bg-yellow-400", "1%"],
            ].map(([name, bg, rate]) => (
              <div key={name} className="text-center">
                <div
                  className={`w-12 h-12 ${bg} rounded-full mx-auto mb-2 ${name === "Legendary" ? "animate-pulse" : ""}`}
                />
                <p className="text-white font-bold">{name}</p>
                <p className="text-white/60 text-sm">{rate}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GachaPull;
