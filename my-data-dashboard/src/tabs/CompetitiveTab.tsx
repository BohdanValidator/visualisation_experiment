import { useState, useMemo } from "react";
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
  Legend,
} from "recharts";
import type { Brand } from "../types";
import { CEP_LABELS, CEP_COLORS } from "../constants";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { Tip } from "../components/Tip";
import { fmt } from "../utils";

interface Props {
  brands: Brand[];
}

const UTIL_BTN: React.CSSProperties = {
  background: "none",
  border: "1px solid #334155",
  color: "#64748b",
  padding: "4px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: 10,
};

export function CompetitiveTab({ brands }: Props) {
  const [selectedBrandNames, setSelectedBrandNames] = useState<string[]>([]);
  const [selectedCepIndices, setSelectedCepIndices] = useState<number[]>([]);

  const toggleBrand = (name: string) =>
    setSelectedBrandNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const toggleCep = (idx: number) =>
    setSelectedCepIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );

  const selectedBrands = useMemo(
    () => brands.filter((b) => selectedBrandNames.includes(b.name)),
    [brands, selectedBrandNames],
  );

  /* ── per-CEP cross-brand metrics ── */
  const cepAnalysis = useMemo(() => {
    if (selectedBrands.length === 0 || selectedCepIndices.length === 0)
      return [];

    return selectedCepIndices.map((cepIdx) => {
      const label = CEP_LABELS[cepIdx];
      const color = CEP_COLORS[cepIdx];

      const brandData = selectedBrands.map((b) => ({
        brand: b,
        pct: b.ceps[cepIdx]?.pct ?? 0,
        spendAlloc: b.totalSpend * ((b.ceps[cepIdx]?.pct ?? 0) / 100),
      }));

      const avgPct =
        brandData.reduce((s, d) => s + d.pct, 0) / brandData.length;
      const totalSpendAlloc = brandData.reduce(
        (s, d) => s + d.spendAlloc,
        0,
      );
      const sorted = [...brandData].sort((a, b) => b.pct - a.pct);
      const leader = sorted[0];

      return { cepIdx, label, color, avgPct, totalSpendAlloc, leader, sorted };
    });
  }, [selectedBrands, selectedCepIndices]);

  const sortedByInvestment = useMemo(
    () => [...cepAnalysis].sort((a, b) => b.avgPct - a.avgPct),
    [cepAnalysis],
  );

  /* ── per-brand summary ── */
  const brandSummaries = useMemo(
    () =>
      selectedBrands
        .map((brand) => {
          const leads = cepAnalysis.filter(
            (c) => c.leader.brand.name === brand.name && c.leader.pct > 0,
          );
          const avgCoverage =
            selectedCepIndices.length > 0
              ? selectedCepIndices.reduce(
                  (s, i) => s + (brand.ceps[i]?.pct ?? 0),
                  0,
                ) / selectedCepIndices.length
              : 0;
          return { brand, leads, avgCoverage };
        })
        .sort((a, b) => b.leads.length - a.leads.length),
    [selectedBrands, cepAnalysis, selectedCepIndices],
  );

  /* ── radar data (multi-brand overlay) ── */
  const radarData = useMemo(
    () =>
      selectedCepIndices.map((i) => {
        const obj: Record<string, number | string> = {
          subject:
            CEP_LABELS[i].length > 9
              ? CEP_LABELS[i].substring(0, 9) + "…"
              : CEP_LABELS[i],
        };
        selectedBrands.forEach((b) => {
          obj[b.name] = b.ceps[i]?.pct ?? 0;
        });
        return obj;
      }),
    [selectedBrands, selectedCepIndices],
  );

  const canAnalyze =
    selectedBrands.length >= 2 && selectedCepIndices.length >= 1;

  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Step 1: Brand selection ── */}
      <Card>
        <SectionLabel>Step 1 — Select Brands to Compare</SectionLabel>
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
        >
          {brands.map((b) => {
            const active = selectedBrandNames.includes(b.name);
            return (
              <button
                key={b.name}
                type="button"
                className="brand-btn"
                onClick={() => toggleBrand(b.name)}
                style={{
                  background: active ? b.color + "22" : "#0f172a",
                  color: active ? b.color : "#475569",
                  border: `2px solid ${active ? b.color : "#1e293b"}`,
                  boxShadow: active ? `0 0 14px ${b.color}44` : "none",
                  transform: active ? "translateY(-2px)" : "none",
                }}
              >
                {b.name}
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    opacity: 0.6,
                    fontFamily: "monospace",
                    fontWeight: 400,
                  }}
                >
                  {b.creatives.length}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={UTIL_BTN}
            onClick={() => setSelectedBrandNames(brands.map((b) => b.name))}
          >
            All
          </button>
          <button
            type="button"
            style={UTIL_BTN}
            onClick={() => setSelectedBrandNames([])}
          >
            Clear
          </button>
          {selectedBrands.length === 1 && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "monospace",
                fontSize: 10,
                color: "#f59e0b",
              }}
            >
              Select at least 2 brands to compare
            </span>
          )}
          {selectedBrands.length >= 2 && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "monospace",
                fontSize: 10,
                color: "#10b981",
              }}
            >
              {selectedBrands.length} brands selected
            </span>
          )}
        </div>
      </Card>

      {/* ── Step 2: CEP selection ── */}
      {selectedBrands.length >= 2 && (
        <Card>
          <SectionLabel>Step 2 — Select CEPs to Analyse</SectionLabel>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            {CEP_LABELS.map((label, i) => {
              const active = selectedCepIndices.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCep(i)}
                  style={{
                    background: active ? CEP_COLORS[i] + "22" : "#0f172a",
                    color: active ? CEP_COLORS[i] : "#475569",
                    border: `1px solid ${active ? CEP_COLORS[i] : "#1e293b"}`,
                    borderRadius: 20,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    transition: "all 0.12s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={UTIL_BTN}
              onClick={() =>
                setSelectedCepIndices(CEP_LABELS.map((_, i) => i))
              }
            >
              All
            </button>
            <button
              type="button"
              style={UTIL_BTN}
              onClick={() => setSelectedCepIndices([])}
            >
              Clear
            </button>
          </div>
        </Card>
      )}

      {/* ── Analysis ── */}
      {canAnalyze && (
        <>
          {/* Most invested CEPs — avg creative coverage */}
          <Card>
            <SectionLabel>
              Most Invested CEPs — Avg. Creative Coverage (%)
            </SectionLabel>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: "#475569",
                marginBottom: 12,
              }}
            >
              Average % of creatives per brand that address each CEP. Higher =
              more consistently featured across the selected brands.
            </div>
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, sortedByInvestment.length * 38)}
            >
              <BarChart
                data={sortedByInvestment.map((c) => ({
                  name: c.label,
                  "Avg %": parseFloat(c.avgPct.toFixed(1)),
                  "Est. Spend": Math.round(c.totalSpendAlloc),
                }))}
                layout="vertical"
                margin={{ left: 120, right: 60, top: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{
                    fontSize: 10,
                    fill: "#475569",
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{
                    fontSize: 10,
                    fill: "#94a3b8",
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<Tip />}
                  formatter={(v: unknown, name: string) =>
                    name === "Avg %"
                      ? [`${v}%`, "Avg Coverage"]
                      : [fmt(v as number), "Est. Spend (all brands)"]
                  }
                />
                <Bar dataKey="Avg %" radius={[0, 4, 4, 0]}>
                  {sortedByInvestment.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Multi-brand radar overlay — only when >=3 CEPs selected */}
          {selectedCepIndices.length >= 3 && (
            <Card>
              <SectionLabel>Multi-Brand CEP Radar</SectionLabel>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
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
                  {selectedBrands.map((b) => (
                    <Radar
                      key={b.name}
                      name={b.name}
                      dataKey={b.name}
                      stroke={b.color}
                      fill={b.color}
                      fillOpacity={0.1}
                      dot={{ fill: b.color, r: 3 }}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "#94a3b8",
                    }}
                  />
                  <Tooltip
                    content={<Tip />}
                    formatter={(v: unknown) => [`${v}%`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CEP Leaders grid */}
          <Card>
            <SectionLabel>CEP Leaders — Who Dominates Each Category?</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {cepAnalysis.map((c) => {
                const runnerUp = c.sorted[1];
                const margin = c.sorted[0].pct - (runnerUp?.pct ?? 0);
                const allZero = c.sorted[0].pct === 0;

                return (
                  <div
                    key={c.cepIdx}
                    style={{
                      background: "#0f172a",
                      border: `1px solid ${c.color}33`,
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    {/* CEP header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: c.color,
                          boxShadow: `0 0 5px ${c.color}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: "#94a3b8",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {c.label}
                      </span>
                    </div>

                    {allZero ? (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: "#334155",
                        }}
                      >
                        No investment across selected brands
                      </div>
                    ) : (
                      <>
                        {/* Leader name + score */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 17,
                              fontWeight: 700,
                              color: c.leader.brand.color,
                            }}
                          >
                            {c.leader.brand.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 14,
                              color: c.color,
                              fontWeight: 700,
                            }}
                          >
                            {c.leader.pct}%
                          </span>
                        </div>

                        {runnerUp && (
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: "#475569",
                              marginBottom: 10,
                            }}
                          >
                            +{margin}pp vs {runnerUp.brand.name} (
                            {runnerUp.pct}%)
                          </div>
                        )}

                        {/* Mini bar comparison */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {c.sorted.map((d) => (
                            <div
                              key={d.brand.name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  width: 54,
                                  fontSize: 9,
                                  fontFamily: "monospace",
                                  color: d.brand.color,
                                  textAlign: "right",
                                  flexShrink: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {d.brand.name}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  height: 4,
                                  background: "#1e293b",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${d.pct}%`,
                                    height: "100%",
                                    background:
                                      d.brand.name === c.leader.brand.name
                                        ? d.brand.color
                                        : d.brand.color + "66",
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  width: 28,
                                  fontSize: 9,
                                  fontFamily: "monospace",
                                  color: "#475569",
                                  textAlign: "right",
                                }}
                              >
                                {d.pct}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Executive Summary */}
          <Card>
            <SectionLabel>Executive Summary</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {brandSummaries.map(({ brand, leads, avgCoverage }) => {
                const dominates = leads.filter((c) => c.leader.pct >= 50);
                const narrowLeads = leads.filter((c) => c.leader.pct < 50);
                const dominancePct = Math.round(
                  (leads.length / selectedCepIndices.length) * 100,
                );

                return (
                  <div
                    key={brand.name}
                    style={{
                      background: "#0f172a",
                      border: `1px solid ${brand.color}44`,
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    {/* Brand header + KPIs */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 12,
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: brand.color,
                            boxShadow: `0 0 8px ${brand.color}`,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 15,
                            fontWeight: 700,
                            color: brand.color,
                          }}
                        >
                          {brand.name}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                        <Kpi
                          value={`${leads.length}/${selectedCepIndices.length}`}
                          label="CEPs led"
                          color="#f59e0b"
                        />
                        <Kpi
                          value={`${avgCoverage.toFixed(0)}%`}
                          label="avg coverage"
                          color="#60a5fa"
                        />
                        <Kpi
                          value={`${dominancePct}%`}
                          label="dominance"
                          color="#10b981"
                        />
                      </div>
                    </div>

                    {leads.length === 0 ? (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "#475569",
                          fontStyle: "italic",
                        }}
                      >
                        Does not lead in any of the selected CEPs among the
                        chosen brands.
                      </div>
                    ) : (
                      <>
                        {/* Narrative */}
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            color: "#94a3b8",
                            marginBottom: 10,
                            lineHeight: 1.7,
                          }}
                        >
                          <strong style={{ color: "#e2e8f0" }}>
                            {brand.name}
                          </strong>{" "}
                          leads in{" "}
                          <strong style={{ color: brand.color }}>
                            {leads.length} of {selectedCepIndices.length}
                          </strong>{" "}
                          selected CEPs with{" "}
                          {avgCoverage.toFixed(0)}% average creative coverage.
                          {dominates.length > 0 && (
                            <>
                              {" "}
                              Dominant (≥50%) in:{" "}
                              <strong style={{ color: "#e2e8f0" }}>
                                {dominates.map((c) => c.label).join(", ")}
                              </strong>
                              .
                            </>
                          )}
                          {narrowLeads.length > 0 && (
                            <>
                              {" "}
                              Narrow lead in: {narrowLeads.map((c) => c.label).join(", ")}.
                            </>
                          )}
                        </div>

                        {/* CEP tags */}
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {leads.map((c) => (
                            <span
                              key={c.cepIdx}
                              style={{
                                background: c.color + "18",
                                border: `1px solid ${c.color}55`,
                                color: c.color,
                                borderRadius: 12,
                                padding: "3px 10px",
                                fontFamily: "monospace",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {c.label} · {c.leader.pct}%
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Nudge */}
      {selectedBrands.length >= 2 && selectedCepIndices.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            fontFamily: "monospace",
            fontSize: 12,
            color: "#334155",
          }}
        >
          Now select at least 1 CEP above to run the analysis ↑
        </div>
      )}
    </div>
  );
}

/* ── tiny inline KPI widget ── */
function Kpi({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 20,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          color: "#475569",
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}
