
const API_KEY = process.env.TWELVE_DATA_API_KEY;

const BASE_URL = "https://api.twelvedata.com";

if (!API_KEY) {
  throw new Error("Missing TWELVE_DATA_API_KEY");
}

// Initial major Forex pairs
export const FOREX_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "USD/CHF"
];

// Fetch historical candles
export async function getCandles(
  symbol,
  interval,
  outputsize = 100
) {
  const url = new URL(`${BASE_URL}/time_series`);

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", outputsize);
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("apikey", API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Twelve Data HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === "error" || !data.values) {
    throw new Error(
      data.message || "Unable to retrieve market candles"
    );
  }

  // Convert prices to numbers and arrange oldest first
  return data.values
    .map(candle => ({
      datetime: candle.datetime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close)
    }))
    .reverse();
}

// Fetch all three analysis timeframes
export async function getMarketSnapshot(symbol) {
  const [daily, fourHour, fifteenMinute] =
    await Promise.all([
      getCandles(symbol, "1day", 100),
      getCandles(symbol, "4h", 100),
      getCandles(symbol, "15min", 100)
    ]);

  return {
    symbol,
    daily,
    fourHour,
    fifteenMinute,
    updatedAt: new Date().toISOString()
  };
}
