import type { Express, Request } from "express";
import { randomUUID } from "crypto";
import { type Server } from "http";
import { z } from "zod";
import {
  addAlert,
  addJournalTrade,
  createUser,
  deleteJournalTrade,
  getAlerts,
  getAuthUsername,
  getJournal,
  getSettings,
  getUserByUsername,
  getWatchlist,
  setAuthUsername,
  setSettings,
  setWatchlist,
  updateAlerts,
  type Settings,
  type Trade,
} from "./persistence";

const settingsSchema = z.object({
  refreshInterval: z.enum(["10", "30", "60", "300"]),
  currency: z.enum(["usd", "eur", "idr", "jpy"]),
  notifications: z.boolean(),
  indicators: z.boolean(),
});

const tradeSchema = z.object({
  id: z.string(),
  date: z.string(),
  pair: z.string().min(1),
  type: z.enum(["Long", "Short"]),
  entryPrice: z.number(),
  exitPrice: z.number(),
  size: z.number(),
  pnl: z.number(),
  notes: z.string(),
  setupTag: z.string().default("Breakout"),
  mistakeTag: z.string().default("None"),
  mood: z.enum(["Calm", "Neutral", "FOMO", "Fear"]).default("Neutral"),
  status: z.enum(["Open", "Closed"]),
});

const createTradeSchema = tradeSchema.omit({ id: true, date: true });

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const loginSchema = registerSchema;


const alertRuleSchema = z.object({
  coinId: z.string(),
  coinSymbol: z.string(),
  type: z.enum(["price_above", "price_below", "rsi_above", "rsi_below", "macd_bullish", "macd_bearish"]),
  threshold: z.number().nullable(),
  enabled: z.boolean().default(true),
});

const createAlertRuleSchema = alertRuleSchema.omit({ enabled: true }).extend({ enabled: z.boolean().optional() });

const evaluateAlertsSchema = z.object({
  coinId: z.string(),
  price: z.number(),
  rsi: z.number(),
  macdHistogram: z.number(),
});

type DerivativesSnapshot = {
  source: "binance" | "mock";
  symbol: string;
  openInterestUsd: number;
  fundingRate: number;
  longShortRatio: number;
  estimatedLongPct: number;
  estimatedShortPct: number;
  liquidation24hUsd: number;
};

type OnChainPoint = {
  time: string;
  inflow: number;
  outflow: number;
};

type OnChainSnapshot = {
  source: "glassnode" | "mock";
  netflow7dUsd: number;
  whaleActivityScore: number;
  minerPressureScore: number;
  flows: OnChainPoint[];
};

function getClientId(req: Request) {
  const raw = req.header("x-client-id");
  if (raw && raw.trim()) return raw.trim();
  return "guest";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed request to ${url}: ${res.status}`);
  }

  return (await res.json()) as T;
}

function toBinanceFuturesSymbol(coinSymbol: string) {
  return `${coinSymbol.toUpperCase()}USDT`;
}

async function getDerivativesSnapshot(coinSymbol: string): Promise<DerivativesSnapshot> {
  const symbol = toBinanceFuturesSymbol(coinSymbol);

  try {
    const [openInterestData, premiumIndexData, ratioData] = await Promise.all([
      fetchJson<{ openInterest: string }>(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
      fetchJson<{ markPrice: string; lastFundingRate: string }>(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`),
      fetchJson<Array<{ longShortRatio: string }>>(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`
      ),
    ]);

    const markPrice = Number(premiumIndexData.markPrice || 0);
    const openInterest = Number(openInterestData.openInterest || 0);
    const longShortRatio = Number(ratioData?.[0]?.longShortRatio || 1);

    const longPct = Math.round((longShortRatio / (1 + longShortRatio)) * 100);
    const shortPct = 100 - longPct;

    return {
      source: "binance",
      symbol,
      openInterestUsd: openInterest * markPrice,
      fundingRate: Number(premiumIndexData.lastFundingRate || 0),
      longShortRatio,
      estimatedLongPct: longPct,
      estimatedShortPct: shortPct,
      liquidation24hUsd: openInterest * markPrice * 0.006,
    };
  } catch (_error) {
    const longShortRatio = 1.08;
    return {
      source: "mock",
      symbol,
      openInterestUsd: 4_200_000_000,
      fundingRate: 0.0001,
      longShortRatio,
      estimatedLongPct: Math.round((longShortRatio / (1 + longShortRatio)) * 100),
      estimatedShortPct: 48,
      liquidation24hUsd: 45_000_000,
    };
  }
}

async function getOnChainSnapshot(coinId: string): Promise<OnChainSnapshot> {
  const glassnodeApiKey = process.env.GLASSNODE_API_KEY;

  if (glassnodeApiKey && coinId === "bitcoin") {
    try {
      const [inflow, outflow] = await Promise.all([
        fetchJson<Array<{ t: number; v: number }>>(
          `https://api.glassnode.com/v1/metrics/distribution/exchange_net_position_change?a=BTC&i=24h&api_key=${glassnodeApiKey}`
        ),
        fetchJson<Array<{ t: number; v: number }>>(
          `https://api.glassnode.com/v1/metrics/transactions/transfers_volume_to_exchanges_sum?a=BTC&i=24h&api_key=${glassnodeApiKey}`
        ),
      ]);

      const inflowPoints = inflow.slice(-14);
      const outflowPoints = outflow.slice(-14);

      const flows = inflowPoints.map((point, index) => {
        const outValue = outflowPoints[index]?.v ?? Math.max(point.v * 0.85, 0);
        return {
          time: new Date(point.t * 1000).toISOString(),
          inflow: Math.max(point.v, 0),
          outflow: Math.max(outValue, 0),
        };
      });

      const netflow7dUsd = flows.slice(-7).reduce((acc, point) => acc + (point.inflow - point.outflow), 0);

      return {
        source: "glassnode",
        netflow7dUsd,
        whaleActivityScore: 71,
        minerPressureScore: 43,
        flows,
      };
    } catch (_error) {
      // fallback to mock below
    }
  }

  const now = Date.now();
  const flows = Array.from({ length: 14 }).map((_, idx) => {
    const dayMs = 86_400_000;
    const base = 150 + Math.random() * 120;
    return {
      time: new Date(now - (13 - idx) * dayMs).toISOString(),
      inflow: Number((base + Math.random() * 40).toFixed(2)),
      outflow: Number((base + (Math.random() - 0.2) * 60).toFixed(2)),
    };
  });

  const netflow7dUsd = flows.slice(-7).reduce((acc, point) => acc + (point.inflow - point.outflow), 0) * 1_000_000;

  return {
    source: "mock",
    netflow7dUsd,
    whaleActivityScore: 62,
    minerPressureScore: 39,
    flows,
  };
}

function normalizeNewsSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  if (/(surge|rally|approval|breakout|inflow|bull)/.test(lower)) return "positive";
  if (/(hack|lawsuit|ban|drop|liquidation|bear)/.test(lower)) return "negative";
  return "neutral";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid register payload" });

    const exists = await getUserByUsername(parsed.data.username);
    if (exists) return res.status(409).json({ message: "Username already exists" });

    const user = await createUser(parsed.data.username, parsed.data.password);
    if (!user) return res.status(409).json({ message: "Username already exists" });
    const clientId = getClientId(req);
    await setAuthUsername(clientId, user.username);

    return res.status(201).json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid login payload" });

    const user = await getUserByUsername(parsed.data.username);
    if (!user || user.password !== parsed.data.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const clientId = getClientId(req);
    await setAuthUsername(clientId, user.username);

    return res.json({ id: user.id, username: user.username });
  });

  app.get("/api/auth/me", async (req, res) => {
    const clientId = getClientId(req);
    const username = await getAuthUsername(clientId);

    if (!username) return res.status(401).json({ message: "Not authenticated" });

    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    return res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const clientId = getClientId(req);
    await setAuthUsername(clientId, null);
    return res.json({ ok: true });
  });
  app.get("/api/settings", async (req, res) => {
    const clientId = getClientId(req);
    const settings = await getSettings(clientId);
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid settings payload" });
    }

    const clientId = getClientId(req);
    const saved = await setSettings(clientId, parsed.data as Settings);
    return res.json(saved);
  });

  app.get("/api/watchlist", async (req, res) => {
    const clientId = getClientId(req);
    const watchlist = await getWatchlist(clientId);
    return res.json({ watchlist });
  });

  app.put("/api/watchlist", async (req, res) => {
    const parsed = z.object({ watchlist: z.array(z.string()) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid watchlist payload" });
    }

    const clientId = getClientId(req);
    const unique = await setWatchlist(clientId, parsed.data.watchlist);
    return res.json({ watchlist: unique });
  });

  app.get("/api/journal", async (req, res) => {
    const clientId = getClientId(req);
    const trades = await getJournal(clientId);
    return res.json({ trades });
  });

  app.post("/api/journal", async (req, res) => {
    const parsed = createTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid trade payload" });
    }

    const clientId = getClientId(req);
    const trade = await addJournalTrade(clientId, parsed.data as Omit<Trade, "id" | "date">);

    return res.status(201).json(trade);
  });

  app.delete("/api/journal/:id", async (req, res) => {
    const clientId = getClientId(req);
    await deleteJournalTrade(clientId, req.params.id);

    return res.json({ deleted: req.params.id });
  });

  app.get("/api/alerts", async (req, res) => {
    const clientId = getClientId(req);
    const alerts = await getAlerts(clientId);
    return res.json({ alerts });
  });

  app.post("/api/alerts", async (req, res) => {
    const parsed = createAlertRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid alert payload" });
    }

    const clientId = getClientId(req);
    const rule = await addAlert(clientId, {
      ...parsed.data,
      enabled: parsed.data.enabled ?? true,
    });
    return res.status(201).json(rule);
  });

  app.patch("/api/alerts/:id/trigger", async (req, res) => {
    const clientId = getClientId(req);
    await updateAlerts(clientId, (current) =>
      current.map((rule) =>
        rule.id === req.params.id
          ? { ...rule, triggeredAt: new Date().toISOString(), enabled: false }
          : rule
      )
    );
    return res.json({ ok: true });
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    const clientId = getClientId(req);
    await updateAlerts(clientId, (current) => current.filter((rule) => rule.id !== req.params.id));
    return res.json({ deleted: req.params.id });
  });

  app.post("/api/alerts/evaluate", async (req, res) => {
    const parsed = evaluateAlertsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid evaluate payload" });

    const { coinId, price, rsi, macdHistogram } = parsed.data;
    const clientId = getClientId(req);
    const triggeredIds: string[] = [];
    await updateAlerts(clientId, (current) => {
      return current.map((rule) => {
        if (!rule.enabled || rule.coinId !== coinId) return rule;

        const triggered =
          (rule.type === "price_above" && rule.threshold !== null && price >= rule.threshold) ||
          (rule.type === "price_below" && rule.threshold !== null && price <= rule.threshold) ||
          (rule.type === "rsi_above" && rule.threshold !== null && rsi >= rule.threshold) ||
          (rule.type === "rsi_below" && rule.threshold !== null && rsi <= rule.threshold) ||
          (rule.type === "macd_bullish" && macdHistogram > 0) ||
          (rule.type === "macd_bearish" && macdHistogram < 0);

        if (!triggered) return rule;
        triggeredIds.push(rule.id);
        return { ...rule, enabled: false, triggeredAt: new Date().toISOString() };
      });
    });
    return res.json({ triggeredIds });
  });

  app.get("/api/derivatives/:symbol", async (req, res) => {
    const data = await getDerivativesSnapshot(req.params.symbol);
    return res.json(data);
  });

  app.get("/api/onchain/:coinId", async (req, res) => {
    const data = await getOnChainSnapshot(req.params.coinId);
    return res.json(data);
  });

  app.get("/api/market-news", async (req, res) => {
    const sentimentFilter = String(req.query.sentiment ?? "all");
    const impactFilter = String(req.query.impact ?? "all");
    const apiKey = process.env.CRYPTOPANIC_API_KEY;

    try {
      const endpoint = apiKey
        ? `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${apiKey}&kind=news&public=true`
        : "https://api.coingecko.com/api/v3/news";

      const raw = await fetchJson<any>(endpoint);

      const items = (raw.results ?? raw.data ?? [])
        .slice(0, 30)
        .map((item: any) => {
          const title = item.title ?? item?.attributes?.title ?? "Untitled";
          const sentiment = normalizeNewsSentiment(title);
          const impact = /(hack|lawsuit|etf|sec|liquidation|ban|approval)/i.test(title) ? "high" : "normal";

          return {
            id: String(item.id ?? item.url ?? randomUUID()),
            title,
            url: item.url ?? item?.attributes?.url ?? "#",
            source: item.source?.title ?? item?.attributes?.source ?? "Market Feed",
            published_at: item.published_at ?? item.created_at ?? new Date().toISOString(),
            sentiment,
            impact,
          };
        })
        .filter((item: any) => sentimentFilter === "all" || item.sentiment === sentimentFilter)
        .filter((item: any) => impactFilter === "all" || item.impact === impactFilter);

      return res.json({ source: apiKey ? "cryptopanic" : "coingecko", items });
    } catch (_error) {
      const fallback = [
        {
          id: "fallback-1",
          title: "Market consolidates as traders await macro catalysts",
          url: "#",
          source: "Fallback Feed",
          published_at: new Date().toISOString(),
          sentiment: "neutral",
          impact: "normal",
        },
      ];

      return res.json({ source: "fallback", items: fallback });
    }
  });

  return httpServer;
}
