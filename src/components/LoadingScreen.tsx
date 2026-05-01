import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const bootLines = [
  "[OK] Loading kernel modules...",
  "[OK] Initializing network interfaces...",
  "[OK] Mounting filesystems...",
  "[OK] Starting system services...",
  "[OK] Loading operator profile...",
  "[OK] Decrypting resume data...",
  "[OK] Rendering interface...",
  "[OK] System ready.",
];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < bootLines.length) {
        setLines((prev) => [...prev, bootLines[lineIndex]]);
        setProgress(((lineIndex + 1) / bootLines.length) * 100);
        lineIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
    }, 140);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-bg flex flex-col justify-center px-4 lg:px-8 font-mono"
    >
      <div className="max-w-lg mx-auto w-full">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.5em] text-text-muted mb-4">
            BOOT SEQUENCE — V1.0.0
          </p>
          <div className="h-[2px] bg-border mb-6">
            <motion.div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
        <div className="space-y-1">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-accent/80"
            >
              {line}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: lines.length === bootLines.length ? 1 : 0 }}
            className="text-xs text-text-muted mt-2"
          >
            $ <span className="cursor-blink text-accent">█</span>
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
