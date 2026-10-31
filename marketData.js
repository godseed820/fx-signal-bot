
const API_KEY = process.env.TWELVE_DATA_API_KEY;

const BASE_URL = "https://api.twelvedata.com";

if (!API_KEY) {
  throw new Error("Missing TWELVE_DATA_API_KEY");
}

export const FOREX_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "USD/CHF"
];

// Free-plan request spacing
const REQUEST_DELAY_MS = 8500;

let lastRequestTime = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRequestSlot() {
  const elapsed = Date.now() - lastRequestTime;

  if (elapsed < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsed);
  }

  lastRequestTime = Date.now();
}

export async function getCandles(
  symbol,
  interval,
  outputsize = 100
) {
  await waitForRequestSlot();

  const url = new URL(`${BASE_URL}/time_series`);

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", outputsize);
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("apikey", API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Twelve Data HTTP error: ${response.status}`
    );
  }

  const data = await response.json();

  if (data.status === "error" || !data.values) {
    throw new Error(
      data.message || "Unable to retrieve market candles"
    );
  }

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

// Fetch timeframes sequentially
export async function getMarketSnapshot(symbol) {
  console.log(`Downloading market data for ${symbol}`);

  const daily = await getCandles(
    symbol,
    "1day",
    100
  );

  const fourHour = await getCandles(
    symbol,
    "4h",
    100
  );

  const fifteenMinute = await getCandles(
    symbol,
    "15min",
    100
  );

  return {
    symbol,
    daily,
    fourHour,
    fifteenMinute,
    updatedAt: new Date().toISOString()
  };
}
