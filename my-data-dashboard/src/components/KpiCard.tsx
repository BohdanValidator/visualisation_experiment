export const KpiCard = ({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) => (
  <div
    style={{
      background: "#0f172a",
      borderRadius: 8,
      padding: "18px 22px",
      borderTop: `3px solid ${color}`,
      border: `1px solid #1e293b`,
    }}
  >
    <div
      style={{
        fontFamily: "monospace",
        fontSize: 9,
        color: "#475569",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          marginTop: 6,
          fontFamily: "monospace",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);
