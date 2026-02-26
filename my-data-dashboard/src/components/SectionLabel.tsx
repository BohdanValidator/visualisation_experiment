import type { ReactNode } from "react";

export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontFamily: "monospace",
      fontSize: 10,
      letterSpacing: "0.2em",
      color: "#475569",
      textTransform: "uppercase",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <span
      style={{
        display: "inline-block",
        width: 20,
        height: 2,
        background: "#334155",
        borderRadius: 1,
        flexShrink: 0,
      }}
    />
    {children}
  </div>
);
