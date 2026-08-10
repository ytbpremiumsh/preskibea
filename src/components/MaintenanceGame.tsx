import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "playing" | "over";

const W = 600;
const H = 180;
const GROUND = 150;

export function MaintenanceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("pk_maint_best") : null;
    return v ? Number(v) || 0 : 0;
  });

  const stateRef = useRef<State>("idle");
  stateRef.current = state;

  const game = useRef({
    y: 0,
    vy: 0,
    obstacles: [] as { x: number; w: number; h: number }[],
    speed: 5.4,
    t: 0,
    score: 0,
  });

  const reset = useCallback(() => {
    game.current = { y: 0, vy: 0, obstacles: [], speed: 5.4, t: 0, score: 0 };
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    if (stateRef.current === "playing") {
      if (game.current.y === 0) game.current.vy = -12.2;
      return;
    }
    reset();
    setState("playing");
  }, [reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim() || "#22315F";
    const gold = css.getPropertyValue("--gold").trim() || "#FBD98A";
    const muted = css.getPropertyValue("--muted-foreground").trim() || "#777";

    let raf = 0;

    const draw = () => {
      const g = game.current;

      if (stateRef.current === "playing") {
        g.t += 1;
        g.vy += 0.62;
        g.y = Math.min(0, g.y + g.vy);
        if (g.y === 0) g.vy = 0;
        g.speed = 5.4 + Math.min(4, g.t / 900);

        for (const o of g.obstacles) o.x -= g.speed;
        g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10);

        const last = g.obstacles[g.obstacles.length - 1];
        if (!last || last.x < W - (170 + Math.random() * 190)) {
          const h = 22 + Math.random() * 26;
          g.obstacles.push({ x: W + 20, w: 14 + Math.random() * 12, h });
        }

        // collision
        const px = 58;
        const pw = 26;
        const ph = 30;
        const py = GROUND - ph + g.y;
        for (const o of g.obstacles) {
          if (
            px + pw - 4 > o.x &&
            px + 4 < o.x + o.w &&
            py + ph > GROUND - o.h
          ) {
            setState("over");
            setBest((b) => {
              const nb = Math.max(b, Math.floor(g.score));
              localStorage.setItem("pk_maint_best", String(nb));
              return nb;
            });
            break;
          }
        }

        g.score += 0.12;
        if (Math.floor(g.score) !== Math.floor(g.score - 0.12)) setScore(Math.floor(g.score));
      }

      // render
      ctx.clearRect(0, 0, W, H);

      // ground
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 1.5);
      ctx.lineTo(W, GROUND + 1.5);
      ctx.stroke();

      // ground dashes
      ctx.strokeStyle = muted;
      ctx.lineWidth = 2;
      const off = (game.current.t * game.current.speed) % 60;
      for (let x = -off; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 12);
        ctx.lineTo(x + 22, GROUND + 12);
        ctx.stroke();
      }

      // player (graduation cap runner block)
      const px = 58;
      const pw = 26;
      const ph = 30;
      const py = GROUND - ph + game.current.y;
      ctx.fillStyle = ink;
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = gold;
      ctx.fillRect(px - 6, py - 7, pw + 12, 6);
      ctx.fillRect(px + pw - 9, py + 8, 5, 5);

      // obstacles
      for (const o of game.current.obstacles) {
        ctx.fillStyle = gold;
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(o.x, GROUND - o.h, o.w, o.h);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="card-flat overflow-hidden p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Mini Game — Lompati rintangan</span>
        <span className="tabular-nums">
          Skor {score} · Terbaik {best}
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Mainkan mini game"
        onClick={jump}
        onKeyDown={(e) => {
          if (e.key === "Enter") jump();
        }}
        className="relative w-full cursor-pointer select-none rounded-xl border-2 border-ink/10 bg-muted/40"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block h-auto w-full"
        />
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/70 backdrop-blur-[2px]">
            <p className="font-display text-lg font-extrabold">
              {state === "over" ? "Game Over" : "Sambil Menunggu, Main Dulu"}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Tekan Spasi / klik untuk {state === "over" ? "main lagi" : "mulai"} & melompat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
