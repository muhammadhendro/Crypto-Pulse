import axios from "axios";
import { format } from "date-fns";

// --- Types ---
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

export interface GlobalData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: { [key: string]: number };
  total_volume: { [key: string]: number };
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// --- MOCK DATA ---
const MOCK_COINS: Coin[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 64231,
    market_cap: 1200000000000,
    market_cap_rank: 1,
    fully_diluted_valuation: 1350000000000,
    total_volume: 35000000000,
    high_24h: 65120,
    low_24h: 63500,
    price_change_24h: -542.12,
    price_change_percentage_24h: -0.84,
    market_cap_change_24h: -10000000000,
    market_cap_change_percentage_24h: -0.8,
    circulating_supply: 19650000,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: 73750,
    ath_change_percentage: -12.9,
    ath_date: "2024-03-14T00:00:00.000Z",
    atl: 67.81,
    atl_change_percentage: 94630,
    atl_date: "2013-07-06T00:00:00.000Z",
    last_updated: new Date().toISOString(),
    sparkline_in_7d: { price: Array.from({ length: 168 }, () => 60000 + Math.random() * 5000) }
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 3452.12,
    market_cap: 400000000000,
    market_cap_rank: 2,
    fully_diluted_valuation: 400000000000,
    total_volume: 15000000000,
    high_24h: 3550,
    low_24h: 3380,
    price_change_24h: 45.2,
    price_change_percentage_24h: 1.32,
    market_cap_change_24h: 5000000000,
    market_cap_change_percentage_24h: 1.3,
    circulating_supply: 120000000,
    total_supply: 120000000,
    max_supply: null,
    ath: 4891,
    ath_change_percentage: -29.4,
    ath_date: "2021-11-16T00:00:00.000Z",
    atl: 0.42,
    atl_change_percentage: 821000,
    atl_date: "2015-10-21T00:00:00.000Z",
    last_updated: new Date().toISOString(),
    sparkline_in_7d: { price: Array.from({ length: 168 }, () => 3200 + Math.random() * 400) }
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 145.23,
    market_cap: 65000000000,
    market_cap_rank: 5,
    fully_diluted_valuation: null,
    total_volume: 4000000000,
    high_24h: 152.00,
    low_24h: 138.50,
    price_change_24h: 5.12,
    price_change_percentage_24h: 3.65,
    market_cap_change_24h: 2000000000,
    market_cap_change_percentage_24h: 3.6,
    circulating_supply: 443000000,
    total_supply: 572000000,
    max_supply: null,
    ath: 260,
    ath_change_percentage: -44.1,
    ath_date: "2021-11-06T00:00:00.000Z",
    atl: 0.5,
    atl_change_percentage: 28000,
    atl_date: "2020-05-11T00:00:00.000Z",
    last_updated: new Date().toISOString(),
    sparkline_in_7d: { price: Array.from({ length: 168 }, () => 130 + Math.random() * 30) }
  }
];

const MOCK_GLOBAL: GlobalData = {
  active_cryptocurrencies: 13000,
  upcoming_icos: 20,
  ended_icos: 3400,
  markets: 850,
  total_market_cap: { usd: 2450000000000 },
  total_volume: { usd: 85000000000 },
  market_cap_percentage: { btc: 52.1, eth: 17.4, sol: 4.2 },
  market_cap_change_percentage_24h_usd: 1.2,
  updated_at: Date.now()
};

// --- API CLIENT ---

// We will default to mock data to ensure the prototype "just works" without hitting API limits or CORS issues immediately.
// In a production app, we would configure a proper proxy server.
const USE_MOCK = true; 

export const getTopCoins = async (): Promise<Coin[]> => {
  if (USE_MOCK) {
    // Simulate delay
    await new Promise(r => setTimeout(r, 800));
    return MOCK_COINS;
  }
  
  try {
    const { data } = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 20,
        page: 1,
        sparkline: true,
        price_change_percentage: "24h,7d"
      }
    });
    return data;
  } catch (error) {
    console.error("API Error, falling back to mock", error);
    return MOCK_COINS;
  }
};

export const getGlobalData = async (): Promise<GlobalData> => {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_GLOBAL;
  }
  
  try {
    const { data } = await axios.get("https://api.coingecko.com/api/v3/global");
    return data.data;
  } catch (error) {
    return MOCK_GLOBAL;
  }
};

export const getCoinHistory = async (id: string, days: string = "7"): Promise<{ prices: [number, number][] }> => {
  // Mock history data
  const now = Date.now();
  const dayMs = 86400000;
  const count = days === "1" ? 24 : parseInt(days);
  const interval = days === "1" ? 3600000 : dayMs;
  
  const prices: [number, number][] = Array.from({ length: count }).map((_, i) => {
    const time = now - (count - 1 - i) * interval;
    const basePrice = id === "bitcoin" ? 64000 : id === "ethereum" ? 3400 : 140;
    const random = Math.random() * (basePrice * 0.1) - (basePrice * 0.05);
    return [time, basePrice + random];
  });
  
  return { prices };
};

export const getNews = async (): Promise<NewsItem[]> => {
  return [
    {
      id: "1",
      title: "Bitcoin Surges Past $65k as ETF Inflows Reach Record Highs",
      url: "#",
      source: "CryptoDesk",
      published_at: new Date().toISOString(),
      sentiment: "positive"
    },
    {
      id: "2",
      title: "Regulatory Uncertainty Clouds Ethereum's Future in EU Markets",
      url: "#",
      source: "BlockWire",
      published_at: new Date(Date.now() - 3600000).toISOString(),
      sentiment: "neutral"
    },
    {
      id: "3",
      title: "Solana Network Experiences Brief Congestion, Developers Respond",
      url: "#",
      source: "ChainDaily",
      published_at: new Date(Date.now() - 7200000).toISOString(),
      sentiment: "negative"
    }
  ];
};
