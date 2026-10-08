import { shopEnv } from '../shopEnv';

export async function sendWipeAlert(shop) {
  const to = shopEnv(shop.id, 'ALERT_EMAIL') || process.env.ALERT_EMAIL;
  const time = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'ShopOS <onboarding@resend.dev>',
      to,
      subject: `⚠️ WIPE ALERT — ${shop.name}: someone wiped all sales data!`,
      html: `<h2>⚠️ Sales Wipe Alert</h2><p>Someone just wiped all sales and closings data on <b>${shop.name}</b>.</p><p>Time: ${time}</p>`,
    }),
  });
}