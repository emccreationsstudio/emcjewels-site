// EMC Jewels Asistan — site sohbet balonu. Kullanım: <script src="https://BOT/widget.js" defer></script>
(() => {
  if (window.__emcChat) return; window.__emcChat = 1;
  const me = document.currentScript || [...document.scripts].find((s) => /widget\.js/.test(s.src));
  const BASE = new URL(me.src).origin, API = BASE + '/api/chat';
  // Bot hazır değilse (API anahtarı yoksa) balonu hiç gösterme
  fetch(BASE + '/health').then((r) => r.json()).then((h) => { if (h && (h.key || h.mock)) init(); }).catch(() => {});
  function init() {
  const en = () => (document.documentElement.lang || 'tr').startsWith('en');
  const T = (tr, e) => (en() ? e : tr);
  let sid = ''; try { sid = sessionStorage.getItem('emc_chat_sid') || ''; } catch (e) {}

  const css = `
#emcChatBtn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:58px;height:58px;border-radius:50%;border:1px solid rgba(205,211,220,.55);background:#0b1430;color:#eef1f6;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45);transition:transform .2s,background .2s}
#emcChatBtn:hover{transform:translateY(-2px);background:#13245a}
#emcChatBtn svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.5}
#emcChat{position:fixed;right:20px;bottom:90px;z-index:2147483000;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 120px));display:none;flex-direction:column;background:#060a14;color:#eef1f6;border:1px solid rgba(205,211,220,.3);box-shadow:0 24px 60px rgba(0,0,0,.6);font:15px/1.5 "Figtree",system-ui,-apple-system,"Segoe UI",sans-serif}
#emcChat.on{display:flex}
#emcChat header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;background:#cdd3dc;color:#060a14}
#emcChat header b{font:500 18px/1.1 "Bodoni Moda","Didot",Georgia,serif;letter-spacing:.01em}
#emcChat header small{display:block;font:500 10px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;opacity:.7;margin-top:3px}
#emcChat header button{background:none;border:0;color:#060a14;font-size:22px;line-height:1;cursor:pointer;padding:4px 6px}
#emcLog{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px;-webkit-user-select:text;user-select:text}
.emcM{max-width:86%;padding:10px 13px;white-space:pre-wrap;word-wrap:break-word}
.emcM.b{align-self:flex-start;background:#0b1430;border:1px solid rgba(205,211,220,.14)}
.emcM.u{align-self:flex-end;background:#cdd3dc;color:#060a14}
.emcM a{color:#cdd3dc;text-underline-offset:3px}
.emcM.typing{opacity:.6;font-style:italic}
#emcChat form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(205,211,220,.14)}
#emcChat textarea{flex:1;resize:none;height:44px;max-height:110px;background:#0b1430;color:#eef1f6;border:1px solid rgba(205,211,220,.25);padding:11px 12px;font:inherit;outline:none}
#emcChat textarea:focus{border-color:#cdd3dc}
#emcChat form button{background:#cdd3dc;color:#060a14;border:0;padding:0 16px;font:600 12px/1 "Figtree",sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
#emcChat form button:disabled{opacity:.5;cursor:default}
#emcChat .note{padding:0 14px 10px;font-size:11px;color:#8c94a8}
@media (max-width:520px){#emcChat{right:12px;bottom:84px;height:calc(100vh - 110px)}#emcChatBtn{right:14px;bottom:14px}}
@media print{#emcChat,#emcChatBtn{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const btn = document.createElement('button');
  btn.id = 'emcChatBtn'; btn.type = 'button';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>';
  const box = document.createElement('div');
  box.id = 'emcChat'; box.setAttribute('role', 'dialog');
  box.innerHTML = `<header><div><b>EMC Jewels</b><small></small></div><button type="button" aria-label="Kapat">×</button></header>
<div id="emcLog" aria-live="polite"></div>
<form><textarea rows="1" maxlength="800"></textarea><button type="submit"></button></form><div class="note"></div>`;
  document.body.append(btn, box);
  const log = box.querySelector('#emcLog'), ta = box.querySelector('textarea'), send = box.querySelector('form button');

  const labels = () => {
    btn.setAttribute('aria-label', T('Sohbeti aç', 'Open chat'));
    box.setAttribute('aria-label', T('EMC Jewels Asistan', 'EMC Jewels Assistant'));
    box.querySelector('small').textContent = T('Asistan · Sorularınız için', 'Assistant · Ask us anything');
    ta.placeholder = T('Sorunuzu yazın…', 'Type your question…');
    send.textContent = T('Gönder', 'Send');
    box.querySelector('.note').textContent = T('Asistan sipariş almaz; sorularınızı yanıtlar.', 'The assistant answers questions; it does not take orders.');
  };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (u) => {
    let same = false; try { same = new URL(u.replace(/&amp;/g, '&')).hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, ''); } catch (e) {}
    return `<a href="${u}"${same ? '' : ' target="_blank" rel="noopener"'}>${u.replace(/^https?:\/\/(www\.)?/, '')}</a>`;
  });
  const add = (who, text) => { const d = document.createElement('div'); d.className = 'emcM ' + who; d.innerHTML = linkify(text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };

  let greeted = false;
  const open = () => {
    labels(); box.classList.add('on');
    if (!greeted) { greeted = true; add('b', T('Merhaba, ben EMC Jewels Asistan. Yüzüklerimiz, taşlar, burçlar, ölçü, kargo veya iade hakkında merak ettiklerinizi sorabilirsiniz.', 'Hello, I\'m the EMC Jewels Assistant. Ask me about our rings, stones, zodiac signs, sizing, shipping or returns.')); }
    setTimeout(() => ta.focus(), 50);
  };
  btn.onclick = () => (box.classList.contains('on') ? box.classList.remove('on') : open());
  box.querySelector('header button').onclick = () => box.classList.remove('on');
  box.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a && a.hash && a.hash.startsWith('#r=') && a.hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, '')) { e.preventDefault(); box.classList.remove('on'); location.hash = a.hash; } });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); box.querySelector('form').requestSubmit(); } });
  box.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = ta.value.trim(); if (!q || send.disabled) return;
    ta.value = ''; add('u', q); send.disabled = true;
    const w = add('b typing', T('Yazıyor…', 'Typing…'));
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: q, sessionId: sid }) });
      const d = await r.json();
      if (d.sessionId) { sid = d.sessionId; try { sessionStorage.setItem('emc_chat_sid', sid); } catch (e) {} }
      w.remove(); add('b', d.reply || T('Bir sorun oluştu, lütfen tekrar deneyin.', 'Something went wrong, please try again.'));
    } catch (err) {
      w.remove(); add('b', T('Bağlantı kurulamadı. emcjewels@gmail.com adresinden bize ulaşabilirsiniz.', 'Could not connect. You can reach us at emcjewels@gmail.com.'));
    }
    send.disabled = false; ta.focus();
  });
  }
})();
