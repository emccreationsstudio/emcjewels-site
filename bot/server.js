// EMC Jewels müşteri asistanı — sadece soru yanıtlar; sipariş, rezervasyon veya ödeme almaz.
// Bağımlılık yok (Node 20+). Uç noktalar: GET /health, GET /widget.js, POST /api/chat
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
const PORT = Number(env.PORT || 3000);
const API_KEY = env.ANTHROPIC_API_KEY || '';
const MODEL = env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const MOCK = env.MOCK_LLM === '1';
const ORIGINS = (env.WEB_ALLOWED_ORIGINS || 'https://emcjewels.com,https://www.emcjewels.com').split(',').map((s) => s.trim()).filter(Boolean);

const KNOWLEDGE = fs.readFileSync(path.join(DIR, 'knowledge.json'), 'utf8');
const WIDGET = fs.readFileSync(path.join(DIR, 'widget.js'), 'utf8');

const SYSTEM = `Sen EMC Jewels'in müşteri asistanısın. Adın "EMC Jewels Asistan". emcjewels.com sitesindeki sohbet penceresinden konuşuyorsun.

GÖREVİN
Ziyaretçilerin sorularını SADECE aşağıdaki BİLGİ'ye dayanarak yanıtlamak: yüzükler, taşlar, burçlar, fiyatlar, ölçüler, kazıma, kargo, iade, yeni ürünler, iletişim. Ziyaretçiye uygun yüzük önerebilirsin (burç, renk, taş, bütçe, erkek/kadın).

KESİN SINIRLAR
- Sipariş ALMA, rezervasyon yapma, ödeme alma, ürün ayırtma, indirim veya özel fiyat sözü verme.
- Ad, telefon, adres, kart bilgisi gibi kişisel veri İSTEME. Kişi kendiliğinden yazarsa kaydetmediğini, sipariş ve kişisel işlemler için iletişim kanallarını kullanmasını söyle.
- Satın almak isteyen kişiye: ürün sayfasını (link) ve iletişim adresini (e-posta) ver. Online ödemenin kurulum aşamasında olduğunu söyleyebilirsin.
- Sipariş durumu, kargo takibi, iade başvurusu, şikâyet gibi kişisel işlemler için iletişim kanallarına yönlendir.
- BİLGİ'de olmayan hiçbir şeyi uydurma (stok, teslim tarihi, kampanya, taş sertifikası, gram vb.). Bilmiyorsan "bu konuda ekibimiz size net bilgi verir" de ve iletişim bilgilerini ver.
- Taş özelliklerini ve burç uyumunu "geleneksel olarak inanılır" diye anlat; sağlık veya tıbbi fayda iddiasında bulunma.
- Konu dışı isteklere (ödev, kod, genel sohbet vb.) kibarca yalnızca EMC Jewels hakkında yardımcı olabildiğini söyle.

ÜSLUP
- "Siz" diye hitap et; zarif, sıcak ve kısa yaz: 1-4 cümle, gerekirse 2-4 maddelik kısa liste. Markdown başlık ve kalın yazı kullanma.
- Ziyaretçi hangi dilde yazarsa o dilde yanıt ver.
- Yüzük önerirken numarasını, adını, taşını ve fiyatını (TL) yaz; ürün bağlantısını (link alanı) ekle. En fazla 3 öneri ver.
- Fiyat verirken fiyatların güncellenebileceğini, en güncel fiyatın ürün sayfasında olduğunu gerekirse belirt.
- Emojiyi çok az kullan.

BİLGİ (JSON)
${KNOWLEDGE}`;

// ---- basit oturum ve hız sınırı (bellekte) ----
const sessions = new Map(); // id -> {msgs:[], t}
const hits = new Map(); // ip -> [timestamps]
const SESSION_TTL = 2 * 3600 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.t > SESSION_TTL) sessions.delete(k);
  for (const [k, v] of hits) { const f = v.filter((t) => now - t < 600000); f.length ? hits.set(k, f) : hits.delete(k); }
}, 600000).unref();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 40; // 10 dakikada en fazla 40 mesaj
}

async function askClaude(messages) {
  if (MOCK) {
    const t = String(messages.at(-1).content).toLocaleLowerCase('tr');
    if (t.includes('sipariş')) return 'Sohbetten sipariş alamıyorum. Ürün sayfasından inceleyip emcjewels@gmail.com adresinden bize ulaşabilirsiniz.';
    return '(mock) Merhaba, ben EMC Jewels Asistan. Yüzüklerimiz, taşlar, ölçü, kargo veya iade hakkında sorabilirsiniz.';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
}

function originOk(o) {
  if (!o) return false;
  if (ORIGINS.includes('*') || ORIGINS.includes(o)) return true;
  try { const h = new URL(o).hostname; return h.endsWith('.claudeusercontent.com') || h === 'localhost' || h === '127.0.0.1'; } catch { return false; }
}
function cors(req, res) {
  const o = req.headers.origin;
  if (originOk(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); }
function readBody(req, max = 8000) {
  return new Promise((ok, bad) => {
    let b = ''; req.on('data', (c) => { b += c; if (b.length > max) { bad(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { bad(e); } });
  });
}

const FALLBACK = 'Şu an yanıt veremiyorum. Bize emcjewels@gmail.com adresinden ulaşabilirsiniz.';

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.pathname === '/health') return json(res, 200, { ok: true, model: MODEL, mock: MOCK, key: !!API_KEY });
  if (url.pathname === '/widget.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' });
    return res.end(WIDGET);
  }
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    if (!originOk(req.headers.origin)) return json(res, 403, { error: 'origin' });
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (limited(ip)) return json(res, 429, { reply: 'Çok sık mesaj gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.' });
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'body' }); }
    const text = String(body.message || '').trim().slice(0, 800);
    if (!text) return json(res, 400, { error: 'empty' });
    let sid = String(body.sessionId || '');
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sid)) sid = crypto.randomBytes(12).toString('hex');
    const s = sessions.get(sid) || { msgs: [], t: Date.now() };
    s.msgs.push({ role: 'user', content: text });
    s.msgs = s.msgs.slice(-20);
    if (s.msgs[0].role !== 'user') s.msgs.shift();
    try {
      if (!API_KEY && !MOCK) throw new Error('ANTHROPIC_API_KEY yok');
      const reply = (await askClaude(s.msgs)) || FALLBACK;
      s.msgs.push({ role: 'assistant', content: reply }); s.t = Date.now(); sessions.set(sid, s);
      return json(res, 200, { reply, sessionId: sid });
    } catch (e) {
      console.error('chat error:', e.message);
      s.msgs.pop();
      return json(res, 200, { reply: FALLBACK, sessionId: sid });
    }
  }
  if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('EMC Jewels Asistan çalışıyor.'); }
  json(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`EMC Jewels Asistan :${PORT} model=${MODEL} mock=${MOCK}`));
