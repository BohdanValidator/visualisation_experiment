import { useState, useEffect, useMemo } from "react";
import type { Row, Brand } from "./types";
import { buildBrands, fmt } from "./utils";
import { OverviewTab } from "./tabs/OverviewTab";
import { CepTab } from "./tabs/CepTab";

const CSS = `
  html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:#0f172a; }
  *, *::before, *::after { box-sizing:border-box; }
  ::-webkit-scrollbar { width:6px; height:6px; background:#0f172a; }
  ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }
  .brand-btn { font-family:system-ui,sans-serif; font-size:13px; font-weight:700;
    cursor:pointer; border-radius:8px; padding:10px 20px; white-space:nowrap;
    transition:transform .12s ease, box-shadow .12s ease; }
  .brand-btn:hover { filter:brightness(1.1); }
  .tab-btn { background:none; font-family:monospace; font-size:11px;
    letter-spacing:0.15em; text-transform:uppercase; padding:14px 22px;
    cursor:pointer; transition:color .15s; border:none; }
  .trow { cursor:pointer; }
  .trow:hover td { background:#1e3a5f !important; }
  @keyframes fin { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .fin { animation:fin .22s ease both; }
`;

const TABS = ["overview", "cep"];

export default function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/data.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: Row[]) => {
        setRows(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const brands = useMemo<Brand[]>(
    () => (rows.length ? buildBrands(rows) : []),
    [rows],
  );

  useEffect(() => {
    if (brands.length > 0 && brandName === null) setBrandName(brands[0].name);
  }, [brands, brandName]);

  const handleBrandClick = (name: string) => {
    setBrandName(name);
    setTab("overview");
  };

  const brand = useMemo<Brand | null>(
    () => brands.find((b) => b.name === brandName) ?? brands[0] ?? null,
    [brands, brandName],
  );

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
            fontFamily: "monospace",
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
          style={{ color: "#ef4444", fontFamily: "monospace", fontSize: 14 }}
        >
          {error ? `Error: ${error}` : "No data — place data.json in /public"}
        </div>
      </div>
    );

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
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div
        style={{
          background: "#0c1425",
          borderBottom: "2px solid #1e293b",
          padding: "16px 32px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
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
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: "0.22em",
                color: "#475569",
                textTransform: "uppercase",
              }}
            >
              Validators Creative Analytics
            </span>
          </div>
          <span
            style={{ fontFamily: "monospace", fontSize: 10, color: "#334155" }}
          >
            {rows.length.toLocaleString()} creatives · {brands.length} brands
          </span>
        </div>

        {/* Brand selector */}
        <div>
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
              fontFamily: "monospace",
              fontSize: 11,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: brand.color,
              }}
            />
            <span style={{ color: brand.color, fontWeight: 700 }}>
              {brand.name}
            </span>
            <span>·</span>
            <span>{brand.creatives.length} creatives</span>
            <span>·</span>
            <span style={{ color: "#f59e0b" }}>{fmt(brand.totalSpend)}</span>
          </div>
        )}
      </div>

      {/* ══ CONTENT ══ */}
      {brand && (
        <div
          style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}
          className="fin"
          key={`${brandName}-${tab}`}
        >
          {tab === "overview" && (
            <OverviewTab
              brand={brand}
              brands={brands}
              brandName={brandName}
              handleBrandClick={handleBrandClick}
            />
          )}
          {tab === "cep" && (
            <CepTab
              brand={brand}
              brands={brands}
              brandName={brandName}
              handleBrandClick={handleBrandClick}
            />
          )}

        </div>
      )}
    </div>
  );
}
