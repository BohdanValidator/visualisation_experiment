import { useState, useEffect, useMemo } from "react";
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

// ─── Constants ────────────────────────────────────────────────────────────────
const CEP_LABELS = [
  "Prijs",
  "Aanbieding",
  "Snelheid (5G)",
  "Dekking",
  "Combi-voordeel",
  "Unlimited",
  "Bundelflex",
  "Netwerkkwaliteit",
  "TV-aanbod",
  "Klantenservice",
  "Duurzaamheid",
];

const PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#0ea5e9",
  "#facc15",
  "#f43f5e",
];

const CEP_COLORS = [
  "#60a5fa",
  "#fbbf24",
  "#34d399",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb923c",
  "#a3e635",
  "#f472b6",
  "#2dd4bf",
  "#c084fc",
];

const MEDIUM_COLORS = {
  Televisie: "#3b82f6",
  Radio: "#f59e0b",
  "Social Media": "#ec4899",
  "Online display": "#10b981",
  Dagbladen: "#8b5cf6",
  Magazines: "#06b6d4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BOOL = (v: string): boolean => v === "True" || v === "TRUE";
const NUM = (v: string): number =>
  parseFloat(String(v).replace(/[^\d.]/g, "")) || 0;
const fmt = (n: number): string =>
  n >= 1e6
    ? `€${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
      ? `€${(n / 1e3).toFixed(0)}K`
      : `€${Math.round(n)}`;
const pct = (a: number, b: number): number =>
  b === 0 ? 0 : Math.round((a / b) * 100);
const cepKey = (i: number): string => `CEP_${String(i + 1).padStart(2, "0")}`;

const buildBrands = (rows: any[]): any[] => {
  const map: Record<string, any[]> = {};
  rows.forEach((r: any) => {
    const m: string = r["Merk"] || "Unknown";
    if (!map[m]) map[m] = [];
    map[m].push(r);
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, creatives], idx) => {
      const totalSpend = creatives.reduce(
        (s: number, r: any) => s + NUM(r["Spend"] ?? "0"),
        0,
      );

      const ceps = CEP_LABELS.map((label, i) => {
        const count = creatives.filter((r: any) =>
          BOOL(r[cepKey(i)] ?? ""),
        ).length;
        const spend = creatives
          .filter((r: any) => BOOL(r[cepKey(i)] ?? ""))
          .reduce((s: number, r: any) => s + NUM(r["Spend"] ?? "0"), 0);
        return { label, count, pct: pct(count, creatives.length), spend };
      });

      const objectives: Record<string, number> = {};
      creatives.forEach((r: any) => {
        const o: string = r["Objective"] ?? "?";
        objectives[o] = (objectives[o] ?? 0) + 1;
      });

      const valences: Record<string, number> = {};
      creatives.forEach((r: any) => {
        const v: string = r["Valence"] ?? "?";
        valences[v] = (valences[v] ?? 0) + 1;
      });

      const mediumSpend: Record<string, number> = {};
      creatives.forEach((r: any) => {
        const m: string = r["Mediumtype"] ?? "?";
        mediumSpend[m] = (mediumSpend[m] ?? 0) + NUM(r["Spend"] ?? "0");
      });

      const imago: Record<string, number> = {};
      creatives.forEach((r: any) => {
        const im: string = r["Imago"] ?? "?";
        imago[im] = (imago[im] ?? 0) + 1;
      });

      const fl = (key: string) =>
        pct(
          creatives.filter((r: any) => BOOL(r[key] ?? "")).length,
          creatives.length,
        );
      const fv = (key: string) =>
        pct(
          creatives.filter((r: any) => r[key] && r[key] !== "Afwezig").length,
          creatives.length,
        );

      const features = [
        { name: "Humor", val: fl("Humor"), color: "#f59e0b" },
        {
          name: "Bekende Persoon",
          val: fl("Bekende Personen"),
          color: "#ef4444",
        },
        { name: "Voice-over", val: fv("Voice-over"), color: "#8b5cf6" },
        { name: "Soundlogo", val: fl("DBA - Soundlogo"), color: "#06b6d4" },
        { name: "Muziek", val: fv("Music Type"), color: "#10b981" },
        { name: "DBA Slogan", val: fl("DBA - Slogan"), color: "#f97316" },
        { name: "Karakter", val: fl("DBA - Karakter"), color: "#ec4899" },
        { name: "Mystery Ad", val: fl("Mystery Ad"), color: "#14b8a6" },
      ];

      return {
        name,
        creatives,
        totalSpend,
        ceps,
        objectives,
        valences,
        mediumSpend,
        imago,
        features,
        activeCeps: ceps.filter((c) => c.count > 0).length,
        color: PALETTE[idx % PALETTE.length],
        avgSpend: totalSpend / creatives.length,
        spendEfficiency:
          totalSpend / Math.max(1, ceps.filter((c) => c.count > 0).length),
      };
    });
};

// ─── Micro UI ─────────────────────────────────────────────────────────────────
const Tip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #475569",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: "#e2e8f0",
        boxShadow: "0 8px 24px rgba(0,0,0,.6)",
        zIndex: 100,
      }}
    >
      <div style={{ color: "#64748b", marginBottom: 4, fontSize: 11 }}>
        {String(label)}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill ?? p.color ?? "#fff" }}>
          {p.name && (
            <span style={{ color: "#475569", marginRight: 6 }}>{p.name}:</span>
          )}
          {typeof p.value === "number" && p.value > 10000
            ? fmt(p.value)
            : String(p.value)}
          {typeof p.value === "number" &&
          p.value <= 100 &&
          p.value > 0 &&
          p.unit !== "€"
            ? "%"
            : ""}
        </div>
      ))}
    </div>
  );
};

const Card = ({ children, style }: { children: any; style?: any }) => (
  <div
    style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ children }: { children: any }) => (
  <div
    style={{
      fontFamily: "'JetBrains Mono', monospace",
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

const KpiCard = ({
  label,
  value,
  color,
  sub,
}: {
  label: any;
  value: any;
  color: any;
  sub?: any;
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
        fontFamily: "'JetBrains Mono', monospace",
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
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const FBar = ({ name, val, color }: { name: any; val: any; color: any }) => (
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
        fontFamily: "'JetBrains Mono', monospace",
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
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        color: "#e2e8f0",
      }}
    >
      {val}%
    </div>
  </div>
);

const CepTag = ({
  label,
  active,
  color,
  idx,
}: {
  label: any;
  active: any;
  color: any;
  idx: any;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 6,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const mode = "deepdive";

  useEffect(() => {
    fetch("/data.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const brands = useMemo(() => (rows.length ? buildBrands(rows) : []), [rows]);

  useEffect(() => {
    if (brands.length > 0 && brandName === null) setBrandName(brands[0].name);
  }, [brands, brandName]);

  const handleBrandClick = (name: string) => {
    setBrandName(name);
    setTab("overview");
  };

  const brand = useMemo(
    () => brands.find((b) => b.name === brandName) ?? brands[0] ?? null,
    [brands, brandName],
  );

  const TABS = ["overview", "cep"];

  // Cross-brand comparison data
  const crossBrandCepSpend = useMemo(() => {
    return CEP_LABELS.map((label, i) => {
      const entry: Record<string, any> = {
        name: label.length > 12 ? label.substring(0, 12) + "…" : label,
        fullName: label,
      };
      brands.forEach((b) => {
        entry[b.name] = b.ceps[i].spend;
      });
      return entry;
    });
  }, [brands]);

  const marketTotals = useMemo(() => {
    const totalSpend = brands.reduce((s, b) => s + b.totalSpend, 0);
    const totalCreatives = brands.reduce((s, b) => s + b.creatives.length, 0);
    const avgCeps =
      brands.length > 0
        ? (
            brands.reduce((s, b) => s + b.activeCeps, 0) / brands.length
          ).toFixed(1)
        : 0;
    return { totalSpend, totalCreatives, avgCeps };
  }, [brands]);

  const mediumData = useMemo(() => {
    const mediums = [
      "Televisie",
      "Radio",
      "Social Media",
      "Online display",
      "Dagbladen",
      "Magazines",
    ];
    return brands
      .filter((b) => b.totalSpend > 100000)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .map((b) => {
        const entry: Record<string, any> = { name: b.name, color: b.color };
        mediums.forEach((m) => {
          entry[m] = b.mediumSpend[m] || 0;
        });
        return entry;
      });
  }, [brands]);

  const spendVsCepData = useMemo(() => {
    return brands
      .filter((b) => b.totalSpend > 100000)
      .map((b) => ({
        name: b.name,
        spend: b.totalSpend,
        ceps: b.activeCeps,
        creatives: b.creatives.length,
        color: b.color,
        avgSpend: b.avgSpend,
      }));
  }, [brands]);

  if (loading)
    return (
      <div
        style={{
          width: "100vw",
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#475569",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            letterSpacing: "0.3em",
          }}
        >
          LOADING DATA…
        </div>
      </div>
    );

  if (error || !rows.length)
    return (
      <div
        style={{
          width: "100vw",
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            color: "#ef4444",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
          }}
        >
          {error ? `Error: ${error}` : "No data — place data.json in /public"}
        </div>
      </div>
    );

  /* ── main layout ── */
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:#0f172a; font-family:'Space Grotesk',system-ui,sans-serif; }
        *, *::before, *::after { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; background:#0f172a; }
        ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }
        .brand-btn { font-family:'Space Grotesk',system-ui,sans-serif; font-size:13px; font-weight:700;
          cursor:pointer; border-radius:8px; padding:10px 20px; white-space:nowrap;
          transition:transform .12s ease, box-shadow .12s ease; }
        .brand-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .tab-btn { background:none; font-family:'JetBrains Mono',monospace; font-size:11px;
          letter-spacing:0.15em; text-transform:uppercase; padding:14px 22px;
          cursor:pointer; transition:color .15s; border:none; }
        .tab-btn:hover { color:#94a3b8 !important; }
        .trow { cursor:pointer; transition:background .1s; }
        .trow:hover td { background:#1e3a5f !important; }
        @keyframes fin { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fin { animation:fin .22s ease both; }
        .heatcell { transition: transform .1s; }
        .heatcell:hover { transform: scale(1.15); z-index:2; }
      `}</style>

      {/* ══════════════════ HEADER ══════════════════ */}
      <div
        style={{
          background: "#0c1425",
          borderBottom: "2px solid #1e293b",
          padding: "16px 32px",
          flexShrink: 0,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#3b82f6",
                boxShadow: "0 0 14px #3b82f6",
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.22em",
                color: "#475569",
                textTransform: "uppercase",
              }}
            >
              Validators | be in the know
            </span>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "#334155",
            }}
          >
            {rows.length.toLocaleString()} creatives · {brands.length} brands ·{" "}
            {fmt(marketTotals.totalSpend)} total market
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "#475569",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Select Brand
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {brands.map((b) => {
              const active = b.name === brandName;
              return (
                <button
                  key={b.name}
                  type="button"
                  className="brand-btn"
                  onClick={() => handleBrandClick(b.name)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? b.color : "#475569",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {b.name}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      opacity: 0.6,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 400,
                    }}
                  >
                    {b.creatives.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ TAB BAR ══ */}
      <div
        style={{
          background: "#0c1425",
          borderBottom: "1px solid #1e293b",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex" }}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className="tab-btn"
              onClick={() => setTab(t)}
              style={{
                color: tab === t ? "#60a5fa" : "#475569",
                borderBottom:
                  tab === t ? "2px solid #3b82f6" : "2px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {brand && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: "#475569",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Select Brand
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {brands.map((b) => {
                const active = b.name === brandName;
                return (
                  <button
                    key={b.name}
                    type="button"
                    className="brand-btn"
                    onClick={() => handleBrandClick(b.name)}
                    style={{
                      background: active ? b.color : "#1e293b",
                      color: active ? "#ffffff" : "#94a3b8",
                      border: active
                        ? `2px solid ${b.color}`
                        : "2px solid #334155",
                      boxShadow: active ? `0 0 20px ${b.color}66` : "none",
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
          </div>
        )}
      </div>

      {/* ══════════════════ SUB-TAB BAR (deep-dive only) ══════════════════ */}
      {mode === "deepdive" && (
        <div
          style={{
            background: "#0c1425",
            borderBottom: "1px solid #1e293b",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* KPI Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
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
                  value={fmt(brand.avgSpend)}
                  color="#f59e0b"
                />
                <KpiCard
                  label="CEPs Active"
                  value={`${brand.activeCeps} / 11`}
                  color="#10b981"
                />
                <KpiCard
                  label="Market Rank"
                  value={`#${[...brands].sort((a, b) => b.totalSpend - a.totalSpend).findIndex((b) => b.name === brand.name) + 1}`}
                  color="#8b5cf6"
                  sub={`of ${brands.length} brands`}
                />
                <KpiCard
                  label="Market Share"
                  value={`${pct(brand.totalSpend, marketTotals.totalSpend)}%`}
                  color="#ec4899"
                  sub={fmt(marketTotals.totalSpend) + " total"}
                />
              </div>

              {/* Brand-level: Features + Objectives/Valence */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: brand.color,
                }}
              >
                <Card>
                  <SectionLabel>
                    Creative Feature Usage — {brand.name}
                  </SectionLabel>
                  {brand.features.map((f: any) => (
                    <FBar key={f.name} {...f} />
                  ))}
                </Card>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <Card>
                    <SectionLabel>Objective Split</SectionLabel>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {Object.entries(
                        brand.objectives as Record<string, number>,
                      )
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
                                fontFamily: "'JetBrains Mono', monospace",
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
                      {Object.entries(brand.valences as Record<string, number>)
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
                                fontFamily: "'JetBrains Mono', monospace",
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
                    <SectionLabel>Brand Image (Imago)</SectionLabel>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Object.entries(brand.imago as Record<string, number>)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v], i) => {
                          const total = (brand.creatives as any[]).length;
                          const p = pct(v, total);
                          const colors = [
                            "#3b82f6",
                            "#f59e0b",
                            "#10b981",
                            "#ef4444",
                            "#8b5cf6",
                            "#06b6d4",
                            "#f97316",
                            "#ec4899",
                          ];
                          const c = colors[i % colors.length];
                          return (
                            <div
                              key={k}
                              style={{
                                flex: "1 1 80px",
                                background: "#0f172a",
                                borderRadius: 8,
                                padding: "10px 14px",
                                border: `1px solid ${c}33`,
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  width: `${p}%`,
                                  height: 3,
                                  background: c,
                                  borderRadius: "0 2px 0 0",
                                }}
                              />
                              <div
                                style={{
                                  fontSize: 20,
                                  fontWeight: 900,
                                  color: c,
                                }}
                              >
                                {p}%
                              </div>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#64748b",
                                  fontFamily: "'JetBrains Mono', monospace",
                                  marginTop: 2,
                                }}
                              >
                                {k}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                </div>
              </div>

              {/* ═══ CROSS-BRAND SECTION ═══ */}
              <div style={{ marginTop: 8, marginBottom: 4 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    color: "#3b82f6",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 1,
                      background:
                        "linear-gradient(90deg, transparent, #3b82f6)",
                    }}
                  />
                  Cross-Brand Analysis
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background:
                        "linear-gradient(90deg, #3b82f6, transparent)",
                    }}
                  />
                </div>
              </div>

              {/* Total Spend Bar Chart */}
              <Card>
                <SectionLabel>
                  All Brands — Total Spend (click to switch)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
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
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={<Tip />} />
                    <Bar
                      dataKey="v"
                      radius={[4, 4, 0, 0]}
                      onClick={(d) => {
                        if (d?.name) handleBrandClick(d.name);
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

              {/* Media Mix Comparison */}
              <Card>
                <SectionLabel>
                  Media Mix by Brand (spend distribution)
                </SectionLabel>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(240, mediumData.length * 32 + 60)}
                >
                  <BarChart
                    data={mediumData}
                    layout="vertical"
                    margin={{ left: 110, right: 20, top: 10, bottom: 10 }}
                    stackOffset="expand"
                    barSize={20}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${Math.round(v * 100)}%`}
                      tick={{
                        fontSize: 10,
                        fill: "#475569",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={105}
                      tick={({ x, y, payload }) => {
                        const b = brands.find(
                          (br) => br.name === payload.value,
                        );
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            style={{
                              fontSize: 10,
                              fill: b?.color || "#94a3b8",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight:
                                payload.value === brandName ? 800 : 400,
                              cursor: "pointer",
                            }}
                            onClick={() => handleBrandClick(payload.value)}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div
                            style={{
                              background: "#1e293b",
                              border: "1px solid #475569",
                              borderRadius: 6,
                              padding: "10px 14px",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: "#e2e8f0",
                              boxShadow: "0 8px 24px rgba(0,0,0,.6)",
                            }}
                          >
                            <div
                              style={{
                                color: "#64748b",
                                marginBottom: 6,
                                fontSize: 10,
                              }}
                            >
                              {label}
                            </div>
                            {payload
                              .filter((p) => p.value > 0)
                              .map((p, i) => (
                                <div
                                  key={i}
                                  style={{
                                    color: p.fill,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 16,
                                  }}
                                >
                                  <span>{p.name}</span>
                                  <span style={{ fontWeight: 700 }}>
                                    {fmt(p.value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        );
                      }}
                    />
                    {Object.entries(MEDIUM_COLORS).map(([m, c]) => (
                      <Bar key={m} dataKey={m} stackId="a" fill={c} />
                    ))}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: "#64748b",
                        paddingTop: 8,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* CEP Spend Heatmap */}
              <Card>
                <SectionLabel>
                  CEP × Brand Spend Heatmap (€ allocated to creatives per CEP)
                </SectionLabel>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: 3,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "6px 10px",
                            color: "#334155",
                            fontWeight: 600,
                          }}
                        >
                          Brand
                        </th>
                        {CEP_LABELS.map((l, i) => (
                          <th
                            key={i}
                            title={l}
                            style={{
                              padding: "6px 4px",
                              color: CEP_COLORS[i],
                              fontWeight: 600,
                              fontSize: 8,
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {l.length > 8 ? l.substring(0, 8) + "…" : l}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "6px 10px",
                            color: "#f59e0b",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...brands]
                        .filter((b) => b.totalSpend > 100000)
                        .sort((a, b) => b.totalSpend - a.totalSpend)
                        .map((b) => {
                          const isActive = b.name === brandName;
                          const maxCepSpend = Math.max(
                            ...brands.flatMap((br) =>
                              br.ceps.map((c: any) => c.spend),
                            ),
                            1,
                          );
                          return (
                            <tr
                              key={b.name}
                              className="trow"
                              onClick={() => handleBrandClick(b.name)}
                            >
                              <td
                                style={{
                                  padding: "6px 10px",
                                  fontWeight: 700,
                                  color: b.color,
                                  background: isActive
                                    ? "#162032"
                                    : "transparent",
                                  borderRadius: "4px 0 0 4px",
                                }}
                              >
                                {b.name}
                              </td>
                              {b.ceps.map((c: any, ci: number) => {
                                const intensity = c.spend / maxCepSpend;
                                const alpha = Math.max(
                                  0.05,
                                  Math.min(0.9, intensity),
                                );
                                return (
                                  <td
                                    key={ci}
                                    className="heatcell"
                                    title={`${b.name} · ${c.label}: ${fmt(c.spend)}`}
                                    style={{
                                      padding: "6px 4px",
                                      textAlign: "center",
                                      background:
                                        c.spend > 0
                                          ? `${CEP_COLORS[ci]}${Math.round(
                                              alpha * 255,
                                            )
                                              .toString(16)
                                              .padStart(2, "0")}`
                                          : "#0d1117",
                                      borderRadius: 3,
                                      color:
                                        c.spend > 0 ? "#e2e8f0" : "#1e293b",
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {c.spend >= 1e6
                                      ? `${(c.spend / 1e6).toFixed(1)}M`
                                      : c.spend >= 1e3
                                        ? `${(c.spend / 1e3).toFixed(0)}K`
                                        : c.spend > 0
                                          ? "•"
                                          : ""}
                                  </td>
                                );
                              })}
                              <td
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: "#f59e0b",
                                  background: isActive
                                    ? "#162032"
                                    : "transparent",
                                  borderRadius: "0 4px 4px 0",
                                }}
                              >
                                {fmt(b.totalSpend)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Cross-brand Feature Comparison */}
              <Card>
                <SectionLabel>
                  Creative Features — All Brands (% of creatives)
                </SectionLabel>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: 3,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "6px 10px",
                            color: "#334155",
                            fontWeight: 600,
                          }}
                        >
                          Brand
                        </th>
                        {[
                          "Humor",
                          "Bekende Persoon",
                          "Voice-over",
                          "Soundlogo",
                          "Muziek",
                          "DBA Slogan",
                          "Karakter",
                          "Mystery Ad",
                        ].map((f, i) => {
                          const colors = [
                            "#f59e0b",
                            "#ef4444",
                            "#8b5cf6",
                            "#06b6d4",
                            "#10b981",
                            "#f97316",
                            "#ec4899",
                            "#14b8a6",
                          ];
                          return (
                            <th
                              key={f}
                              style={{
                                padding: "6px 4px",
                                color: colors[i],
                                fontWeight: 600,
                                fontSize: 8,
                                textAlign: "center",
                              }}
                            >
                              {f}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[...brands]
                        .filter((b) => b.totalSpend > 100000)
                        .sort((a, b) => b.totalSpend - a.totalSpend)
                        .map((b) => {
                          const isActive = b.name === brandName;
                          const featureColors = [
                            "#f59e0b",
                            "#ef4444",
                            "#8b5cf6",
                            "#06b6d4",
                            "#10b981",
                            "#f97316",
                            "#ec4899",
                            "#14b8a6",
                          ];
                          return (
                            <tr
                              key={b.name}
                              className="trow"
                              onClick={() => handleBrandClick(b.name)}
                            >
                              <td
                                style={{
                                  padding: "6px 10px",
                                  fontWeight: 700,
                                  color: b.color,
                                  background: isActive
                                    ? "#162032"
                                    : "transparent",
                                  borderRadius: "4px 0 0 4px",
                                }}
                              >
                                {b.name}
                              </td>
                              {b.features.map((f: any, fi: number) => {
                                const alpha = Math.max(
                                  0.05,
                                  (f.val / 100) * 0.85,
                                );
                                return (
                                  <td
                                    key={fi}
                                    className="heatcell"
                                    style={{
                                      padding: "6px 4px",
                                      textAlign: "center",
                                      background:
                                        f.val > 0
                                          ? `${featureColors[fi]}${Math.round(
                                              alpha * 255,
                                            )
                                              .toString(16)
                                              .padStart(2, "0")}`
                                          : "#0d1117",
                                      borderRadius: 3,
                                      color: f.val > 0 ? "#e2e8f0" : "#1e293b",
                                      fontSize: 10,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {f.val > 0 ? `${f.val}%` : ""}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Spend vs CEP Breadth + Avg Spend */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Card>
                  <SectionLabel>Spend vs CEP Breadth</SectionLabel>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[...spendVsCepData].sort(
                        (a, b) => b.spend - a.spend,
                      )}
                      margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        yAxisId="spend"
                        orientation="left"
                        tick={{ fontSize: 9, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => fmt(v)}
                      />
                      <YAxis
                        yAxisId="ceps"
                        orientation="right"
                        domain={[0, 11]}
                        tick={{ fontSize: 9, fill: "#10b981" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div
                              style={{
                                background: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: 6,
                                padding: "10px 14px",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: "#e2e8f0",
                              }}
                            >
                              <div
                                style={{ color: "#64748b", marginBottom: 4 }}
                              >
                                {label}
                              </div>
                              {payload.map((p, i) => (
                                <div
                                  key={i}
                                  style={{ color: p.fill || p.color }}
                                >
                                  {p.name === "v"
                                    ? `Spend: ${fmt(p.value)}`
                                    : `CEPs: ${p.value}/11`}
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Bar
                        yAxisId="spend"
                        dataKey="spend"
                        name="v"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                      >
                        {[...spendVsCepData]
                          .sort((a, b) => b.spend - a.spend)
                          .map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.name === brandName ? d.color : `${d.color}44`
                              }
                            />
                          ))}
                      </Bar>
                      <Bar
                        yAxisId="ceps"
                        dataKey="ceps"
                        fill="#10b98144"
                        radius={[4, 4, 0, 0]}
                        barSize={10}
                      >
                        {[...spendVsCepData]
                          .sort((a, b) => b.spend - a.spend)
                          .map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.name === brandName ? "#10b981" : "#10b98144"
                              }
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      justifyContent: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "#475569",
                      marginTop: 4,
                    }}
                  >
                    <span>■ Bars = Spend</span>
                    <span style={{ color: "#10b981" }}>
                      ■ Narrow bars = Active CEPs
                    </span>
                  </div>
                </Card>

                <Card>
                  <SectionLabel>Average Spend per Creative</SectionLabel>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[...spendVsCepData].sort(
                        (a, b) => b.avgSpend - a.avgSpend,
                      )}
                      margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => fmt(v)}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div
                              style={{
                                background: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: 6,
                                padding: "10px 14px",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: "#e2e8f0",
                              }}
                            >
                              <div
                                style={{ color: "#64748b", marginBottom: 4 }}
                              >
                                {label}
                              </div>
                              <div style={{ color: "#f59e0b" }}>
                                Avg: {fmt(payload[0].value)}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="avgSpend"
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      >
                        {[...spendVsCepData]
                          .sort((a, b) => b.avgSpend - a.avgSpend)
                          .map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.name === brandName ? "#f59e0b" : "#f59e0b33"
                              }
                              stroke={
                                d.name === brandName ? "#f59e0b" : "#f59e0b44"
                              }
                              strokeWidth={1}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* CEP Matrix (dot-style from original CEP tab) */}
              <Card>
                <SectionLabel>
                  Cross-Brand CEP Presence Matrix (click row to switch)
                </SectionLabel>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontFamily: "'JetBrains Mono', monospace",
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
                        <th
                          style={{
                            padding: "8px 12px",
                            color: "#334155",
                            fontWeight: 600,
                            borderBottom: "1px solid #1e293b",
                            textAlign: "right",
                          }}
                        >
                          Spend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...brands]
                        .sort((a, b) => b.totalSpend - a.totalSpend)
                        .map((b, ri) => {
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
                              {b.ceps.map((c: any, ci: number) => (
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
                                        c.count > 0
                                          ? CEP_COLORS[ci]
                                          : "#1e293b",
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
                                  color: "#10b981",
                                  background: bg,
                                }}
                              >
                                {b.activeCeps}/11
                              </td>
                              <td
                                style={{
                                  padding: "9px 12px",
                                  borderBottom: "1px solid #0f172a",
                                  fontWeight: 700,
                                  color: "#f59e0b",
                                  background: bg,
                                  textAlign: "right",
                                }}
                              >
                                {fmt(b.totalSpend)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {CEP_LABELS.map((l, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 9,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: CEP_COLORS[i],
                        opacity: 0.7,
                      }}
                    >
                      C{i + 1}={l}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── CEP ── */}
          {tab === "cep" && (
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
                      data={brand.ceps.map((c: any) => ({
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
                          fontFamily: "'JetBrains Mono', monospace",
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
                      <Tooltip content={<Tip />} />
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
                          fontFamily: "'JetBrains Mono', monospace",
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
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {brand.ceps.map((_: any, i: number) => (
                          <Cell key={i} fill={CEP_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Multi-brand radar overlay */}
              <Card>
                <SectionLabel>
                  CEP Radar — Multi-Brand Overlay (top 5 by spend)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={380}>
                  <RadarChart
                    data={CEP_LABELS.map((label, i) => {
                      const entry: Record<string, any> = {
                        subject:
                          label.length > 10
                            ? label.substring(0, 10) + "…"
                            : label,
                      };
                      [...brands]
                        .sort((a, b) => b.totalSpend - a.totalSpend)
                        .slice(0, 5)
                        .forEach((b) => {
                          entry[b.name] = b.ceps[i].pct;
                        });
                      return entry;
                    })}
                  >
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 9,
                        fill: "#64748b",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 8, fill: "#334155" }}
                      axisLine={false}
                    />
                    {[...brands]
                      .sort((a, b) => b.totalSpend - a.totalSpend)
                      .slice(0, 5)
                      .map((b) => (
                        <Radar
                          key={b.name}
                          name={b.name}
                          dataKey={b.name}
                          stroke={b.color}
                          fill={b.color}
                          fillOpacity={b.name === brandName ? 0.15 : 0.03}
                          strokeWidth={b.name === brandName ? 2.5 : 1}
                          dot={
                            b.name === brandName
                              ? { fill: b.color, r: 3 }
                              : false
                          }
                        />
                      ))}
                    <Tooltip content={<Tip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: "#64748b",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SectionLabel>CEP Presence — {brand.name}</SectionLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 10,
                  }}
                >
                  {brand.ceps.map((c: any, i: number) => (
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

              {/* CEP Spend per Brand - Stacked */}
              <Card>
                <SectionLabel>CEP Spend Allocation by Brand (€)</SectionLabel>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={crossBrandCepSpend}
                    margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 8,
                        fill: "#64748b",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                      angle={-40}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const items = payload
                          .filter((p) => p.value > 0)
                          .sort((a, b) => b.value - a.value);
                        return (
                          <div
                            style={{
                              background: "#1e293b",
                              border: "1px solid #475569",
                              borderRadius: 6,
                              padding: "10px 14px",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: "#e2e8f0",
                              maxHeight: 300,
                              overflowY: "auto",
                            }}
                          >
                            <div
                              style={{
                                color: "#64748b",
                                marginBottom: 6,
                                fontSize: 10,
                              }}
                            >
                              {payload[0]?.payload?.fullName || label}
                            </div>
                            {items.map((p, i) => (
                              <div
                                key={i}
                                style={{
                                  color: p.fill,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 16,
                                }}
                              >
                                <span>{p.name}</span>
                                <span style={{ fontWeight: 700 }}>
                                  {fmt(p.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {[...brands]
                      .sort((a, b) => b.totalSpend - a.totalSpend)
                      .slice(0, 8)
                      .map((b) => (
                        <Bar
                          key={b.name}
                          dataKey={b.name}
                          stackId="a"
                          fill={b.color}
                          fillOpacity={b.name === brandName ? 1 : 0.4}
                        />
                      ))}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        color: "#64748b",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
