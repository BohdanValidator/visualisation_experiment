import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const CEP_LABELS = [
  "Prijs","Aanbieding","Snelheid (5G)","Dekking","Combi-voordeel",
  "Unlimited","Bundelflex","Netwerkkwaliteit","TV-aanbod","Klantenservice","Duurzaamheid",
];

const PALETTE = [
  "#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6",
  "#a855f7","#0ea5e9","#facc15","#f43f5e",
];

const CEP_COLORS = [
  "#60a5fa","#fbbf24","#34d399","#f87171","#a78bfa",
  "#22d3ee","#fb923c","#a3e635","#f472b6","#2dd4bf","#c084fc",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Excel exports Python booleans as "True"/"False"
const BOOL = (v) => v === "True" || v === "TRUE" || v === true;
const NUM  = (v) => parseFloat(String(v || "0").replace(/[^\d.]/g, "")) || 0;
const fmt  = (n) =>
  n >= 1e6 ? `\u20AC${(n / 1e6).toFixed(1)}M`
  : n >= 1e3 ? `\u20AC${(n / 1e3).toFixed(0)}K`
  : `\u20AC${Math.round(n)}`;
const pct  = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const buildBrands = (rows) => {
  const map = {};
  rows.forEach((r) => {
    const m = r["Merk"] || "Unknown";
    if (!map[m]) map[m] = [];
    map[m].push(r);
  });

  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, creatives], idx) => {
      const totalSpend = creatives.reduce((s, r) => s + NUM(r["Spend"]), 0);
      const ceps = CEP_LABELS.map((label, i) => {
        const count = creatives.filter((r) =>
          BOOL(r[`CEP_${String(i + 1).padStart(2, "0")}`])
        ).length;
        return { label, count, pct: pct(count, creatives.length) };
      });
      const objectives = {};
      creatives.forEach((r) => {
        const o = r["Objective"] || "?";
        objectives[o] = (objectives[o] || 0) + 1;
      });
      const valences = {};
      creatives.forEach((r) => {
        const v = r["Valence"] || "?";
        valences[v] = (valences[v] || 0) + 1;
      });
      const fl = (key) =>
        pct(creatives.filter((r) => BOOL(r[key])).length, creatives.length);
      const fv = (key) =>
        pct(
          creatives.filter((r) => r[key] && r[key] !== "Afwezig").length,
          creatives.length
        );
      const features = [
        { name: "Humor",          val: fl("Humor"),           color: "#f59e0b" },
        { name: "Bekende Persoon",val: fl("Bekende Personen"),color: "#ef4444" },
        { name: "Voice-over",     val: fv("Voice-over"),      color: "#8b5cf6" },
        { name: "Soundlogo",      val: fl("DBA - Soundlogo"), color: "#06b6d4" },
        { name: "Muziek",         val: fv("Music Type"),      color: "#10b981" },
        { name: "DBA Slogan",     val: fl("DBA - Slogan"),    color: "#f97316" },
      ];
      return {
        name, creatives, totalSpend, ceps, objectives, valences, features,
        activeCeps: ceps.filter((c) => c.count > 0).length,
        color: PALETTE[idx % PALETTE.length],
      };
    });
};

// ─── Micro UI ─────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1e293b", border:"1px solid #475569", borderRadius:6,
      padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:"#e2e8f0",
      boxShadow:"0 8px 24px rgba(0,0,0,.6)" }}>
      <div style={{ color:"#64748b", marginBottom:4, fontSize:11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color || "#fff" }}>
          {typeof p.value === "number" && p.value > 10000 ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background:"#1e293b", border:"1px solid #334155",
    borderRadius:10, padding:20, ...style }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily:"monospace", fontSize:10, letterSpacing:"0.2em",
    color:"#475569", textTransform:"uppercase", marginBottom:14,
    display:"flex", alignItems:"center", gap:8 }}>
    <span style={{ display:"inline-block", width:20, height:2,
      background:"#334155", borderRadius:1, flexShrink:0 }} />
    {children}
  </div>
);

const KpiCard = ({ label, value, color, sub }) => (
  <div style={{ background:"#0f172a", borderRadius:8, padding:"18px 22px",
    borderTop:`3px solid ${color}`, border:`1px solid #1e293b` }}>
    <div style={{ fontFamily:"monospace", fontSize:9, color:"#475569",
      letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:900, color, lineHeight:1,
      letterSpacing:"-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:"#475569", marginTop:6, fontFamily:"monospace" }}>{sub}</div>}
  </div>
);

const FBar = ({ name, val, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
    <div style={{ width:115, fontSize:11, color:"#94a3b8", textAlign:"right",
      flexShrink:0, fontFamily:"monospace" }}>{name}</div>
    <div style={{ flex:1, height:8, background:"#0f172a", borderRadius:4, overflow:"hidden" }}>
      <div style={{ width:`${val}%`, height:"100%", background:color, borderRadius:4,
        transition:"width .7s ease" }} />
    </div>
    <div style={{ width:38, fontSize:11, fontFamily:"monospace",
      fontWeight:700, color:"#e2e8f0" }}>{val}%</div>
  </div>
);

const CepTag = ({ label, active, color, idx }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
    borderRadius:6, fontSize:11, fontFamily:"monospace",
    background: active ? `${color}18` : "#0f172a",
    border:`1px solid ${active ? color + "55" : "#1e293b"}`,
    color: active ? "#e2e8f0" : "#334155" }}>
    <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
      background: active ? color : "#1e293b",
      boxShadow: active ? `0 0 8px ${color}` : "none" }} />
    <span style={{ fontSize:9, fontWeight:700, color: active ? color : "#334155",
      marginRight:2 }}>C{idx + 1}</span>
    {label}
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [brandName,  setBrandName]  = useState(null);
  const [tab,        setTab]        = useState("overview");
  const [selCreative,setSelCreative]= useState(0);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setRows(data); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  const brands = useMemo(() => (rows.length ? buildBrands(rows) : []), [rows]);

  // Auto-select first brand once loaded
  useEffect(() => {
    if (brands.length > 0 && brandName === null) {
      setBrandName(brands[0].name);
    }
  }, [brands]);

  const handleBrandClick = (name) => {
    setBrandName(name);
    setSelCreative(0);
    setTab("overview");
  };

  const brand = useMemo(
    () => brands.find((b) => b.name === brandName) ?? brands[0] ?? null,
    [brands, brandName]
  );

  const TABS = ["overview", "cep", "creatives", "detail"];

  // ── Loading / error screens ──
  if (loading) return (
    <div style={{ width:"100vw", minHeight:"100vh", background:"#0f172a",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#475569", fontFamily:"monospace", fontSize:13,
        letterSpacing:"0.3em" }}>LOADING DATA…</div>
    </div>
  );

  if (error || !rows.length) return (
    <div style={{ width:"100vw", minHeight:"100vh", background:"#0f172a",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:12 }}>
      <div style={{ color:"#ef4444", fontFamily:"monospace", fontSize:14 }}>
        {error ? `Error: ${error}` : "No data loaded"}
      </div>
      <div style={{ color:"#475569", fontSize:12 }}>
        Place data.json in /public and restart dev server
      </div>
    </div>
  );

  // ── Main render ──
  return (
    <div style={{ width:"100%", minHeight:"100vh", background:"#0f172a",
      color:"#e2e8f0", display:"flex", flexDirection:"column" }}>
      <style>{`
        html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:#0f172a; }
        *, *::before, *::after { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; background:#0f172a; }
        ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }
        .brand-btn { font-family:system-ui,sans-serif; font-size:13px; font-weight:700;
          cursor:pointer; border-radius:8px; padding:10px 20px; white-space:nowrap;
          transition:transform .12s ease, box-shadow .12s ease; }
        .brand-btn:hover { transform:translateY(-1px); }
        .tab-btn { background:none; font-family:monospace; font-size:11px;
          letter-spacing:0.15em; text-transform:uppercase; padding:14px 22px;
          cursor:pointer; transition:color .15s; border:none; }
        .tab-btn:hover { color:#94a3b8 !important; }
        .c-card { border-radius:10px; padding:18px; cursor:pointer;
          transition:background .12s, border-color .12s, box-shadow .12s; }
        .c-card:hover { filter:brightness(1.08); }
        .trow { cursor:pointer; }
        .trow:hover td { background:#1e3a5f !important; }
        @keyframes fin { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fin { animation:fin .22s ease both; }
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{ background:"#0c1425", borderBottom:"2px solid #1e293b",
        padding:"16px 32px", flexShrink:0 }}>
        {/* Top row */}
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:"#3b82f6",
              boxShadow:"0 0 14px #3b82f6" }} />
            <span style={{ fontFamily:"monospace", fontSize:12, letterSpacing:"0.22em",
              color:"#475569", textTransform:"uppercase" }}>
              Validators Analytics
            </span>
          </div>
          <span style={{ fontFamily:"monospace", fontSize:10, color:"#334155" }}>
            {rows.length.toLocaleString()} creatives · {brands.length} brands
          </span>
        </div>

        {/* Brand selector */}
        <div style={{ marginBottom:4 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, color:"#475569",
            letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:10 }}>
            Select Brand
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {brands.map((b) => {
              const active = b.name === brandName;
              return (
                <button
                  key={b.name}
                  type="button"
                  className="brand-btn"
                  onClick={() => handleBrandClick(b.name)}
                  style={{
                    background:   active ? b.color : "#1e293b",
                    color:        active ? "#ffffff" : "#94a3b8",
                    border:       active ? `2px solid ${b.color}` : "2px solid #334155",
                    boxShadow:    active ? `0 0 20px ${b.color}66` : "none",
                    transform:    active ? "translateY(-2px)" : "none",
                  }}
                >
                  {b.name}
                  <span style={{ marginLeft:6, fontSize:10, opacity:.6,
                    fontFamily:"monospace", fontWeight:400 }}>
                    {b.creatives.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ TAB BAR ══ */}
      <div style={{ background:"#0c1425", borderBottom:"1px solid #1e293b",
        padding:"0 32px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex" }}>
          {TABS.map((t) => (
            <button key={t} type="button" className="tab-btn"
              onClick={() => setTab(t)}
              style={{
                color:        tab === t ? "#60a5fa" : "#475569",
                borderBottom: tab === t ? "2px solid #3b82f6" : "2px solid transparent",
              }}>
              {t}
            </button>
          ))}
        </div>
        {brand && (
          <div style={{ fontFamily:"monospace", fontSize:11, color:"#475569",
            display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:brand.color }} />
            <span style={{ color:brand.color, fontWeight:700 }}>{brand.name}</span>
            <span>·</span>
            <span>{brand.creatives.length} creatives</span>
            <span>·</span>
            <span style={{ color:"#f59e0b" }}>{fmt(brand.totalSpend)}</span>
          </div>
        )}
      </div>

      {/* ══ CONTENT ══ */}
      {brand && (
        <div style={{ flex:1, padding:"24px 32px", overflowY:"auto" }}
          className="fin" key={brandName + tab}>
          {/* key forces re-animation on brand/tab change */}

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* KPIs */}
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                <KpiCard label="Total Spend"
                  value={fmt(brand.totalSpend)}
                  color={brand.color}
                  sub={`${brand.creatives.length} creatives`} />
                <KpiCard label="Avg Spend per Creative"
                  value={fmt(brand.totalSpend / brand.creatives.length)}
                  color="#f59e0b" />
                <KpiCard label="CEPs Active"
                  value={`${brand.activeCeps} / 11`}
                  color="#10b981" />
                <KpiCard label="Market Rank (spend)"
                  value={`#${[...brands].sort((a,b)=>b.totalSpend-a.totalSpend).findIndex(b=>b.name===brand.name)+1}`}
                  color="#8b5cf6"
                  sub={`of ${brands.length} brands`} />
              </div>

              {/* Feature usage + splits */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Card>
                  <SectionLabel>Creative Feature Usage</SectionLabel>
                  {brand.features.map((f) => <FBar key={f.name} {...f} />)}
                </Card>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <Card>
                    <SectionLabel>Objective Split</SectionLabel>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {Object.entries(brand.objectives)
                        .sort((a,b)=>b[1]-a[1])
                        .map(([k, v], i) => (
                          <div key={k} style={{ flex:"1 1 100px", background:"#0f172a",
                            borderRadius:8, padding:"14px 16px",
                            border:`1px solid ${PALETTE[i]}44`,
                            borderTop:`3px solid ${PALETTE[i]}` }}>
                            <div style={{ fontSize:26, fontWeight:900, color:PALETTE[i] }}>{v}</div>
                            <div style={{ fontSize:10, color:"#64748b", fontFamily:"monospace",
                              marginTop:3 }}>{k}</div>
                          </div>
                        ))}
                    </div>
                  </Card>
                  <Card>
                    <SectionLabel>Valence Split</SectionLabel>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {Object.entries(brand.valences)
                        .sort((a,b)=>b[1]-a[1])
                        .map(([k, v], i) => (
                          <div key={k} style={{ flex:"1 1 100px", background:"#0f172a",
                            borderRadius:8, padding:"14px 16px",
                            border:`1px solid ${CEP_COLORS[i+2]}44`,
                            borderTop:`3px solid ${CEP_COLORS[i+2]}` }}>
                            <div style={{ fontSize:26, fontWeight:900, color:CEP_COLORS[i+2] }}>{v}</div>
                            <div style={{ fontSize:10, color:"#64748b", fontFamily:"monospace",
                              marginTop:3 }}>{k}</div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Brand comparison bar */}
              <Card>
                <SectionLabel>All Brands — Total Spend (click to switch)</SectionLabel>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={[...brands]
                      .sort((a,b)=>b.totalSpend-a.totalSpend)
                      .map((b) => ({ name:b.name, v:b.totalSpend, color:b.color }))}
                    margin={{ top:4, right:8, left:8, bottom:4 }}>
                    <XAxis dataKey="name"
                      tick={{ fontSize:10, fill:"#64748b", fontFamily:"monospace" }}
                      axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="v" radius={[4,4,0,0]}
                      onClick={(d) => handleBrandClick(d.name)}
                      style={{ cursor:"pointer" }}>
                      {[...brands]
                        .sort((a,b)=>b.totalSpend-a.totalSpend)
                        .map((b, i) => (
                          <Cell key={i}
                            fill={b.name === brandName ? b.color : "#1e293b"}
                            stroke={b.color} strokeWidth={1} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── CEP ── */}
          {tab === "cep" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Card>
                  <SectionLabel>CEP Radar — {brand.name}</SectionLabel>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart
                      data={brand.ceps.map((c) => ({
                        subject: c.label.length > 10 ? c.label.substring(0,10)+"…" : c.label,
                        pct: c.pct,
                      }))}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject"
                        tick={{ fontSize:9, fill:"#64748b", fontFamily:"monospace" }} />
                      <PolarRadiusAxis angle={90} domain={[0,100]}
                        tick={{ fontSize:8, fill:"#334155" }} axisLine={false} />
                      <Radar dataKey="pct" stroke={brand.color} fill={brand.color}
                        fillOpacity={0.2} dot={{ fill:brand.color, r:4 }} />
                      <Tooltip content={<Tip />} formatter={(v) => `${v}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SectionLabel>CEP Frequency (# of creatives)</SectionLabel>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={brand.ceps} layout="vertical"
                      margin={{ left:100, right:20 }}>
                      <XAxis type="number" domain={[0, brand.creatives.length]}
                        tick={{ fontSize:10, fill:"#475569", fontFamily:"monospace" }}
                        axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" width={95}
                        tick={{ fontSize:9, fill:"#94a3b8", fontFamily:"monospace" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="count" radius={[0,4,4,0]}>
                        {brand.ceps.map((_, i) => (
                          <Cell key={i} fill={CEP_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* CEP grid */}
              <Card>
                <SectionLabel>CEP Presence — {brand.name}</SectionLabel>
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                  {brand.ceps.map((c, i) => (
                    <CepTag key={i} label={c.label} active={c.count > 0}
                      color={CEP_COLORS[i]} idx={i} />
                  ))}
                </div>
              </Card>

              {/* Cross-brand matrix */}
              <Card>
                <SectionLabel>Cross-Brand CEP Matrix (click row to switch)</SectionLabel>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                    fontFamily:"monospace", fontSize:11 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign:"left", padding:"8px 12px",
                          color:"#334155", fontWeight:600,
                          borderBottom:"1px solid #1e293b" }}>Brand</th>
                        {CEP_LABELS.map((l, i) => (
                          <th key={i} title={l}
                            style={{ padding:"8px 6px", color:CEP_COLORS[i],
                              fontWeight:600, borderBottom:"1px solid #1e293b",
                              fontSize:9, textAlign:"center" }}>C{i+1}</th>
                        ))}
                        <th style={{ padding:"8px 12px", color:"#334155",
                          fontWeight:600, borderBottom:"1px solid #1e293b" }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((b, ri) => {
                        const isActive = b.name === brandName;
                        return (
                          <tr key={ri} className="trow"
                            onClick={() => handleBrandClick(b.name)}>
                            <td style={{ padding:"9px 12px",
                              borderBottom:"1px solid #0f172a",
                              fontWeight:700, color:b.color,
                              background:isActive?"#162032":"transparent" }}>
                              {b.name}
                            </td>
                            {b.ceps.map((c, ci) => (
                              <td key={ci} style={{ padding:"9px 6px",
                                textAlign:"center",
                                borderBottom:"1px solid #0f172a",
                                background:isActive?"#162032":"transparent" }}>
                                <div style={{ width:10, height:10, borderRadius:"50%",
                                  margin:"0 auto",
                                  background:c.count>0?CEP_COLORS[ci]:"#1e293b",
                                  boxShadow:c.count>0?`0 0 5px ${CEP_COLORS[ci]}`:"none" }} />
                              </td>
                            ))}
                            <td style={{ padding:"9px 12px",
                              borderBottom:"1px solid #0f172a",
                              fontWeight:700, color:"#f59e0b",
                              background:isActive?"#162032":"transparent" }}>
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
          )}

          {/* ── CREATIVES ── */}
          {tab === "creatives" && (
            <div>
              <div style={{ fontFamily:"monospace", fontSize:10, color:"#475569",
                marginBottom:16, letterSpacing:"0.1em" }}>
                {brand.creatives.length} creatives for {brand.name} — click to view detail
              </div>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                {brand.creatives.map((r, i) => {
                  const spend = NUM(r["Spend"]);
                  const cepCount = CEP_LABELS.filter((_, ci) =>
                    BOOL(r[`CEP_${String(ci+1).padStart(2,"0")}`])
                  ).length;
                  const isActive = selCreative === i;
                  return (
                    <div key={i} className="c-card"
                      onClick={() => { setSelCreative(i); setTab("detail"); }}
                      style={{ background:isActive?"#1e3a5f":"#1e293b",
                        border:`1px solid ${isActive?brand.color:"#334155"}`,
                        boxShadow:isActive?`0 0 20px ${brand.color}44`:"none" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        marginBottom:10 }}>
                        <div>
                          <div style={{ fontFamily:"monospace", fontSize:10,
                            color:brand.color, marginBottom:3 }}>
                            {r["Campaign Code"]}
                          </div>
                          <div style={{ fontSize:13, fontWeight:700 }}>
                            {r["Objective"]}
                          </div>
                          <div style={{ fontSize:11, color:"#64748b" }}>
                            {r["Valence"]}
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:18, fontWeight:900, color:"#f59e0b" }}>
                            {fmt(spend)}
                          </div>
                          <div style={{ fontFamily:"monospace", fontSize:10, color:"#475569" }}>
                            {cepCount} CEPs
                          </div>
                        </div>
                      </div>
                      {/* CEP strip */}
                      <div style={{ display:"flex", gap:3, marginBottom:8 }}>
                        {CEP_LABELS.map((lbl, ci) => {
                          const on = BOOL(r[`CEP_${String(ci+1).padStart(2,"0")}`]);
                          return (
                            <div key={ci} title={lbl} style={{ width:19, height:19,
                              borderRadius:4, fontSize:8,
                              background:on?CEP_COLORS[ci]:"#0f172a",
                              border:`1px solid ${on?CEP_COLORS[ci]+"88":"#1e293b"}`,
                              color:on?"#fff":"#334155",
                              display:"flex", alignItems:"center",
                              justifyContent:"center",
                              fontFamily:"monospace", fontWeight:700 }}>
                              {ci+1}
                            </div>
                          );
                        })}
                      </div>
                      {/* Signal tags */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {[["Humor","#f59e0b"],["Bekende Personen","#ef4444"],
                          ["DBA - Soundlogo","#06b6d4"],["DBA - Slogan","#10b981"]]
                          .filter(([key]) => BOOL(r[key]))
                          .map(([key, color]) => (
                            <span key={key} style={{ fontSize:9, fontFamily:"monospace",
                              padding:"2px 7px", borderRadius:4,
                              background:`${color}22`, color,
                              border:`1px solid ${color}44` }}>
                              {key.replace("DBA - ","")}
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DETAIL ── */}
          {tab === "detail" && (() => {
            const r = brand.creatives[selCreative];
            if (!r) return (
              <div style={{ textAlign:"center", padding:80, color:"#334155",
                fontFamily:"monospace", fontSize:13, letterSpacing:"0.1em" }}>
                GO TO CREATIVES TAB AND SELECT A CREATIVE
              </div>
            );
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}
                className="fin">
                {/* Hero */}
                <div style={{ background:"linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
                  border:`1px solid ${brand.color}44`,
                  borderTop:`3px solid ${brand.color}`,
                  borderRadius:12, padding:28,
                  display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", gap:24 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"monospace", fontSize:10,
                      color:brand.color, letterSpacing:"0.2em", marginBottom:10 }}>
                      {r["Campaign Code"]} · {r["Mediumtype"]}
                    </div>
                    <div style={{ fontSize:32, fontWeight:900, marginBottom:12,
                      letterSpacing:"-0.02em" }}>{r["Merk"]}</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap",
                      fontFamily:"monospace", fontSize:11 }}>
                      {[[r["Objective"],"#3b82f6"],[r["Valence"],"#8b5cf6"],
                        [r["Doelgroep"],"#10b981"],[r["Imago"],"#f59e0b"]]
                        .filter(([val]) => val)
                        .map(([val, c]) => (
                          <span key={val} style={{ background:`${c}22`, color:c,
                            padding:"4px 12px", borderRadius:6,
                            border:`1px solid ${c}44` }}>{val}</span>
                        ))}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"monospace", fontSize:9, color:"#475569",
                      marginBottom:4, letterSpacing:"0.2em" }}>SPEND</div>
                    <div style={{ fontSize:40, fontWeight:900, color:"#f59e0b",
                      lineHeight:1, letterSpacing:"-0.03em" }}>
                      {fmt(NUM(r["Spend"]))}
                    </div>
                    {r["Creatives"]?.startsWith("http") && (
                      <a href={r["Creatives"]} target="_blank" rel="noreferrer"
                        style={{ display:"inline-block", marginTop:12,
                          fontFamily:"monospace", fontSize:10, color:"#60a5fa",
                          background:"#1e3a5f", border:"1px solid #3b82f644",
                          borderRadius:6, padding:"6px 14px",
                          textDecoration:"none" }}>
                        ↗ View Creative
                      </a>
                    )}
                  </div>
                </div>

                {/* Nav */}
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {[
                    ["← Prev", () => setSelCreative((v) => Math.max(0, v-1)),
                      selCreative === 0],
                    ["Next →", () => setSelCreative((v) =>
                      Math.min(brand.creatives.length-1, v+1)),
                      selCreative === brand.creatives.length-1],
                  ].map(([lbl, fn, dis]) => (
                    <button key={lbl} type="button" onClick={fn} disabled={dis}
                      style={{ padding:"8px 18px", background:"#1e293b",
                        border:"1px solid #334155", borderRadius:6,
                        color:dis?"#334155":"#94a3b8",
                        cursor:dis?"not-allowed":"pointer",
                        fontFamily:"monospace", fontSize:11 }}>
                      {lbl}
                    </button>
                  ))}
                  <span style={{ fontFamily:"monospace", fontSize:11, color:"#475569" }}>
                    Creative {selCreative+1} / {brand.creatives.length}
                  </span>
                </div>

                {/* Attributes grid */}
                <Card>
                  <SectionLabel>Attributes</SectionLabel>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    {[["Music Type",r["Music Type"]],["Voice-over",r["Voice-over"]],
                      ["Logo Start",r["Logo Start"]],["Logo End",r["Logo End"]],
                      ["Logo Locatie",r["Logo Locatie"]],["Logo Visible",r["Logo Visible"]],
                      ["Kijkrichting",r["Kijkrichting"]],["MVO",r["MVO"]],
                      ["DBA Kleur",r["DBA - Kleur van logo"]],
                      ["DBA Style",r["DBA - Style Keuze"]],
                      ["Dier",r["Dier"]],["Personen",r["Personen"]],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background:"#0f172a", borderRadius:6,
                        padding:"10px 14px", border:"1px solid #1e293b" }}>
                        <div style={{ fontFamily:"monospace", fontSize:8,
                          color:"#334155", textTransform:"uppercase",
                          letterSpacing:"0.18em", marginBottom:5 }}>{l}</div>
                        <div style={{ fontSize:12, fontWeight:600,
                          color:v&&v!=="False"&&v!=="FALSE"&&v!=="Afwezig"
                            ?"#e2e8f0":"#334155" }}>
                          {v || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Signals */}
                <Card>
                  <SectionLabel>Creative Signals</SectionLabel>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {[["Bekende Personen","#ef4444"],["Humor","#f59e0b"],
                      ["DBA - Slogan","#10b981"],["DBA - Karakter","#8b5cf6"],
                      ["DBA - Style Keuze","#06b6d4"],["DBA - Soundlogo","#f97316"],
                      ["Mystery Ad","#ec4899"],["Dier","#84cc16"],["Personen","#14b8a6"],
                    ].map(([key, color]) => {
                      const on = BOOL(r[key]);
                      return (
                        <div key={key} style={{ padding:"7px 14px", borderRadius:6,
                          fontSize:11, fontFamily:"monospace",
                          background:on?`${color}18`:"#0f172a",
                          border:`1px solid ${on?color+"55":"#1e293b"}`,
                          color:on?color:"#334155",
                          display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%",
                            flexShrink:0, background:on?color:"#1e293b",
                            boxShadow:on?`0 0 6px ${color}`:"none" }} />
                          {key.replace("DBA - ","")}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* CEPs */}
                <Card>
                  <SectionLabel>Category Entry Points</SectionLabel>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {CEP_LABELS.map((label, i) => (
                      <CepTag key={i} label={label}
                        active={BOOL(r[`CEP_${String(i+1).padStart(2,"0")}`])}
                        color={CEP_COLORS[i]} idx={i} />
                    ))}
                  </div>
                </Card>

                {/* CoT reasoning */}
                {r["CoT resultaten, exclusief ceps"] && (
                  <Card>
                    <SectionLabel>Analysis Reasoning</SectionLabel>
                    <div style={{ fontSize:13, lineHeight:1.9, color:"#64748b" }}>
                      {r["CoT resultaten, exclusief ceps"]}
                    </div>
                  </Card>
                )}
                {r["CoT ceps keuze met verantwoording"] && (
                  <Card>
                    <SectionLabel>CEP Reasoning</SectionLabel>
                    <div style={{ fontSize:13, lineHeight:1.9, color:"#64748b" }}>
                      {r["CoT ceps keuze met verantwoording"]}
                    </div>
                  </Card>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}