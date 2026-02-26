import type { Row, Brand, CepStat } from "./types";
import { CEP_LABELS, PALETTE } from "./constants";

export const BOOL = (v: string): boolean => v === "True" || v === "TRUE";
export const NUM = (v: string): number =>
  parseFloat(v.replace(/[^\d.]/g, "")) || 0;
export const fmt = (n: number): string =>
  n >= 1e6
    ? `€${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
      ? `€${(n / 1e3).toFixed(0)}K`
      : `€${Math.round(n)}`;
export const pct = (a: number, b: number): number =>
  b === 0 ? 0 : Math.round((a / b) * 100);

export const cepKey = (i: number) => `CEP_${String(i + 1).padStart(2, "0")}`;

export const buildBrands = (rows: Row[]): Brand[] => {
  const map: Record<string, Row[]> = {};
  rows.forEach((r) => {
    const m = r["Merk"] || "Unknown";
    if (!map[m]) map[m] = [];
    map[m].push(r);
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, creatives], idx): Brand => {
      const totalSpend = creatives.reduce(
        (s, r) => s + NUM(r["Spend"] ?? "0"),
        0,
      );

      const ceps: CepStat[] = CEP_LABELS.map((label, i) => {
        const count = creatives.filter((r) => BOOL(r[cepKey(i)] ?? "")).length;
        return { label, count, pct: pct(count, creatives.length) };
      });

      const objectives: Record<string, number> = {};
      creatives.forEach((r) => {
        const o = r["Objective"] ?? "?";
        objectives[o] = (objectives[o] ?? 0) + 1;
      });

      const valences: Record<string, number> = {};
      creatives.forEach((r) => {
        const v = r["Valence"] ?? "?";
        valences[v] = (valences[v] ?? 0) + 1;
      });

      const fl = (key: string) =>
        pct(
          creatives.filter((r) => BOOL(r[key] ?? "")).length,
          creatives.length,
        );
      const fv = (key: string) =>
        pct(
          creatives.filter((r) => r[key] && r[key] !== "Afwezig").length,
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
      ];

      return {
        name,
        creatives,
        totalSpend,
        ceps,
        objectives,
        valences,
        features,
        activeCeps: ceps.filter((c) => c.count > 0).length,
        color: PALETTE[idx % PALETTE.length],
      };
    });
};
