import { apiRequest } from "@/lib/queryClient";

export type AppSettings = {
  refreshInterval: "10" | "30" | "60" | "300";
  currency: "usd" | "eur" | "idr" | "jpy";
  notifications: boolean;
  indicators: boolean;
};

export type Trade = {
  id: string;
  date: string;
  pair: string;
  type: "Long" | "Short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  notes: string;
  setupTag: string;
  mistakeTag: string;
  mood: "Calm" | "Neutral" | "FOMO" | "Fear";
  status: "Open" | "Closed";
};

export type NewTrade = Omit<Trade, "id" | "date">;

export type NewsSentiment = "positive" | "negative" | "neutral";
export type NewsImpact = "high" | "normal";

export type MarketNewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  sentiment: NewsSentiment;
  impact: NewsImpact;
};

export type DerivativesSnapshot = {
  source: "binance" | "mock";
  symbol: string;
  openInterestUsd: number;
  fundingRate: number;
  longShortRatio: number;
  estimatedLongPct: number;
  estimatedShortPct: number;
  liquidation24hUsd: number;
};

export type OnChainPoint = {
  time: string;
  inflow: number;
  outflow: number;
};

export type OnChainSnapshot = {
  source: "glassnode" | "mock";
  netflow7dUsd: number;
  whaleActivityScore: number;
  minerPressureScore: number;
  flows: OnChainPoint[];
};

export type AlertRule = {
  id: string;
  coinId: string;
  coinSymbol: string;
  type: "price_above" | "price_below" | "rsi_above" | "rsi_below" | "macd_bullish" | "macd_bearish";
  threshold: number | null;
  enabled: boolean;
  createdAt: string;
  triggeredAt: string | null;
};

export type NewAlertRule = Omit<AlertRule, "id" | "createdAt" | "triggeredAt">;

const CLIENT_ID_STORAGE_KEY = "crypto-pulse-client-id";

function getClientId() {
  let clientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
  }
  return clientId;
}

function getApiHeaders() {
  return {
    "x-client-id": getClientId(),
  };
}

async function fetchWithClientId(url: string): Promise<Response> {
  return fetch(url, {
    credentials: "include",
    headers: getApiHeaders(),
  });
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetchWithClientId("/api/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export async function saveSettings(payload: AppSettings): Promise<AppSettings> {
  const res = await apiRequest("PUT", "/api/settings", payload, getApiHeaders());
  return res.json();
}

export async function getWatchlist(): Promise<string[]> {
  const res = await fetchWithClientId("/api/watchlist");
  if (!res.ok) throw new Error("Failed to load watchlist");
  const data = await res.json();
  return data.watchlist;
}

export async function saveWatchlist(watchlist: string[]): Promise<string[]> {
  const res = await apiRequest("PUT", "/api/watchlist", { watchlist }, getApiHeaders());
  const data = await res.json();
  return data.watchlist;
}

export async function getJournalTrades(): Promise<Trade[]> {
  const res = await fetchWithClientId("/api/journal");
  if (!res.ok) throw new Error("Failed to load journal");
  const data = await res.json();
  return data.trades;
}

export async function createJournalTrade(payload: NewTrade): Promise<Trade> {
  const res = await apiRequest("POST", "/api/journal", payload, getApiHeaders());
  return res.json();
}

export async function deleteJournalTrade(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/journal/${id}`, undefined, getApiHeaders());
}

export async function getMarketNews(params: { sentiment?: "all" | NewsSentiment; impact?: "all" | NewsImpact }) {
  const query = new URLSearchParams();
  if (params.sentiment) query.set("sentiment", params.sentiment);
  if (params.impact) query.set("impact", params.impact);
  const res = await fetchWithClientId(`/api/market-news?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch market news");
  return res.json() as Promise<{ source: string; items: MarketNewsItem[] }>;
}

export async function getDerivatives(symbol: string): Promise<DerivativesSnapshot> {
  const res = await fetchWithClientId(`/api/derivatives/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch derivatives data");
  return res.json();
}

export async function getOnChain(coinId: string): Promise<OnChainSnapshot> {
  const res = await fetchWithClientId(`/api/onchain/${coinId}`);
  if (!res.ok) throw new Error("Failed to fetch on-chain data");
  return res.json();
}

export async function getAlerts(): Promise<AlertRule[]> {
  const res = await fetchWithClientId("/api/alerts");
  if (!res.ok) throw new Error("Failed to fetch alerts");
  const data = await res.json();
  return data.alerts;
}

export async function createAlert(payload: NewAlertRule): Promise<AlertRule> {
  const res = await apiRequest("POST", "/api/alerts", payload, getApiHeaders());
  return res.json();
}

export async function triggerAlert(id: string): Promise<void> {
  await apiRequest("PATCH", `/api/alerts/${id}/trigger`, {}, getApiHeaders());
}

export async function deleteAlert(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/alerts/${id}`, undefined, getApiHeaders());
}

export async function evaluateAlerts(payload: { coinId: string; price: number; rsi: number; macdHistogram: number }) {
  const res = await apiRequest("POST", "/api/alerts/evaluate", payload, getApiHeaders());
  return res.json() as Promise<{ triggeredIds: string[] }>;
}
