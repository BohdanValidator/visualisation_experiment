export const CepTag = ({
  label,
  active,
  color,
  idx,
}: {
  label: string;
  active: boolean;
  color: string;
  idx: number;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 6,
      fontSize: 11,
      fontFamily: "monospace",
      background: active ? `${color}18` : "#0f172a",
      border: `1px solid ${active ? color + "55" : "#1e293b"}`,
      color: active ? "#e2e8f0" : "#334155",
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        flexShrink: 0,
        background: active ? color : "#1e293b",
        boxShadow: active ? `0 0 8px ${color}` : "none",
      }}
    />
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: active ? color : "#334155",
        marginRight: 2,
      }}
    >
      C{idx + 1}
    </span>
    {label}
  </div>
);
