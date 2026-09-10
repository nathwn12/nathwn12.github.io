import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    const timer = setTimeout(() => {
      if (activeRef.current) onComplete();
    }, 2000);
    return () => {
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center"
    >
      <div className="w-64">
        <p className="text-xs tracking-[0.3em] text-text-dim mb-4 text-center">
          INITIALIZING SESSION
        </p>
        <div className="h-[1px] w-full bg-border relative overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-accent"
          />
        </div>
        <div className="mt-3">
          {[
            "mount /home",
            "load profile.md",
            "init whoami",
          ].map((msg, i) => (
            <motion.p
              key={msg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: [0.35, 0.5, 0.65][i] }}
              className="mt-2 text-[10px] tracking-widest text-text-muted"
            >
              <span className="text-accent-text">[ ok ]</span> {msg}
            </motion.p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
