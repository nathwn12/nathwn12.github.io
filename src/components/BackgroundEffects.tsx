export function BackgroundEffects() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.008) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.008) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
      aria-hidden="true"
    />
  )
}
