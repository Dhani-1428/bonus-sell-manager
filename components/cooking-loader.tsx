"use client"

export function CookingLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative h-56 w-56 flex items-center justify-center">
        {/* Floating food particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: "6px",
              height: "6px",
              backgroundColor: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][i],
              animation: `foodParticle 2s ease-in-out infinite`,
              animationDelay: `${i * 0.35}s`,
              left: `${30 + i * 10}%`,
              bottom: "55%",
            }}
          />
        ))}

        {/* Steam wisps */}
        {[0, 1, 2].map((i) => (
          <div
            key={`steam-${i}`}
            className="absolute opacity-0"
            style={{
              left: `${38 + i * 10}%`,
              bottom: "60%",
              animation: `steam 2.4s ease-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          >
            <svg width="16" height="32" viewBox="0 0 16 32" fill="none">
              <path
                d={i % 2 === 0
                  ? "M8 32C8 32 2 24 6 18C10 12 4 6 8 0"
                  : "M8 32C8 32 14 24 10 18C6 12 12 6 8 0"
                }
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-muted-foreground/40"
              />
            </svg>
          </div>
        ))}

        {/* Pot */}
        <div className="relative">
          {/* Lid - wobbles */}
          <div
            className="relative z-10 mx-auto flex justify-center"
            style={{ animation: "lidWobble 1.2s ease-in-out infinite" }}
          >
            {/* Lid knob */}
            <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="relative">
              <ellipse cx="40" cy="8" rx="8" ry="6" className="fill-muted-foreground" />
              <path
                d="M8 20C8 14 20 10 40 10C60 10 72 14 72 20"
                className="stroke-muted-foreground"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <ellipse cx="40" cy="20" rx="36" ry="4" className="fill-muted" />
            </svg>
          </div>

          {/* Pot body */}
          <svg width="120" height="72" viewBox="0 0 120 72" fill="none" className="-mt-2 relative z-0">
            {/* Handles */}
            <path
              d="M4 20C-4 20 -4 36 4 36"
              className="stroke-muted-foreground"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M116 20C124 20 124 36 116 36"
              className="stroke-muted-foreground"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Pot rim */}
            <rect x="6" y="0" width="108" height="8" rx="4" className="fill-foreground/80" />
            {/* Pot body */}
            <path
              d="M10 8L16 64C16 68 28 72 60 72C92 72 104 68 104 64L110 8"
              className="fill-foreground/70"
            />
            {/* Shine highlight */}
            <path
              d="M24 12L22 56C22 58 30 60 40 60"
              className="stroke-background/20"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Bubble dots at rim */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`bubble-${i}`}
              className="absolute rounded-full bg-chart-3"
              style={{
                width: `${5 + (i % 2) * 3}px`,
                height: `${5 + (i % 2) * 3}px`,
                top: "24px",
                left: `${28 + i * 16}%`,
                animation: `bubble 1.6s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
              }}
            />
          ))}
        </div>

        {/* Flame under pot */}
        <div className="absolute bottom-4 flex items-end justify-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={`flame-${i}`}
              className="rounded-full"
              style={{
                width: `${i === 2 ? 12 : i === 1 || i === 3 ? 10 : 7}px`,
                background: i === 2
                  ? "linear-gradient(to top, #ef4444, #f97316, #fbbf24)"
                  : i === 1 || i === 3
                  ? "linear-gradient(to top, #f97316, #fbbf24, transparent)"
                  : "linear-gradient(to top, #fbbf24, transparent)",
                animation: `flame ${0.3 + i * 0.08}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
                height: `${i === 2 ? 20 : i === 1 || i === 3 ? 16 : 10}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-2 text-lg font-medium text-muted-foreground animate-pulse">
        {text}
      </p>

      {/* Spoon icon row */}
      <div className="mt-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={`dot-${i}`}
            className="h-2 w-2 rounded-full bg-primary"
            style={{
              animation: "dotBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes steam {
          0% {
            opacity: 0;
            transform: translateY(0) scaleX(1);
          }
          30% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scaleX(1.5);
          }
        }

        @keyframes lidWobble {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(-1.5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-4px) rotate(1.5deg);
          }
        }

        @keyframes foodParticle {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-35px) scale(0.9) rotate(180deg);
          }
          80% {
            opacity: 0.3;
            transform: translateY(-10px) scale(0.6) rotate(360deg);
          }
        }

        @keyframes bubble {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          40% {
            opacity: 0.8;
            transform: translateY(-6px) scale(1.2);
          }
          80% {
            opacity: 0;
            transform: translateY(-12px) scale(0.3);
          }
        }

        @keyframes flame {
          0% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.9;
          }
          100% {
            transform: scaleY(1.2) scaleX(0.85);
            opacity: 1;
          }
        }

        @keyframes dotBounce {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
