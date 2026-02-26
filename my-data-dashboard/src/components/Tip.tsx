import type { TooltipProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { fmt } from "../utils";

export const Tip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType> & {
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #475569",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e2e8f0",
        boxShadow: "0 8px 24px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ color: "#64748b", marginBottom: 4, fontSize: 11 }}>
        {String(label)}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: (p.fill ?? p.color ?? "#fff") as string }}>
          {typeof p.value === "number" && p.value > 10000
            ? fmt(p.value)
            : String(p.value)}
        </div>
      ))}
    </div>
  );
};
