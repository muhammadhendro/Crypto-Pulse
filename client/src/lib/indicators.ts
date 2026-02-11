import { 
  RSI, 
  SMA, 
  EMA, 
  MACD, 
  BollingerBands, 
  ATR, 
  Stochastic 
} from 'technicalindicators';

// --- Types ---
export interface TechnicalIndicators {
  rsi: number;
  sma: {
    period20: number;
    period50: number;
    period200: number;
  };
  ema: {
    period12: number;
    period26: number;
  };
  macd: {
    MACD?: number;
    signal?: number;
    histogram?: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    pb: number; // Percent Bandwidth
  };
  atr: number;
  vwap: number;
  stochastic: {
    k: number;
    d: number;
  };
  pivotPoints: {
    classic: {
      pp: number;
      r1: number;
      r2: number;
      r3: number;
      s1: number;
      s2: number;
      s3: number;
    };
  };
}

export interface TechnicalSignal {
  signal: "Bullish" | "Bearish" | "Neutral";
  score: number; // 0-100
  reason: string[];
}

export interface TechnicalAnalysisResult {
  indicators: TechnicalIndicators;
  signals: {
    summary: TechnicalSignal;
    oscillators: TechnicalSignal;
    movingAverages: TechnicalSignal;
  };
}

// --- Calculator ---

export const calculateIndicators = (prices: number[], highs: number[], lows: number[], closes: number[], volumes: number[] = closes): TechnicalAnalysisResult => {
  // Ensure we have enough data
  if (prices.length < 200) {
    // Return safe defaults if not enough data
    return getSafeDefaults();
  }

  // 1. RSI
  const rsiInput = { values: closes, period: 14 };
  const rsiValues = RSI.calculate(rsiInput);
  const currentRsi = rsiValues[rsiValues.length - 1] || 50;

  // 2. SMA
  const sma20 = SMA.calculate({ period: 20, values: closes }).pop() || 0;
  const sma50 = SMA.calculate({ period: 50, values: closes }).pop() || 0;
  const sma200 = SMA.calculate({ period: 200, values: closes }).pop() || 0;

  // 3. EMA
  const ema12 = EMA.calculate({ period: 12, values: closes }).pop() || 0;
  const ema26 = EMA.calculate({ period: 26, values: closes }).pop() || 0;

  // 4. MACD
  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };
  const macdValues = MACD.calculate(macdInput);
  const currentMacd = macdValues[macdValues.length - 1] || { MACD: 0, signal: 0, histogram: 0 };

  // 5. Bollinger Bands
  const bbInput = { period: 20, values: closes, stdDev: 2 };
  const bbValues = BollingerBands.calculate(bbInput);
  const currentBB = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0, pb: 0 };

  // 6. ATR
  const atrInput = { high: highs, low: lows, close: closes, period: 14 };
  const atrValues = ATR.calculate(atrInput);
  const currentAtr = atrValues[atrValues.length - 1] || 0;

  // 7. Stochastic
  const stochInput = { high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 };
  const stochValues = Stochastic.calculate(stochInput);
  const currentStoch = stochValues[stochValues.length - 1] || { k: 50, d: 50 };

  // 8. Pivot Points (Classic) - using last complete candle (yesterday's data approximation)
  const lastHigh = highs[highs.length - 2] || highs[highs.length - 1];
  const lastLow = lows[lows.length - 2] || lows[lows.length - 1];
  const lastClose = closes[closes.length - 2] || closes[closes.length - 1];
  
  const pp = (lastHigh + lastLow + lastClose) / 3;
  const pivotPoints = {
    pp,
    r1: 2 * pp - lastLow,
    r2: pp + (lastHigh - lastLow),
    r3: highPivot(pp, lastHigh, lastLow), // Simplified
    s1: 2 * pp - lastHigh,
    s2: pp - (lastHigh - lastLow),
    s3: lowPivot(pp, lastHigh, lastLow), // Simplified
  };

  // --- Signal Analysis ---
  const reasons: string[] = [];
  let score = 50;

  // RSI Logic
  if (currentRsi > 70) { score -= 15; reasons.push("RSI Overbought"); }
  else if (currentRsi < 30) { score += 15; reasons.push("RSI Oversold"); }

  // MACD Logic
  if ((currentMacd.histogram || 0) > 0) { score += 10; reasons.push("MACD Bullish Cross"); }
  else { score -= 10; reasons.push("MACD Bearish Momentum"); }

  // MA Logic
  const currentPrice = closes[closes.length - 1];
  if (currentPrice > sma200) { score += 10; reasons.push("Price above SMA200"); }
  else { score -= 10; reasons.push("Price below SMA200"); }
  
  if (sma20 > sma50) { score += 5; reasons.push("Golden Cross (Short-term)"); }
  else { score -= 5; reasons.push("Death Cross (Short-term)"); }

  // BB Logic
  if (currentPrice > currentBB.upper) { score -= 10; reasons.push("Price above Upper BB"); }
  if (currentPrice < currentBB.lower) { score += 10; reasons.push("Price below Lower BB"); }

  let signal: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  if (score > 60) signal = "Bullish";
  if (score < 40) signal = "Bearish";

  const vwapNumerator = closes.reduce((acc, close, idx) => acc + close * (volumes[idx] ?? close), 0);
  const vwapDenominator = volumes.reduce((acc, volume) => acc + (volume || 0), 0) || 1;
  const vwap = vwapNumerator / vwapDenominator;

  return {
    indicators: {
      rsi: currentRsi,
      sma: { period20: sma20, period50: sma50, period200: sma200 },
      ema: { period12: ema12, period26: ema26 },
      macd: currentMacd,
      bollingerBands: { ...currentBB, pb: (currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower) },
      atr: currentAtr,
      vwap,
      stochastic: currentStoch,
      pivotPoints: { ...pivotPoints, classic: pivotPoints } as any
    },
    signals: {
      summary: { signal, score, reason: reasons },
      oscillators: { signal: "Neutral", score: 50, reason: [] }, // Simplified for now
      movingAverages: { signal: "Neutral", score: 50, reason: [] } // Simplified for now
    }
  };
};

function highPivot(pp: number, high: number, low: number) { return high + 2 * (pp - low); }
function lowPivot(pp: number, high: number, low: number) { return low - 2 * (high - pp); }

function getSafeDefaults(): TechnicalAnalysisResult {
  return {
    indicators: {
      rsi: 50,
      sma: { period20: 0, period50: 0, period200: 0 },
      ema: { period12: 0, period26: 0 },
      macd: { MACD: 0, signal: 0, histogram: 0 },
      bollingerBands: { upper: 0, middle: 0, lower: 0, pb: 0 },
      atr: 0,
      vwap: 0,
      stochastic: { k: 50, d: 50 },
      pivotPoints: { classic: { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 } }
    },
    signals: {
      summary: { signal: "Neutral", score: 50, reason: ["Insufficient Data"] },
      oscillators: { signal: "Neutral", score: 50, reason: [] },
      movingAverages: { signal: "Neutral", score: 50, reason: [] }
    }
  };
}
