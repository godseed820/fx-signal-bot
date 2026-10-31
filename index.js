
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable");
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;
let running = true;

async function sendMessage(chatId, message) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Telegram message failed");
  }
}

async function handleUpdate(update) {
  const message = update.message;

  if (!message?.text) return;

  const chatId = message.chat.id;
  const command = message.text.trim().split(/\s+/)[0].split("@")[0];

  if (command === "/start") {
    await sendMessage(
      chatId,
      "Welcome to FX Signal Bot!\n\n" +
      "Your Forex analysis assistant is being configured.\n\n" +
      "Strategies:\n" +
      "1. ICT\n" +
      "2. SMC\n" +
      "3. Support and Resistance\n" +
      "4. Supply and Demand\n" +
      "5. Liquidity\n\n" +
      "Timeframes: D1 + H4 + M15\n\n" +
      "Use /status to check the bot."
    );
  }

  if (command === "/status") {
    await sendMessage(
      chatId,
      "FX Signal Bot is online.\n" +
      "Market scanner: Under development.\n" +
      "Trading mode: Signals only."
    );
  }
}

async function startBot() {
  console.log("FX Signal Bot starting...");

  while (running) {
    try {
      const response = await fetch(
        `${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=25`
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || "Telegram polling failed");
      }

      for (const update of result.result) {
        offset = update.update_id + 1;

        try {
          await handleUpdate(update);
        } catch (error) {
          console.error("Update error:", error.message);
        }
      }
    } catch (error) {
      console.error("Telegram connection error:", error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

process.on("SIGTERM", () => {
  running = false;
});

process.on("SIGINT", () => {
  running = false;
});

startBot();
