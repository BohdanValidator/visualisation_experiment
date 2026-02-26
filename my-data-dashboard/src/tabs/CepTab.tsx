import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import type { Brand } from "../types";
import { CEP_LABELS, CEP_COLORS } from "../constants";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { CepTag } from "../components/CepTag";
import { Tip } from "../components/Tip";

interface CepTabProps {
  brand: Brand;
  brands: Brand[];
  brandName: string | null;
  handleBrandClick: (name: string) => void;
}

export function CepTab({
  brand,
  brands,
  brandName,
  handleBrandClick,
}: CepTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Card>
          <SectionLabel>CEP Radar — {brand.name}</SectionLabel>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart
              data={brand.ceps.map((c) => ({
                subject:
                  c.label.length > 10
                    ? c.label.substring(0, 10) + "…"
                    : c.label,
                pct: c.pct,
              }))}
            >
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fontSize: 9,
                  fill: "#64748b",
                  fontFamily: "monospace",
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 8, fill: "#334155" }}
                axisLine={false}
              />
              <Radar
                dataKey="pct"
                stroke={brand.color}
                fill={brand.color}
                fillOpacity={0.2}
                dot={{ fill: brand.color, r: 4 }}
              />
              <Tooltip content={<Tip />} formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionLabel>CEP Frequency (# of creatives)</SectionLabel>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={brand.ceps}
              layout="vertical"
              margin={{ left: 100, right: 20 }}
            >
              <XAxis
                type="number"
                domain={[0, brand.creatives.length]}
                tick={{
                  fontSize: 10,
                  fill: "#475569",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={95}
                tick={{
                  fontSize: 9,
                  fill: "#94a3b8",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {brand.ceps.map((_, i) => (
                  <Cell key={i} fill={CEP_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionLabel>CEP Presence — {brand.name}</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
          }}
        >
          {brand.ceps.map((c, i) => (
            <CepTag
              key={i}
              label={c.label}
              active={c.count > 0}
              color={CEP_COLORS[i]}
              idx={i}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>
          Cross-Brand CEP Matrix (click row to switch)
        </SectionLabel>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "monospace",
              fontSize: 11,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    color: "#334155",
                    fontWeight: 600,
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  Brand
                </th>
                {CEP_LABELS.map((l, i) => (
                  <th
                    key={i}
                    title={l}
                    style={{
                      padding: "8px 6px",
                      color: CEP_COLORS[i],
                      fontWeight: 600,
                      borderBottom: "1px solid #1e293b",
                      fontSize: 9,
                      textAlign: "center",
                    }}
                  >
                    C{i + 1}
                  </th>
                ))}
                <th
                  style={{
                    padding: "8px 12px",
                    color: "#334155",
                    fontWeight: 600,
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b, ri) => {
                const isActive = b.name === brandName;
                const bg = isActive ? "#162032" : "transparent";
                return (
                  <tr
                    key={ri}
                    className="trow"
                    onClick={() => handleBrandClick(b.name)}
                  >
                    <td
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid #0f172a",
                        fontWeight: 700,
                        color: b.color,
                        background: bg,
                      }}
                    >
                      {b.name}
                    </td>
                    {b.ceps.map((c, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "9px 6px",
                          textAlign: "center",
                          borderBottom: "1px solid #0f172a",
                          background: bg,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            margin: "0 auto",
                            background:
                              c.count > 0 ? CEP_COLORS[ci] : "#1e293b",
                            boxShadow:
                              c.count > 0
                                ? `0 0 5px ${CEP_COLORS[ci]}`
                                : "none",
                          }}
                        />
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid #0f172a",
                        fontWeight: 700,
                        color: "#f59e0b",
                        background: bg,
                      }}
                    >
                      {b.activeCeps}/11
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
