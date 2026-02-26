import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Brand } from "../types";
import { PALETTE, CEP_COLORS } from "../constants";
import { fmt } from "../utils";
import { KpiCard } from "../components/KpiCard";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { FBar } from "../components/FBar";
import { Tip } from "../components/Tip";

interface OverviewTabProps {
  brand: Brand;
  brands: Brand[];
  brandName: string | null;
  handleBrandClick: (name: string) => void;
}

export function OverviewTab({
  brand,
  brands,
  brandName,
  handleBrandClick,
}: OverviewTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
      >
        <KpiCard
          label="Total Spend"
          value={fmt(brand.totalSpend)}
          color={brand.color}
          sub={`${brand.creatives.length} creatives`}
        />
        <KpiCard
          label="Avg Spend / Creative"
          value={fmt(brand.totalSpend / brand.creatives.length)}
          color="#f59e0b"
        />
        <KpiCard
          label="CEPs Active"
          value={`${brand.activeCeps} / 11`}
          color="#10b981"
        />
        <KpiCard
          label="Market Rank (spend)"
          value={`#${
            [...brands]
              .sort((a, b) => b.totalSpend - a.totalSpend)
              .findIndex((b) => b.name === brand.name) + 1
          }`}
          color="#E56661"
          sub={`of ${brands.length} brands`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Card>
          <SectionLabel>Creative Feature Usage</SectionLabel>
          {brand.features.map((f) => (
            <FBar key={f.name} {...f} />
          ))}
        </Card>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Card>
            <SectionLabel>Objective Split</SectionLabel>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(Object.entries(brand.objectives) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([k, v], i) => (
                  <div
                    key={k}
                    style={{
                      flex: "1 1 100px",
                      background: "#0f172a",
                      borderRadius: 8,
                      padding: "14px 16px",
                      border: `1px solid ${PALETTE[i]}44`,
                      borderTop: `3px solid ${PALETTE[i]}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: PALETTE[i],
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        fontFamily: "monospace",
                        marginTop: 3,
                      }}
                    >
                      {k}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>Valence Split</SectionLabel>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(Object.entries(brand.valences) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([k, v], i) => (
                  <div
                    key={k}
                    style={{
                      flex: "1 1 100px",
                      background: "#0f172a",
                      borderRadius: 8,
                      padding: "14px 16px",
                      border: `1px solid ${CEP_COLORS[i + 2]}44`,
                      borderTop: `3px solid ${CEP_COLORS[i + 2]}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: CEP_COLORS[i + 2],
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        fontFamily: "monospace",
                        marginTop: 3,
                      }}
                    >
                      {k}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionLabel>
          All Brands — Total Spend (click to switch)
        </SectionLabel>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={[...brands]
              .sort((a, b) => b.totalSpend - a.totalSpend)
              .map((b) => ({
                name: b.name,
                v: b.totalSpend,
                color: b.color,
              }))}
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          >
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 10,
                fill: "#64748b",
                fontFamily: "monospace",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<Tip />} />
            <Bar
              dataKey="v"
              radius={[4, 4, 0, 0]}
              onClick={(d: { name?: string }) => {
                if (d && d.name) {
                  handleBrandClick(d.name);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              {[...brands]
                .sort((a, b) => b.totalSpend - a.totalSpend)
                .map((b, i) => (
                  <Cell
                    key={i}
                    fill={b.name === brandName ? b.color : "#1e293b"}
                    stroke={b.color}
                    strokeWidth={1}
                  />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
