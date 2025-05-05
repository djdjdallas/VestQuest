import { useState, useEffect } from "react";

const LoginDecoration = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // If not mounted yet (during SSR), don't render anything
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Abstract shapes */}
      <div className="absolute top-24 right-24 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute bottom-12 left-12 w-48 h-48 rounded-full bg-white/5 blur-xl" />
      <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-lg" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

      {/* Animated elements */}
      <div className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full bg-white/20 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-white/20 animate-ping opacity-75" />

      {/* Chart visualization */}
      <div className="absolute bottom-32 right-24 flex items-end h-32 gap-2 opacity-30">
        {[40, 25, 60, 30, 45, 80, 50, 65, 40, 50, 70, 60].map((height, i) => (
          <div
            key={i}
            className="w-3 bg-white/40 rounded-t-sm transition-all duration-1000"
            style={{
              height: `${height}%`,
              animationDelay: `${i * 100}ms`,
              animation: "pulse 4s infinite",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginDecoration;
