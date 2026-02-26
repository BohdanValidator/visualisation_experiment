import type { Feature } from "../types";

export const FBar = ({ name, val, color }: Feature) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
  >
    <div
      style={{
        width: 115,
        fontSize: 11,
        color: "#94a3b8",
        textAlign: "right",
        flexShrink: 0,
        fontFamily: "monospace",
      }}
    >
      {name}
    </div>
    <div
      style={{
        flex: 1,
        height: 8,
        background: "#0f172a",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${val}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width .7s ease",
        }}
      />
    </div>
    <div
      style={{
        width: 38,
        fontSize: 11,
        fontFamily: "monospace",
        fontWeight: 700,
        color: "#e2e8f0",
      }}
    >
      {val}%
    </div>
  </div>
);
