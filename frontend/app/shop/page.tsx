"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus?: number; // bonus % on top
  tag?: string;
  popular?: boolean;
  icon: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: "day" | "month";
  tag?: string;
  color: string;
  glow: string;
  icon: string;
  perks: { icon: string; text: string; highlight?: boolean }[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
const COIN_PACKS: CoinPack[] = [
  { id: "tiny", name: "Handful", coins: 500, price: 0.99, icon: "🪙" },
  {
    id: "small",
    name: "Pouch",
    coins: 1200,
    price: 1.99,
    bonus: 20,
    icon: "💰",
  },
  {
    id: "medium",
    name: "Chest",
    coins: 3000,
    price: 4.99,
    bonus: 25,
    icon: "📦",
    popular: true,
  },
  {
    id: "large",
    name: "Vault",
    coins: 7000,
    price: 9.99,
    bonus: 40,
    icon: "🏦",
  },
  {
    id: "xl",
    name: "Treasury",
    coins: 20000,
    price: 24.99,
    bonus: 60,
    tag: "Best Value",
    icon: "💎",
  },
];

const PLANS: Plan[] = [
  {
    id: "daily",
    name: "Daily Pass",
    price: 0.99,
    period: "day",
    color: "#60a5fa",
    glow: "#3b82f6",
    icon: "⚡",
    perks: [
      { icon: "💰", text: "Daily coin cap raised to 500", highlight: true },
      { icon: "✅", text: "2 extra daily tasks unlocked", highlight: true },
      { icon: "🎰", text: "1 free gacha pull per day" },
      { icon: "🏃", text: "Bonus XP in Runner mode" },
    ],
  },
  {
    id: "monthly",
    name: "Battle Pass",
    price: 9.99,
    period: "month",
    tag: "Most Popular",
    color: "#c084fc",
    glow: "#a855f7",
    icon: "👑",
    perks: [
      { icon: "💰", text: "Daily coin cap raised to 2000", highlight: true },
      { icon: "✅", text: "Unlimited daily tasks", highlight: true },
      { icon: "🎰", text: "5 free gacha pulls per day", highlight: true },
      { icon: "🗺️", text: "Exclusive Battle Pass boss stages" },
      { icon: "🎨", text: "Exclusive cosmetic frames & titles" },
      { icon: "📊", text: "Detailed progress analytics" },
      { icon: "🛡️", text: "Permanent shield in Runner", highlight: true },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString();
const fmtPrice = (n: number) => `$${n.toFixed(2)}`;

// ── Mock current state (replace with real API/context) ────────────────────────
const MOCK_BALANCE = 1340;
const MOCK_ACTIVE_PLAN: string | null = null;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const [balance, setBalance] = useState(MOCK_BALANCE);
  const [activePlan, setActivePlan] = useState<string | null>(MOCK_ACTIVE_PLAN);
  const [tab, setTab] = useState<"coins" | "pass">("coins");
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(
    null,
  );
  const [confirming, setConfirming] = useState<string | null>(null);

  const showToast = (msg: string, color = "#22c55e") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  const buyCoins = (pack: CoinPack) => {
    if (confirming !== pack.id) {
      setConfirming(pack.id);
      return;
    }
    const total =
      pack.coins + Math.round(pack.coins * ((pack.bonus ?? 0) / 100));
    setBalance((b) => b + total);
    showToast(`+${fmt(total)} coins added! 💰`);
    setConfirming(null);
  };

  const subscribePlan = (plan: Plan) => {
    if (confirming !== plan.id) {
      setConfirming(plan.id);
      return;
    }
    setActivePlan(plan.id);
    showToast(`${plan.name} activated! ${plan.icon}`, plan.glow);
    setConfirming(null);
  };

  const cancelPlan = () => {
    setActivePlan(null);
    showToast("Subscription cancelled.", "#9ca3af");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold font-mono text-sm shadow-2xl transition-all"
          style={{
            background: toast.color + "22",
            border: `1px solid ${toast.color}`,
            color: toast.color,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-mono tracking-tight text-white">
              🏪 Coin Shop
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-mono">
              Power up your journey
            </p>
          </div>
          {/* Balance */}
          <div className="bg-gray-900 border border-yellow-900 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-xs text-gray-600 font-mono">Balance</p>
              <p className="text-xl font-black text-yellow-400 font-mono">
                {fmt(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Active plan banner */}
        {activePlan &&
          (() => {
            const plan = PLANS.find((p) => p.id === activePlan)!;
            return (
              <div
                className="rounded-2xl p-4 flex items-center gap-4 border"
                style={{ borderColor: plan.glow, background: plan.glow + "12" }}
              >
                <span className="text-3xl">{plan.icon}</span>
                <div className="flex-1">
                  <p
                    className="font-bold font-mono"
                    style={{ color: plan.color }}
                  >
                    {plan.name} Active
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    Renews {plan.period === "day" ? "tomorrow" : "next month"} ·{" "}
                    {fmtPrice(plan.price)}/{plan.period}
                  </p>
                </div>
                <button
                  onClick={cancelPlan}
                  className="text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors"
                >
                  Cancel
                </button>
              </div>
            );
          })()}

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {[
            { id: "coins", label: "💰 Coin Packs" },
            { id: "pass", label: "👑 Subscriptions" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                setConfirming(null);
              }}
              className={`px-5 py-2 rounded-lg text-sm font-bold font-mono transition-all ${
                tab === t.id
                  ? "bg-blue-700 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── COIN PACKS ─────────────────────────────────────────────────── */}
        {tab === "coins" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COIN_PACKS.map((pack) => {
              const total =
                pack.coins + Math.round(pack.coins * ((pack.bonus ?? 0) / 100));
              const isConfirming = confirming === pack.id;
              return (
                <div
                  key={pack.id}
                  className={`relative bg-gray-900 rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                    pack.popular
                      ? "border-blue-600 shadow-lg shadow-blue-950"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {/* Tag */}
                  {(pack.popular || pack.tag) && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold font-mono"
                      style={{
                        background: pack.popular ? "#1d4ed8" : "#78350f",
                        color: pack.popular ? "#bfdbfe" : "#fde68a",
                        border: `1px solid ${pack.popular ? "#3b82f6" : "#f59e0b"}`,
                      }}
                    >
                      {pack.popular ? "⭐ Most Popular" : pack.tag}
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{pack.icon}</span>
                    <div>
                      <p className="font-black text-white font-mono">
                        {pack.name}
                      </p>
                      <p className="text-yellow-400 font-bold font-mono text-lg">
                        {fmt(pack.coins)}
                        {pack.bonus && (
                          <span className="ml-2 text-xs text-green-400 font-mono">
                            +{pack.bonus}% bonus
                          </span>
                        )}
                      </p>
                      {pack.bonus && (
                        <p className="text-xs text-gray-600 font-mono">
                          = {fmt(total)} total
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price per coin */}
                  <div className="flex-1 flex items-end justify-between">
                    <p className="text-xs text-gray-600 font-mono">
                      ~${((pack.price / total) * 1000).toFixed(2)} per 1k coins
                    </p>
                    <p className="text-2xl font-black text-white font-mono">
                      {fmtPrice(pack.price)}
                    </p>
                  </div>

                  <button
                    onClick={() => buyCoins(pack)}
                    className={`w-full py-2.5 rounded-xl font-bold font-mono text-sm transition-all ${
                      isConfirming
                        ? "bg-green-700 hover:bg-green-600 text-white animate-pulse"
                        : pack.popular
                          ? "bg-blue-700 hover:bg-blue-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    }`}
                  >
                    {isConfirming
                      ? `✓ Confirm ${fmtPrice(pack.price)}`
                      : "Buy Now"}
                  </button>
                  {isConfirming && (
                    <button
                      onClick={() => setConfirming(null)}
                      className="w-full text-xs text-gray-600 hover:text-gray-400 font-mono -mt-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUBSCRIPTIONS ──────────────────────────────────────────────── */}
        {tab === "pass" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => {
              const isActive = activePlan === plan.id;
              const isConfirming = confirming === plan.id;
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl border p-6 flex flex-col gap-5 transition-all"
                  style={{
                    borderColor: isActive ? plan.glow : plan.glow + "44",
                    background: isActive ? plan.glow + "18" : plan.glow + "08",
                    boxShadow: isActive ? `0 0 40px ${plan.glow}22` : "none",
                  }}
                >
                  {plan.tag && (
                    <div
                      className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold font-mono"
                      style={{ background: plan.glow, color: "#000" }}
                    >
                      {plan.tag}
                    </div>
                  )}

                  {isActive && (
                    <div
                      className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold font-mono"
                      style={{
                        background: "#14532d",
                        color: "#86efac",
                        border: "1px solid #22c55e",
                      }}
                    >
                      ✓ Active
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                      style={{
                        background: plan.glow + "22",
                        border: `1px solid ${plan.glow}55`,
                      }}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <p
                        className="font-black text-xl font-mono"
                        style={{ color: plan.color }}
                      >
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white font-mono">
                          {fmtPrice(plan.price)}
                        </span>
                        <span className="text-gray-500 text-sm font-mono">
                          / {plan.period}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="space-y-2 flex-1">
                    {plan.perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center flex-shrink-0">
                          {perk.icon}
                        </span>
                        <p
                          className={`text-sm font-mono ${
                            perk.highlight
                              ? "text-white font-bold"
                              : "text-gray-500"
                          }`}
                        >
                          {perk.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isActive ? (
                    <div
                      className="w-full py-3 rounded-xl font-bold font-mono text-sm text-center"
                      style={{
                        background: plan.glow + "22",
                        color: plan.color,
                      }}
                    >
                      ✓ Currently Active
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => subscribePlan(plan)}
                        className="w-full py-3 rounded-xl font-bold font-mono text-sm transition-all"
                        style={
                          isConfirming
                            ? {
                                background: "#14532d",
                                color: "#86efac",
                                border: "1px solid #22c55e",
                              }
                            : { background: plan.glow, color: "#000" }
                        }
                      >
                        {isConfirming
                          ? `✓ Confirm ${fmtPrice(plan.price)}/${plan.period}`
                          : `Subscribe · ${fmtPrice(plan.price)}/${plan.period}`}
                      </button>
                      {isConfirming && (
                        <button
                          onClick={() => setConfirming(null)}
                          className="w-full text-xs text-gray-600 hover:text-gray-400 font-mono -mt-2"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-gray-700 font-mono text-center pb-4">
          All purchases are simulated · No real payments processed · Wire to
          Stripe or similar when ready
        </p>
      </div>
    </div>
  );
}
