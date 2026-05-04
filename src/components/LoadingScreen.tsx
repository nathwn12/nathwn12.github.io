import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const bootLines = [
  "[OK] Loading kernel modules...",
  "[OK] Initializing DMA controller...",
  "[OK] Probing PCI bus...",
  "[OK] Initializing network interfaces...",
  "[OK] Mounting root filesystem...",
  "[OK] Starting syslogd...",
  "[OK] Starting cron daemon...",
  "[OK] Starting system services...",
  "[OK] Loading operator profile...",
  "[OK] Decrypting resume data...",
  "[OK] Rendering interface...",
  "[OK] System ready.",
];

const delays = [140, 220, 160, 260, 240, 170, 250, 220, 200, 300, 220, 400];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(false);

  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let lineIndex = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!activeRef.current) return;
      if (lineIndex < bootLines.length) {
        setLines((prev) => [...prev, bootLines[lineIndex]]);
        setProgress(((lineIndex + 1) / bootLines.length) * 100);
        const delay = delays[lineIndex] + (Math.random() - 0.5) * 100;
        lineIndex++;
        timer = setTimeout(tick, delay);
      } else {
        setShowCursor(true);
        timer = setTimeout(onComplete, 500);
      }
    };

    timer = setTimeout(tick, delays[0]);
    return () => {
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-bg flex flex-col justify-center px-4 lg:px-8 font-mono"
    >
      <div className="max-w-lg mx-auto w-full">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.5em] text-text-muted mb-4">
            BOOT SEQUENCE — V1.0.0
          </p>
          <div className="h-[2px] bg-border mb-6">
            <div
              className="h-full bg-accent transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
              className="text-xs text-accent/80"
            >
              {line}
            </motion.p>
          ))}
          {showCursor && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-text-muted mt-2"
            >
              $ <span className="cursor-blink text-accent">█</span>
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
