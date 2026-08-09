// backend/utils/whatsapp.js
const axios = require('axios');

/**
 * Send a WhatsApp message via UltraMsg API.
 *
 * IMPORTANT — UltraMsg phone format:
 *   ✅ "21692006969"   (no +, no spaces, no dashes)
 *   ❌ "+21692006969"  (UltraMsg rejects the leading +)
 *
 * This function strips the leading + automatically.
 * It is fire-and-forget — it NEVER throws or crashes the caller.
 *
 * @param {string} to   - recipient phone number (with or without +)
 * @param {string} body - plain text message body (supports WhatsApp markdown: *bold*, _italic_)
 */
async function sendWhatsApp(to, body) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token      = process.env.ULTRAMSG_TOKEN;

  // ── Debug logs (always visible in server console) ─────────────────────────
  console.log('\n[WhatsApp] ════════════════════════════════════');
  console.log('[WhatsApp] ▶ sendWhatsApp() called');
  console.log('[WhatsApp]   ULTRAMSG_INSTANCE_ID :', instanceId ? `"${instanceId}" ✅` : '❌ NOT SET');
  console.log('[WhatsApp]   ULTRAMSG_TOKEN       :', token      ? '****** ✅'           : '❌ NOT SET');
  console.log('[WhatsApp]   to (raw)             :', to);

  // ── Guard: missing env vars ────────────────────────────────────────────────
  if (!instanceId || !token) {
    console.error('[WhatsApp] ❌ Cannot send — env vars missing. Check your .env file.');
    console.log('[WhatsApp] ════════════════════════════════════\n');
    return;
  }

  // ── Guard: missing recipient ───────────────────────────────────────────────
  if (!to) {
    console.error('[WhatsApp] ❌ Cannot send — "to" is empty or undefined.');
    console.log('[WhatsApp] ════════════════════════════════════\n');
    return;
  }

  // ── Strip leading + (UltraMsg requirement) ─────────────────────────────────
  const cleanTo = String(to).replace(/^\+/, '').replace(/\s/g, '');
  console.log('[WhatsApp]   to (clean)           :', cleanTo);

  // ── Build request ──────────────────────────────────────────────────────────
  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;

  // UltraMsg requires application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('token',    token);
  params.append('to',       cleanTo);
  params.append('body',     body);
  params.append('priority', '10');

  console.log('[WhatsApp]   URL                 :', url);

  try {
    const res = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000, // 10 s
    });

    console.log('[WhatsApp] ✅ Message sent successfully!');
    console.log('[WhatsApp]   Response status     :', res.status);
    console.log('[WhatsApp]   Response data       :', JSON.stringify(res.data));
    console.log('[WhatsApp] ════════════════════════════════════\n');
    return res.data;

  } catch (err) {
    if (err.response) {
      console.error('[WhatsApp] ❌ API returned an error:');
      console.error('[WhatsApp]   Status :', err.response.status);
      console.error('[WhatsApp]   Data   :', JSON.stringify(err.response.data));
    } else if (err.code === 'ECONNABORTED') {
      console.error('[WhatsApp] ❌ Request timed out (10s)');
    } else {
      console.error('[WhatsApp] ❌ Network/unknown error:', err.message);
    }
    console.log('[WhatsApp] ════════════════════════════════════\n');
    // Never re-throw — WhatsApp must NEVER crash the order flow
  }
}

/**
 * Build the order notification message string.
 * Extracted here so it can be unit-tested independently.
 */
function buildOrderMessage(order, shippingAddress, items, total, paymentMethod) {
  const orderId   = String(order._id).slice(-8).toUpperCase();
  const dateStr   = new Date().toLocaleString('fr-TN', { timeZone: 'Africa/Tunis' });
  const itemLines = items
    .map(i => `  • ${i.quantity}× produit — ${Number(i.price).toFixed(2)} DT`)
    .join('\n');

  return (
    `🛒 *Nouvelle commande reçue !*\n\n` +
    `📦 *Commande #${orderId}*\n` +
    `📅 ${dateStr}\n\n` +
    `👤 *Client :* ${shippingAddress.fullName}\n` +
    `📞 *Tél :* ${shippingAddress.phone}\n` +
    `📍 *Adresse :* ${shippingAddress.address}, ${shippingAddress.city} ${shippingAddress.postalCode}\n\n` +
    `🧾 *Articles :*\n${itemLines}\n\n` +
    `💰 *Total :* ${Number(total).toFixed(2)} DT\n` +
    `💳 *Paiement :* ${paymentMethod}\n\n` +
    `✅ Statut : En attente`
  );
}

module.exports = { sendWhatsApp, buildOrderMessage };