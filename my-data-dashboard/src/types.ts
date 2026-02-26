export interface Row {
  [key: string]: string;
}

export interface CepStat {
  label: string;
  count: number;
  pct: number;
}

export interface Feature {
  name: string;
  val: number;
  color: string;
}

export interface Brand {
  name: string;
  creatives: Row[];
  totalSpend: number;
  ceps: CepStat[];
  objectives: Record<string, number>;
  valences: Record<string, number>;
  features: Feature[];
  activeCeps: number;
  color: string;
}
