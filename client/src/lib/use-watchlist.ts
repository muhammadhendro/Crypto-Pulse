import { useState, useEffect } from "react";
import { Coin, getTopCoins } from "@/lib/crypto-api";

const WATCHLIST_KEY = "crypto-watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(WATCHLIST_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error(error);
    }
  }, [watchlist]);

  const toggleWatchlist = (coinId: string) => {
    setWatchlist(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const isInWatchlist = (coinId: string) => watchlist.includes(coinId);

  return { watchlist, toggleWatchlist, isInWatchlist };
}
