"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const CW = 720,
  CH = 260,
  GROUND = 200,
  PX_RUN = 120,
  PX_BLOCK = 340;
const GRAVITY = 0.5,
  JUMP_FORCE = -11;
const BOSS_EVERY = 280; // distance units between bosses

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "running" | "approaching" | "blocked";

interface Boss {
  id: number;
  distance: number; // at what distance they appear
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  challenge: Challenge;
}

interface Challenge {
  type: "daily_task" | "login_streak" | "total_tasks";
  label: string;
  description: string;
  hint: string; // where to go / what to do
  hintLink: string;
  mockCompleted: boolean; // swap for real API later
  target?: number; // e.g. 5 total tasks
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  r: number;
}

// ─── Boss definitions ─────────────────────────────────────────────────────────
const BOSSES: Boss[] = [
  {
    id: 1,
    distance: BOSS_EVERY,
    name: "The Sloth",
    emoji: "🦥",
    color: "#f87171",
    glowColor: "#ef4444",
    challenge: {
      type: "daily_task",
      label: "Daily Task Required",
      description:
        "The Sloth blocks your path. Prove you've been productive today!",
      hint: "Complete any daily task to pass",
      hintLink: "/tasks",
      mockCompleted: false,
    },
  },
  {
    id: 2,
    distance: BOSS_EVERY * 2,
    name: "The Ghost",
    emoji: "👻",
    color: "#c084fc",
    glowColor: "#a855f7",
    challenge: {
      type: "login_streak",
      label: "Login Streak Required",
      description:
        "The Ghost only lets in those who show up every day. Keep your streak alive!",
      hint: "Log in 3 days in a row to pass",
      hintLink: "/dashboard",
      mockCompleted: false,
      target: 3,
    },
  },
  {
    id: 3,
    distance: BOSS_EVERY * 3,
    name: "The Golem",
    emoji: "🗿",
    color: "#fbbf24",
    glowColor: "#f59e0b",
    challenge: {
      type: "total_tasks",
      label: "Task Milestone Required",
      description:
        "The Golem is immovable — unless you've completed 5 tasks total.",
      hint: "Complete 5 tasks in total to pass",
      hintLink: "/tasks",
      mockCompleted: false,
      target: 5,
    },
  },
  {
    id: 4,
    distance: BOSS_EVERY * 4,
    name: "The Titan",
    emoji: "🏔️",
    color: "#34d399",
    glowColor: "#10b981",
    challenge: {
      type: "daily_task",
      label: "Daily Task Required",
      description:
        "The Titan stands tall. Show today's effort to move forward.",
      hint: "Complete any daily task to pass",
      hintLink: "/tasks",
      mockCompleted: false,
    },
  },
  {
    id: 5,
    distance: BOSS_EVERY * 5,
    name: "The Void",
    emoji: "🌑",
    color: "#60a5fa",
    glowColor: "#3b82f6",
    challenge: {
      type: "total_tasks",
      label: "Task Milestone Required",
      description:
        "The Void is endless — unless you've completed 10 tasks total.",
      hint: "Complete 10 tasks in total to pass",
      hintLink: "/tasks",
      mockCompleted: false,
      target: 10,
    },
  },
];

// ─── Static stars ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: Math.random() * CW,
  y: Math.random() * 140,
  r: Math.random() * 1.6 + 0.3,
  phase: Math.random() * Math.PI * 2,
  speed: 0.012 + Math.random() * 0.018,
}));

// ─── Component ────────────────────────────────────────────────────────────────
export default function RunnerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All live game state
  const s = useRef({
    phase: "idle" as Phase,
    frame: 0,
    distance: 0,
    speed: 3.8,
    playerX: PX_RUN,
    playerY: GROUND,
    playerVY: 0,
    jumping: false,
    bgOff: 0,
    bgOff2: 0,
    particles: [] as Particle[],
    floats: [] as FloatText[],
    currentBossX: CW + 100, // boss screen position when approaching
    bossShake: 0,
    raf: 0,
    bossIndex: -1, // which boss is active (-1 = none)
    approachTimer: 0,
    completedBosses: new Set<number>(),
  });

  const [bosses, setBosses] = useState<Boss[]>(BOSSES);
  const [phase, setPhase] = useState<Phase>("idle");
  const [distance, setDistance] = useState(0);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // ── Particles / floats ────────────────────────────────────────────────────
  const burst = (x: number, y: number, color: string, n = 10) => {
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      s.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (Math.random() * 4 + 1.5),
        vy: Math.sin(angle) * (Math.random() * 4 + 1.5),
        life: 45,
        color,
        r: Math.random() * 4 + 2,
      });
    }
  };

  const float = (x: number, y: number, text: string, color: string) => {
    s.current.floats.push({ x, y, text, color, life: 70 });
  };

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const g = s.current;
    const shake = g.bossShake > 0 ? (Math.random() - 0.5) * g.bossShake : 0;

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, CH);
    sky.addColorStop(0, "#050510");
    sky.addColorStop(1, "#0f1535");
    ctx.fillStyle = sky;
    ctx.fillRect(-10, -10, CW + 20, CH + 20);

    // Stars
    STARS.forEach((star) => {
      const a = 0.4 + 0.55 * Math.sin(star.phase + g.frame * star.speed);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Far mountains (parallax)
    const drawMountains = (
      offsetX: number,
      fill: string,
      heights: number[],
    ) => {
      for (let pass = -1; pass <= 2; pass++) {
        const ox = pass * CW - (offsetX % CW);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(ox, GROUND);
        heights.forEach((h, i) =>
          ctx.lineTo(ox + i * (CW / (heights.length - 1)), GROUND - h),
        );
        ctx.lineTo(ox + CW, GROUND);
        ctx.closePath();
        ctx.fill();
      }
    };
    drawMountains(
      g.bgOff * 0.3,
      "#0d1240",
      [0, 75, 40, 100, 55, 90, 35, 70, 50, 0],
    );
    drawMountains(g.bgOff * 0.7, "#080e28", [0, 44, 18, 60, 28, 50, 16, 38, 0]);

    // Ground
    ctx.fillStyle = "#060d1f";
    ctx.fillRect(-10, GROUND, CW + 20, CH - GROUND + 10);

    // Ground glow line
    ctx.save();
    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, GROUND);
    ctx.lineTo(CW + 10, GROUND);
    ctx.stroke();
    ctx.restore();

    // Road dashes
    ctx.fillStyle = "rgba(59,130,246,0.15)";
    const dashW = 38,
      dashH = 3,
      dashY = GROUND + 14;
    const dashOffset = g.bgOff % (dashW * 2);
    for (let x = -dashW * 2 + dashOffset; x < CW + dashW; x += dashW * 2) {
      ctx.fillRect(x, dashY, dashW, dashH);
    }

    // ── Boss on screen ─────────────────────────────────────────────────────
    if (
      (g.phase === "approaching" || g.phase === "blocked") &&
      g.bossIndex >= 0
    ) {
      const boss = bosses[g.bossIndex];
      const bx = g.currentBossX;
      const pulse = 1 + 0.06 * Math.sin(g.frame * 0.1);

      // Glow
      ctx.save();
      ctx.shadowColor = boss.glowColor;
      ctx.shadowBlur = 38 + 10 * Math.sin(g.frame * 0.08);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = boss.glowColor;
      ctx.beginPath();
      ctx.arc(bx, GROUND - 44, 44 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Boss emoji
      ctx.font = `${58 * pulse}px serif`;
      ctx.textAlign = "center";
      ctx.fillText(boss.emoji, bx, GROUND - 12);

      // Name tag
      ctx.shadowBlur = 0;
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillStyle = boss.color;
      ctx.fillText(boss.name, bx, GROUND - 72);

      // HP bar (decorative)
      const barW = 80,
        barH = 6;
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(bx - barW / 2, GROUND - 84, barW, barH);
      const hp = g.phase === "blocked" ? 1 : 0;
      const grad = ctx.createLinearGradient(bx - barW / 2, 0, bx + barW / 2, 0);
      grad.addColorStop(0, boss.color);
      grad.addColorStop(1, boss.glowColor);
      ctx.fillStyle = grad;
      ctx.fillRect(bx - barW / 2, GROUND - 84, barW * hp, barH);

      ctx.textAlign = "left";
      ctx.restore();
    }

    // ── Player ────────────────────────────────────────────────────────────
    const px = g.playerX,
      py = g.playerY;
    const runSwing =
      g.phase === "running" && !g.jumping ? Math.sin(g.frame * 0.3) * 13 : 0;

    ctx.save();
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";

    // Head
    ctx.fillStyle = "#60a5fa";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px, py - 36, 9, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(px, py - 27);
    ctx.lineTo(px, py - 10);
    ctx.stroke();

    // Arms
    [
      [-1, 0.3],
      [1, -0.3],
    ].forEach(([side, factor]) => {
      ctx.beginPath();
      ctx.moveTo(px, py - 23);
      ctx.lineTo(px + side * 12, py - 23 + runSwing * factor);
      ctx.stroke();
    });

    // Legs
    [
      [-1, 0.5],
      [1, -0.5],
    ].forEach(([side, factor]) => {
      ctx.beginPath();
      ctx.moveTo(px, py - 10);
      ctx.lineTo(px + side * 9, py - 10 + runSwing * factor);
      ctx.lineTo(px + side * 10, py);
      ctx.stroke();
    });

    ctx.restore();

    // ── Particles ─────────────────────────────────────────────────────────
    s.current.particles = g.particles.filter((p) => p.life > 0);
    g.particles.forEach((p) => {
      ctx.globalAlpha = p.life / 45;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.life / 45), 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
    });
    ctx.globalAlpha = 1;

    // ── Float texts ────────────────────────────────────────────────────────
    s.current.floats = g.floats.filter((f) => f.life > 0);
    g.floats.forEach((f) => {
      ctx.globalAlpha = Math.min(1, f.life / 25);
      ctx.fillStyle = f.color;
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillText(f.text, f.x, f.y);
      f.y -= 1.1;
      f.life--;
    });
    ctx.globalAlpha = 1;

    // ── Idle overlay ──────────────────────────────────────────────────────
    if (g.phase === "idle") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = "center";
      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillText("LIFETHON RUNNER", CW / 2, CH / 2 - 16);
      ctx.fillStyle = "#475569";
      ctx.font = "13px 'Courier New', monospace";
      ctx.fillText(
        "Complete real challenges to defeat bosses & keep running",
        CW / 2,
        CH / 2 + 12,
      );
      ctx.textAlign = "left";
    }

    ctx.restore(); // shake
  }, [bosses]);

  // ── Tick ──────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const g = s.current;

    g.frame++;
    if (g.bossShake > 0) g.bossShake *= 0.85;

    if (g.phase === "running") {
      g.distance += 0.06;
      g.bgOff += 3.8;
      g.bgOff2 += 1.5;

      // Physics
      if (g.jumping) {
        g.playerVY += GRAVITY;
        g.playerY += g.playerVY;
        if (g.playerY >= GROUND) {
          g.playerY = GROUND;
          g.playerVY = 0;
          g.jumping = false;
        }
      }

      // Idle hop every ~3s for life
      if (g.frame % 190 === 0 && !g.jumping) {
        g.playerVY = JUMP_FORCE * 0.6;
        g.jumping = true;
      }

      // Check next boss
      const nextBossIdx = bosses.findIndex(
        (b) => b.distance <= g.distance && !g.completedBosses.has(b.id),
      );

      if (nextBossIdx !== -1) {
        g.phase = "approaching";
        g.bossIndex = nextBossIdx;
        g.currentBossX = CW + 80;
        g.approachTimer = 0;
        setPhase("approaching");
      }

      setDistance(Math.floor(g.distance * 10));
    } else if (g.phase === "approaching") {
      g.distance += 0.02;
      g.bgOff += 1.2;
      g.approachTimer++;

      // Boss slides in
      if (g.currentBossX > PX_BLOCK + 100) {
        g.currentBossX -= 5.5;
      } else {
        // Player slows and stops
        if (g.playerX < PX_BLOCK - 90) {
          g.playerX += 1.5;
        } else {
          // Fully blocked
          g.phase = "blocked";
          g.bossShake = 6;
          burst(
            g.currentBossX,
            GROUND - 44,
            bosses[g.bossIndex]?.glowColor ?? "#fff",
            18,
          );
          burst(g.playerX, g.playerY - 22, "#60a5fa", 10);
          float(g.playerX - 20, g.playerY - 65, "BLOCKED!", "#f87171");
          setPhase("blocked");
          setActiveBoss(bosses[g.bossIndex]);
        }
      }

      if (g.jumping) {
        g.playerVY += GRAVITY;
        g.playerY += g.playerVY;
        if (g.playerY >= GROUND) {
          g.playerY = GROUND;
          g.playerVY = 0;
          g.jumping = false;
        }
      }
    } else if (g.phase === "blocked") {
      // Idle — just particles + boss pulse
    }

    draw();
    g.raf = requestAnimationFrame(tick);
  }, [bosses, draw]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startRun = () => {
    cancelAnimationFrame(s.current.raf);
    Object.assign(s.current, {
      phase: "running",
      frame: 0,
      distance: 0,
      playerX: PX_RUN,
      playerY: GROUND,
      playerVY: 0,
      jumping: false,
      bgOff: 0,
      bgOff2: 0,
      particles: [],
      floats: [],
      currentBossX: CW + 100,
      bossIndex: -1,
      approachTimer: 0,
      bossShake: 0,
    });
    setPhase("running");
    setDistance(0);
    setActiveBoss(null);
    setJustUnlocked(false);
    s.current.raf = requestAnimationFrame(tick);
  };

  // ── Mark challenge done (mock) ─────────────────────────────────────────────
  const completeChallenge = () => {
    const g = s.current;
    if (!activeBoss) return;

    // In future: verify via real API here
    setBosses((prev) =>
      prev.map((b) =>
        b.id === activeBoss.id
          ? { ...b, challenge: { ...b.challenge, mockCompleted: true } }
          : b,
      ),
    );
    g.completedBosses.add(activeBoss.id);

    // Victory
    burst(g.currentBossX, GROUND - 44, activeBoss.glowColor, 26);
    burst(g.playerX, g.playerY - 22, "#fbbf24", 14);
    float(g.playerX - 10, g.playerY - 65, "BOSS DOWN! 🎉", "#fbbf24");

    setJustUnlocked(true);
    setTimeout(() => {
      // Resume running
      g.phase = "running";
      g.playerX = PX_RUN;
      g.bossIndex = -1;
      g.currentBossX = CW + 100;
      setPhase("running");
      setActiveBoss(null);
      setJustUnlocked(false);
    }, 1800);
  };

  // ── Init draw on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(s.current.raf);
  }, [draw]);

  // ── Computed progress ──────────────────────────────────────────────────────
  const totalBosses = bosses.length;
  const defeated = bosses.filter((b) => b.challenge.mockCompleted).length;
  const nextBoss = bosses.find((b) => !b.challenge.mockCompleted);
  const distToNext = nextBoss
    ? Math.max(0, nextBoss.distance * 10 - distance)
    : 0;
  const progressPct = (defeated / totalBosses) * 100;

  const CHALLENGE_ICON: Record<string, string> = {
    daily_task: "✅",
    login_streak: "🔥",
    total_tasks: "📋",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400 font-mono tracking-widest">
            🏃 LIFETHON RUNNER
          </h1>
          <div className="text-sm text-gray-500 font-mono">
            Bosses defeated:{" "}
            <span className="text-yellow-400 font-bold">
              {defeated}/{totalBosses}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-700 font-mono -mt-2">
          {bosses.map((b) => (
            <span
              key={b.id}
              style={{ color: b.challenge.mockCompleted ? b.color : "#374151" }}
            >
              {b.challenge.mockCompleted ? "✓" : "●"} {b.name}
            </span>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Canvas */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="rounded-2xl overflow-hidden border border-blue-950 shadow-2xl shadow-blue-950">
              <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="block w-full"
              />
            </div>

            {/* HUD */}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <p className="text-xs text-gray-600 font-mono">Distance</p>
                <p className="text-xl font-bold text-blue-400 font-mono">
                  {distance}m
                </p>
              </div>
              {phase !== "blocked" && nextBoss && (
                <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                  <p className="text-xs text-gray-600 font-mono">
                    Next boss in
                  </p>
                  <p
                    className="text-xl font-bold font-mono"
                    style={{ color: nextBoss.color }}
                  >
                    ~{distToNext}m
                  </p>
                </div>
              )}
              {defeated === totalBosses && (
                <div className="flex-1 bg-yellow-950 rounded-xl p-3 border border-yellow-800 text-center">
                  <p className="text-xs text-yellow-600 font-mono">
                    All bosses
                  </p>
                  <p className="text-lg font-bold text-yellow-400 font-mono">
                    DEFEATED 🏆
                  </p>
                </div>
              )}
              <button
                onClick={startRun}
                className="px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-700 font-bold font-mono tracking-widest transition-colors text-sm"
              >
                {phase === "idle" ? "▶ START" : "↺ RESTART"}
              </button>
            </div>
          </div>

          {/* Boss list sidebar */}
          <div className="w-56 flex-shrink-0 space-y-2">
            <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">
              Boss Road
            </p>
            {bosses.map((boss) => {
              const done = boss.challenge.mockCompleted;
              const current = activeBoss?.id === boss.id;
              return (
                <div
                  key={boss.id}
                  className="rounded-xl p-3 border transition-all"
                  style={{
                    borderColor: current
                      ? boss.glowColor
                      : done
                        ? "#1f2937"
                        : "#111827",
                    background: current ? `${boss.glowColor}15` : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{boss.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold font-mono truncate"
                        style={{ color: boss.color }}
                      >
                        {boss.name}
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {boss.distance * 10}m
                      </p>
                    </div>
                    {done && <span className="text-green-500 text-sm">✓</span>}
                    {current && !done && (
                      <span className="text-yellow-400 text-sm animate-pulse">
                        ⚔️
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">
                    {CHALLENGE_ICON[boss.challenge.type]} {boss.challenge.hint}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOSS MODAL */}
        {phase === "blocked" && activeBoss && (
          <div
            className="rounded-2xl border-2 p-6 space-y-4 transition-all"
            style={{
              borderColor: activeBoss.glowColor,
              background: `${activeBoss.glowColor}0a`,
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-5xl">{activeBoss.emoji}</span>
              <div>
                <p
                  className="font-bold text-lg font-mono"
                  style={{ color: activeBoss.color }}
                >
                  {activeBoss.name} blocks your path!
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {activeBoss.challenge.description}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
              <span className="text-3xl">
                {CHALLENGE_ICON[activeBoss.challenge.type]}
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm font-mono text-white">
                  {activeBoss.challenge.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeBoss.challenge.hint}
                </p>
              </div>
              <Link
                href={activeBoss.challenge.hintLink}
                className="text-xs px-3 py-2 rounded-lg font-mono font-bold transition-colors"
                style={{
                  background: `${activeBoss.glowColor}30`,
                  color: activeBoss.color,
                }}
              >
                Go →
              </Link>
            </div>

            {justUnlocked ? (
              <div
                className="text-center py-3 rounded-xl font-bold font-mono text-yellow-400 text-lg animate-pulse"
                style={{ background: `${activeBoss.glowColor}20` }}
              >
                🎉 BOSS DEFEATED — CONTINUING!
              </div>
            ) : (
              <div className="flex gap-3">
                {/* Mock button — swap for real API check later */}
                <button
                  onClick={completeChallenge}
                  className="flex-1 py-3 rounded-xl font-bold font-mono text-sm transition-colors"
                  style={{ background: activeBoss.glowColor, color: "#000" }}
                >
                  ✓ Mark as Completed (mock)
                </button>
              </div>
            )}

            <p className="text-xs text-gray-700 font-mono text-center">
              In production this will verify against your real progress from the
              backend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
