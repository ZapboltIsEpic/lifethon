"use client";

import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
import { useState, useEffect } from "react";

type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
type ItemType =
  | "CHARACTER"
  | "COSTUME"
  | "ACCESSORY"
  | "CONSUMABLE"
  | "RESOURCE";

interface InventoryItem {
  inventoryId: number;
  itemId: number;
  name: string;
  description: string;
  imageUrl: string | null;
  rarity: Rarity;
  itemType: ItemType;
  quantity: number;
  isEquipped: boolean;
  obtainedAt: string;
}

const RARITY_CONFIG: Record<
  Rarity,
  { label: string; color: string; bg: string; border: string }
> = {
  COMMON: {
    label: "Common",
    color: "text-gray-400",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
  UNCOMMON: {
    label: "Uncommon",
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-400",
  },
  RARE: {
    label: "Rare",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-400",
  },
  EPIC: {
    label: "Epic",
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-400",
  },
  LEGENDARY: {
    label: "Legendary",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-400",
  },
};
const ITEM_TYPE_EMOJI: Record<ItemType, string> = {
  CHARACTER: "🧑",
  COSTUME: "👗",
  ACCESSORY: "💍",
  CONSUMABLE: "🧪",
  RESOURCE: "🪨",
};

const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const c = RARITY_CONFIG[rarity];
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.color} ${c.bg} border ${c.border}`}
    >
      {c.label}
    </span>
  );
};

const ItemCard = ({
  item,
  onClick,
}: {
  item: InventoryItem;
  onClick: () => void;
}) => {
  const c = RARITY_CONFIG[item.rarity];
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 ${c.border} shadow hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 relative`}
    >
      {item.quantity > 1 && (
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">
          {item.quantity}
        </div>
      )}
      {item.isEquipped && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          Equipped
        </div>
      )}
      <div
        className={`h-32 flex items-center justify-center rounded-t-xl ${c.bg}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover rounded-t-xl"
          />
        ) : (
          <span className="text-5xl">{ITEM_TYPE_EMOJI[item.itemType]}</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm truncate">
          {item.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <RarityBadge rarity={item.rarity} />
          <span className="text-xs text-gray-400 capitalize">
            {item.itemType.toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

const ItemModal = ({
  item,
  onClose,
  onEquip,
  onDiscard,
}: {
  item: InventoryItem;
  onClose: () => void;
  onEquip: (id: number) => void;
  onDiscard: (id: number) => void;
}) => {
  const c = RARITY_CONFIG[item.rarity];
  const canEquip =
    item.itemType !== "CONSUMABLE" && item.itemType !== "RESOURCE";
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm border-2 ${c.border} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-44 flex items-center justify-center ${c.bg}`}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-7xl">{ITEM_TYPE_EMOJI[item.itemType]}</span>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
            <RarityBadge rarity={item.rarity} />
          </div>
          {item.description && (
            <p className="text-sm text-gray-500 mb-4">{item.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="font-semibold text-gray-700 text-sm capitalize">
                {item.itemType.toLowerCase()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Quantity</p>
              <p className="font-semibold text-gray-700 text-sm">
                {item.quantity}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
              <p className="text-xs text-gray-400 mb-1">Obtained</p>
              <p className="font-semibold text-gray-700 text-sm">
                {new Date(item.obtainedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEquip && (
              <button
                onClick={() => onEquip(item.inventoryId)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${item.isEquipped ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}
              >
                {item.isEquipped ? "Unequip" : "Equip"}
              </button>
            )}
            {item.itemType === "CONSUMABLE" && (
              <button
                onClick={() => onEquip(item.inventoryId)}
                className="flex-1 py-2 rounded-lg font-semibold text-sm bg-yellow-400 text-white hover:bg-yellow-500 transition-colors"
              >
                Use
              </button>
            )}
            <button
              onClick={() => onDiscard(item.inventoryId)}
              className="flex-1 py-2 rounded-lg font-semibold text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Discard
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const { user, isLoading } = useAuth();
  const api = useApi();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [discardTarget, setDiscardTarget] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ItemType | "ALL">("ALL");

  useEffect(() => {
    if (user) fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    setFetching(true);
    try {
      const res = await api.get("/api/inventory");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setItems(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleEquip = async (inventoryId: number) => {
    const target = items.find((i) => i.inventoryId === inventoryId);
    if (!target) return;
    const action = target.isEquipped ? "unequip" : "equip";
    try {
      const res = await api.post(`/api/inventory/${inventoryId}/${action}`);
      if (!res.ok) return;
      const updated: InventoryItem = await res.json();
      setItems((prev) =>
        prev.map((i) => (i.inventoryId === inventoryId ? updated : i)),
      );
      setSelectedItem((prev) =>
        prev?.inventoryId === inventoryId ? updated : prev,
      );
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDiscard = async () => {
    if (!discardTarget) return;
    try {
      await api.delete(`/api/inventory/${discardTarget}`);
      setItems((prev) => prev.filter((i) => i.inventoryId !== discardTarget));
    } catch (err) {
      console.error(err);
    } finally {
      setDiscardTarget(null);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (rarityFilter === "ALL" || i.rarity === rarityFilter) &&
      (typeFilter === "ALL" || i.itemType === typeFilter),
  );

  if (isLoading || fetching)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-red-600 font-semibold">Failed to load inventory</p>
          <p className="text-red-400 text-sm mt-1 font-mono">{error}</p>
          <button
            onClick={fetchInventory}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🎒 Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">
              {items.length} unique ·{" "}
              {items.reduce((s, i) => s + i.quantity, 0)} total
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {(Object.keys(RARITY_CONFIG) as Rarity[]).map((rarity) => {
              const count = items
                .filter((i) => i.rarity === rarity)
                .reduce((s, i) => s + i.quantity, 0);
              const c = RARITY_CONFIG[rarity];
              const active = rarityFilter === rarity;
              return (
                <div
                  key={rarity}
                  onClick={() => setRarityFilter(active ? "ALL" : rarity)}
                  className={`bg-white rounded-xl p-3 border-2 cursor-pointer transition-all text-center ${active ? `${c.border} shadow-md scale-105` : "border-transparent hover:border-gray-200"}`}
                >
                  <p className={`font-bold text-xl ${c.color}`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                    {c.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={rarityFilter}
              onChange={(e) =>
                setRarityFilter(e.target.value as Rarity | "ALL")
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Rarities</option>
              {(Object.keys(RARITY_CONFIG) as Rarity[]).map((r) => (
                <option key={r} value={r}>
                  {RARITY_CONFIG[r].label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as ItemType | "ALL")
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Types</option>
              {(Object.keys(ITEM_TYPE_EMOJI) as ItemType[]).map((t) => (
                <option key={t} value={t}>
                  {ITEM_TYPE_EMOJI[t]} {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {(search || rarityFilter !== "ALL" || typeFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRarityFilter("ALL");
                  setTypeFilter("ALL");
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-16 text-center">
              <p className="text-4xl mb-3">🎒</p>
              <p className="text-gray-500 font-semibold">
                {items.length === 0
                  ? "Your inventory is empty"
                  : "No items match your filters"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {items.length === 0
                  ? "Pull some gacha to get started!"
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((item) => (
                <ItemCard
                  key={item.inventoryId}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEquip={handleEquip}
          onDiscard={(id) => {
            setDiscardTarget(id);
            setSelectedItem(null);
          }}
        />
      )}

      {discardTarget !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-bold text-gray-800 text-lg">Discard item?</h3>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDiscardTarget(null)}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
