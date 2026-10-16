require('dotenv').config();
const { WebcastPushConnection } = require('tiktok-live-connector');

// Configuration
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'hotarucosplay';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/tiktok';
const WEBHOOK_SECRET = process.env.TIKTOK_WEBHOOK_SECRET || 'weblivehub_secret_2026';

console.log(`[TikTok Connector] Starting service for user: @${TIKTOK_USERNAME}`);
console.log(`[TikTok Connector] Target Webhook: ${WEBHOOK_URL}`);

const tiktokLive = new WebcastPushConnection(TIKTOK_USERNAME);

// Helper to send webhook
async function sendWebhook(payload) {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(`[Webhook Sent]`, payload.eventType, 'Response:', data);
  } catch (err) {
    console.error(`[Webhook Error] Failed to send payload:`, err.message);
  }
}

// Connect to TikTok Live
tiktokLive
  .connect()
  .then((state) => {
    console.info(`[TikTok Connected] Room ID: ${state.roomId}`);
  })
  .catch((err) => {
    console.error('[TikTok Connection Failed]', err);
    console.log('Pastikan streamer sedang LIVE di TikTok dengan username yang benar.');
  });

// Event 1: Chat message received
tiktokLive.on('chat', (data) => {
  const comment = data.comment || '';
  if (comment.startsWith('!req')) {
    console.log(`[Chat !req] from ${data.nickname || data.uniqueId}: ${comment}`);
    sendWebhook({
      eventType: 'CHAT',
      user: data.nickname || data.uniqueId,
      comment: comment,
    });
  }
});

// Event 2: Gift received
tiktokLive.on('gift', (data) => {
  // Only process if gift streak finished or non-streak gift
  if (data.giftType === 1 && !data.repeatEnd) {
    return;
  }

  const giftName = data.giftName;
  const giftCoins = data.diamondCount * (data.repeatCount || 1);
  const user = data.nickname || data.uniqueId;

  console.log(`[Gift Received] ${user} sent ${giftName} (Value: ${giftCoins} coins)`);

  sendWebhook({
    eventType: 'GIFT',
    user: user,
    giftName: giftName,
    giftCoins: giftCoins,
    comment: data.comment || '',
  });
});

// Event 3: Disconnected / Error
tiktokLive.on('disconnected', () => {
  console.warn('[TikTok Disconnected] Reconnecting in 10s...');
  setTimeout(() => {
    tiktokLive.connect().catch(console.error);
  }, 10000);
});

tiktokLive.on('error', (err) => {
  console.error('[TikTok Stream Error]', err);
});
