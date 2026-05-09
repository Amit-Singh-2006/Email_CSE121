const express = require('express');
const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'student_platform_secret';

// ─── GET /webhook — Meta verification (one-time) ──────────────────────────────
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// ─── POST /webhook — Incoming messages from parents ───────────────────────────
router.post('/', async (req, res) => {
  // Always respond 200 immediately — Meta will retry if you don't
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ── Incoming message from parent ────────────────────────────────────
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.metadata);
          }
        }

        // ── Message status update (sent/delivered/read/failed) ──────────────
        if (value.statuses) {
          for (const status of value.statuses) {
            handleStatusUpdate(status);
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

// ─── Handle incoming message ───────────────────────────────────────────────────
async function handleIncomingMessage(message, metadata) {
  const from = message.from;           // parent's phone number
  const messageId = message.id;
  const timestamp = message.timestamp;

  console.log(`📨 Message from ${from} at ${new Date(timestamp * 1000).toLocaleString()}`);

  if (message.type === 'text') {
    const text = message.text.body.trim().toLowerCase();
    console.log(`   Text: "${text}"`);

    // Handle parent replies
    if (text === 'view report' || text === 'report') {
      await sendPortalLink(from);
    } else if (text === 'help') {
      await sendHelpMessage(from);
    } else if (text === 'stop') {
      await handleUnsubscribe(from);
    } else {
      await sendDefaultReply(from);
    }
  }

  // Log to DB here when Prisma is set up
  // await prisma.communicationLog.create({ data: { ... } });
}

// ─── Handle status updates ─────────────────────────────────────────────────────
function handleStatusUpdate(status) {
  const statusMap = {
    'sent': '📤 Sent',
    'delivered': '📥 Delivered',
    'read': '👁️  Read',
    'failed': '❌ Failed'
  };
  console.log(`${statusMap[status.status] || status.status} — Message ID: ${status.id} to ${status.recipient_id}`);
}

// ─── Reply helpers ─────────────────────────────────────────────────────────────
const { sendWhatsAppText } = require('../services/whatsappReply');

async function sendPortalLink(toNumber) {
  const portalUrl = `${process.env.FRONTEND_URL}/parent-portal`;
  // Note: Free text messages only work within 24hr of parent initiating conversation
  // For now log it — implement when you have a real phone number
  console.log(`🔗 Would send portal link to ${toNumber}: ${portalUrl}`);
}

async function sendHelpMessage(toNumber) {
  console.log(`❓ Would send help message to ${toNumber}`);
}

async function handleUnsubscribe(toNumber) {
  console.log(`🚫 Unsubscribe request from ${toNumber}`);
  // Mark parent as unsubscribed in DB
}

async function sendDefaultReply(toNumber) {
  console.log(`💬 Default reply to ${toNumber}`);
}

module.exports = router;
