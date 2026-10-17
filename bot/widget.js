// EMC Jewels Asistan — site sohbet penceresi. Kullanım: <script src="https://BOT/widget.js" defer></script>
(() => {
  if (window.__emcChat) return; window.__emcChat = 1;
  const me = document.currentScript || [...document.scripts].find((s) => /widget\.js/.test(s.src));
  const BASE = new URL(me.src).origin, API = BASE + '/api/chat';
  const SITE = /emcjewels\.com$/.test(location.hostname) || location.hostname === 'localhost' ? '' : 'https://emcjewels.com/';
  // Bot hazır değilse (API anahtarı yoksa) pencereyi hiç gösterme
  fetch(BASE + '/health').then((r) => r.json()).then((h) => { if (h && (h.key || h.mock)) init(); }).catch(() => {});

  function init() {
    let RINGS = {};
    fetch(BASE + '/rings').then((r) => r.json()).then((d) => { RINGS = d || {}; }).catch(() => {});
    const en = () => (document.documentElement.lang || 'tr').startsWith('en');
    const T = (tr, e) => (en() ? e : tr);
    const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
    let sid = store.get('emc_chat_sid') || '';
    let hist = []; try { hist = JSON.parse(store.get('emc_chat_hist') || '[]'); } catch (e) { hist = []; }

    const css = `
#emcChatBtn{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:70px;height:70px;padding:0;border-radius:50%;border:2px solid #cdd3dc;background:#0b1430;cursor:pointer;box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 0 5px rgba(205,211,220,.12);transition:transform .25s,box-shadow .25s;animation:emcPulse 3.2s ease-in-out infinite}
#emcChatBtn img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;pointer-events:none;-webkit-user-drag:none}
#emcChatBtn::after{content:"";position:absolute;right:3px;bottom:3px;width:14px;height:14px;border-radius:50%;background:#3ccf7a;border:2px solid #060a14}
#emcChatBtn:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 0 7px rgba(205,211,220,.18);animation:none}
@keyframes emcPulse{0%,100%{box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 0 5px rgba(205,211,220,.12)}50%{box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 0 11px rgba(205,211,220,.04)}}
#emcChatBtn.hide,#emcHint.hide{display:none}
#emcHint{position:fixed;right:104px;bottom:34px;z-index:2147483000;max-width:240px;padding:12px 34px 12px 16px;border-radius:16px 16px 4px 16px;background:rgba(6,10,20,.92);border:1px solid rgba(205,211,220,.4);color:#eef1f6;font:14px/1.4 "Figtree",system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.5);cursor:pointer;opacity:0;transform:translateY(6px);transition:opacity .4s,transform .4s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
#emcHint.on{opacity:1;transform:none}
#emcHint b{display:block;font:500 16px/1.2 "Bodoni Moda",Georgia,serif;margin-bottom:3px}
#emcHint button{position:absolute;top:6px;right:6px;width:24px;height:24px;border:0;background:none;color:#8c94a8;font-size:16px;line-height:1;cursor:pointer;border-radius:50%}
#emcHint button:hover{color:#eef1f6;background:rgba(205,211,220,.1)}
#emcChat .hd .av{width:40px;height:40px;border-radius:50%;object-fit:cover;border:1.5px solid #cdd3dc;flex:none;pointer-events:none}
#emcChat .hd .who{display:flex;flex-direction:column;gap:2px;min-width:0}
#emcChat .hd .who img{height:26px!important}
#emcChat .hd .who small{font:500 10px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#8c94a8;display:flex;align-items:center;gap:6px}
#emcChat .hd .who small::before{content:"";width:7px;height:7px;border-radius:50%;background:#3ccf7a}
#emcChat{--ink:#060a14;--silver:#cdd3dc;--fg:#eef1f6;--muted:#8c94a8;--line:rgba(205,211,220,.18);position:fixed;right:22px;bottom:22px;z-index:2147483001;width:min(420px,calc(100vw - 24px));height:min(680px,calc(100vh - 44px));display:none;flex-direction:column;color:var(--fg);border-radius:22px;overflow:hidden;border:1px solid rgba(205,211,220,.38);box-shadow:0 30px 80px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08);font:15px/1.5 "Figtree",system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(180deg,rgba(6,10,20,.80),rgba(6,10,20,.92)),url(${SITE}img/satin3.jpg) center/cover,#060a14;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transform-origin:bottom right;animation:emcIn .28s cubic-bezier(.2,.8,.2,1)}
@keyframes emcIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
#emcChat.on{display:flex}
#emcChat *{box-sizing:border-box}
#emcChat .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px 14px 20px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(11,20,48,.55),rgba(6,10,20,0))}
#emcChat .hd .brand{display:flex;align-items:center;gap:10px;min-width:0}
#emcChat .hd .brand img{height:40px;width:auto;display:block;pointer-events:none}
#emcChat .hd .tools{display:flex;gap:2px}
#emcChat .hd button{width:36px;height:36px;border-radius:50%;border:0;background:none;color:var(--fg);display:grid;place-items:center;cursor:pointer;opacity:.85;transition:background .2s,opacity .2s}
#emcChat .hd button:hover{background:rgba(205,211,220,.12);opacity:1}
#emcChat .hd button svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#emcChat .hd button.spin svg{animation:emcSpin .6s ease}
@keyframes emcSpin{to{transform:rotate(360deg)}}
#emcLog>*{flex:none}
#emcLog{flex:1;overflow:auto;padding:18px 16px 10px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:rgba(205,211,220,.25) transparent;-webkit-user-select:text;user-select:text}
.emcB{align-self:flex-start;max-width:88%;padding:13px 16px;border-radius:16px;background:rgba(11,20,48,.72);border:1px solid var(--line);white-space:pre-wrap;word-wrap:break-word}
.emcB .ttl{display:block;font:500 25px/1.15 "Bodoni Moda","Didot","Bodoni 72",Georgia,serif;letter-spacing:-.005em;margin:0 0 6px;white-space:normal}
.emcB a{color:var(--silver);text-underline-offset:3px}
.emcU{align-self:flex-end;max-width:84%;padding:11px 14px 7px;border-radius:16px;background:rgba(205,211,220,.13);border:1px solid rgba(205,211,220,.28);white-space:pre-wrap;word-wrap:break-word}
.emcU .tm{display:flex;justify-content:flex-end;align-items:center;gap:4px;font-size:10.5px;color:var(--muted);margin-top:3px}
.emcU .tm svg{width:14px;height:10px;fill:none;stroke:currentColor;stroke-width:1.4}
.emcTyping{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;border-radius:16px;background:rgba(11,20,48,.72);border:1px solid var(--line)}
.emcTyping i{width:6px;height:6px;border-radius:50%;background:var(--silver);opacity:.4;animation:emcDot 1.2s infinite}
.emcTyping i:nth-child(2){animation-delay:.15s}.emcTyping i:nth-child(3){animation-delay:.3s}
@keyframes emcDot{0%,80%,100%{opacity:.25;transform:none}40%{opacity:1;transform:translateY(-3px)}}
.emcRing{display:grid;grid-template-columns:118px 1fr auto;align-items:center;gap:14px;width:100%;min-height:104px;border-radius:14px;overflow:hidden;border:1px solid rgba(205,211,220,.28);background:linear-gradient(90deg,rgba(6,10,20,.2),rgba(11,20,48,.75) 46%);text-decoration:none;color:var(--fg);transition:border-color .2s,transform .2s,background .2s}
.emcRing:hover{border-color:rgba(205,211,220,.65);transform:translateY(-1px)}
.emcRing .ph{align-self:stretch;position:relative;background:#0d1220;overflow:hidden}
.emcRing .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 55%;transform:scale(1.18);pointer-events:none;-webkit-user-drag:none}
.emcRing .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 55%,rgba(11,20,48,.85))}
.emcRing .tx{min-width:0;padding:10px 0}
.emcRing .no{font:600 12px/1 "Bodoni Moda",Georgia,serif;letter-spacing:.06em;color:var(--fg);opacity:.92}
.emcRing .nm{font:500 22px/1.12 "Bodoni Moda","Didot",Georgia,serif;margin:5px 0 6px;letter-spacing:-.005em}
.emcRing .st{font-size:12.5px;color:rgba(238,241,246,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.emcRing .pr{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;color:var(--muted);margin-top:6px;letter-spacing:.04em}
.emcRing .go{padding:0 16px 0 4px;font-size:13px;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid rgba(205,211,220,.6);margin-right:16px;padding:0 0 3px}
.emcRing .one{display:inline-block;font:500 9.5px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;border:1px solid rgba(205,211,220,.5);padding:3px 6px;margin-left:8px;vertical-align:middle}
.emcChips{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start}
.emcChips button{border:1px solid rgba(205,211,220,.6);background:rgba(6,10,20,.4);color:var(--fg);border-radius:999px;padding:9px 18px;font:inherit;font-size:14px;cursor:pointer;transition:background .2s,border-color .2s}
.emcChips button:hover{background:rgba(205,211,220,.16);border-color:var(--silver)}
.emcChips.used button{opacity:.45;pointer-events:none}
#emcChat form{display:flex;align-items:center;gap:8px;margin:8px 14px 6px;padding:6px 6px 6px 18px;border-radius:999px;border:1px solid rgba(205,211,220,.35);background:rgba(6,10,20,.6);transition:border-color .2s}
#emcChat form:focus-within{border-color:var(--silver)}
#emcChat textarea{flex:1;resize:none;height:24px;max-height:96px;background:none;border:0;outline:none;color:var(--fg);font:inherit;padding:0;line-height:24px}
#emcChat textarea::placeholder{color:var(--muted)}
#emcChat form button{flex:none;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;color:#0b1020;background:radial-gradient(120% 120% at 30% 25%,#ffffff 0%,#cdd3dc 45%,#8e97a8 100%);box-shadow:0 4px 14px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.7);transition:transform .15s,opacity .2s}
#emcChat form button:hover{transform:scale(1.05)}
#emcChat form button:disabled{opacity:.5;cursor:default;transform:none}
#emcChat form button svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round;margin-left:-2px}
#emcChat .note{text-align:center;padding:2px 14px 12px;font-size:11px;color:var(--muted)}
@media (max-width:520px){#emcChat{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0;border:0}#emcChatBtn{right:16px;bottom:16px;width:62px;height:62px}#emcHint{right:90px;bottom:24px;max-width:200px}.emcRing{grid-template-columns:96px 1fr auto}.emcRing .nm{font-size:19px}}
@media print{#emcChat,#emcChatBtn{display:none!important}}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    const ICON = {
      chat: '<svg viewBox="0 0 24 24"><path d="M4.5 5.5h15v10.5h-9l-4.5 3.5v-3.5h-1.5z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>',
      min: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
      ref: '<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.5H15"/></svg>',
      x: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
      send: '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/></svg>',
      tick: '<svg viewBox="0 0 16 10"><path d="M1 5l3 3 6-7M6 8l1 1 6-8"/></svg>',
    };

    const btn = document.createElement('button');
    btn.id = 'emcChatBtn'; btn.type = 'button'; btn.innerHTML = `<img src="${SITE}img/assistant.jpg" alt="">`;
    const hint = document.createElement('div'); hint.id = 'emcHint';
    const box = document.createElement('div');
    box.id = 'emcChat'; box.setAttribute('role', 'dialog');
    box.innerHTML = `<div class="hd"><div class="brand"><img class="av" src="${SITE}img/assistant.jpg" alt=""><span class="who"><img src="${SITE}img/wordmark.png" alt="EMC Jewels"><small></small></span></div>
<div class="tools"><button type="button" data-a="ref">${ICON.ref}</button><button type="button" data-a="min">${ICON.min}</button><button type="button" data-a="x">${ICON.x}</button></div></div>
<div id="emcLog" aria-live="polite"></div>
<form><textarea rows="1" maxlength="800"></textarea><button type="submit">${ICON.send}</button></form><div class="note"></div>`;
    document.body.append(hint, btn, box);
    const log = box.querySelector('#emcLog'), ta = box.querySelector('textarea'), send = box.querySelector('form button');

    const labels = () => {
      btn.setAttribute('aria-label', T('Sohbeti aç', 'Open chat'));
      box.setAttribute('aria-label', T('EMC Jewels Asistan', 'EMC Jewels Assistant'));
      const [r, m, x] = box.querySelectorAll('.tools button');
      r.title = r.ariaLabel = T('Sohbeti yenile', 'Restart chat');
      m.title = m.ariaLabel = T('Küçült', 'Minimise');
      x.title = x.ariaLabel = T('Kapat', 'Close');
      box.querySelector('.who small').textContent = T('Asistan · Çevrimiçi', 'Assistant · Online');
      ta.placeholder = T('Bir soru sorun…', 'Ask a question…');
      send.setAttribute('aria-label', T('Gönder', 'Send'));
      box.querySelector('.note').textContent = T('Asistan sipariş almaz; sorularınızı yanıtlar.', 'The assistant answers questions; it does not take orders.');
    };

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (u) => {
      let same = false; try { same = new URL(u.replace(/&amp;/g, '&')).hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, ''); } catch (e) {}
      return `<a href="${u}"${same ? '' : ' target="_blank" rel="noopener"'}>${u.replace(/^https?:\/\/(www\.)?/, '')}</a>`;
    });
    const fmtTL = (n) => '₺' + Number(n).toLocaleString('tr-TR');
    const scroll = () => { log.scrollTop = log.scrollHeight; };
    const now = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    function ringCard(id) {
      const r = RINGS[id];
      const a = document.createElement('a');
      a.className = 'emcRing'; a.href = `${SITE || location.pathname}#r=${id}`;
      const name = r ? r.name : id, no = r ? r.no : '';
      a.innerHTML = `<span class="ph"><img src="${SITE}img/d_${esc(id)}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>
<span class="tx"><span class="no">${esc(no)}</span>${r && r.one ? '<span class="one">Only one</span>' : ''}<span class="nm" style="display:block">${esc(name)}</span><span class="st" style="display:block">${r ? esc(r.stone + ' · ' + r.material) : ''}</span>${r && r.price ? `<span class="pr" style="display:block">${fmtTL(r.price)}</span>` : ''}</span>
<span class="go">${T('İncele', 'View')} ↗</span>`;
      return a;
    }

    // Bot yanıtını parçalara ayır: [[title:..]] [[ring:id]] [[chips:a|b]] ve düz metin
    function renderBot(text, fresh) {
      const parts = String(text).split(/(\[\[(?:title|ring|chips):[^\]]*\]\])/g).map((s) => s.trim()).filter(Boolean);
      let bubble = null;
      const textBubble = () => { if (!bubble) { bubble = document.createElement('div'); bubble.className = 'emcB'; log.appendChild(bubble); } return bubble; };
      for (const p of parts) {
        let m;
        if ((m = p.match(/^\[\[title:(.*)\]\]$/))) { const b = textBubble(); b.insertAdjacentHTML('beforeend', `<span class="ttl">${esc(m[1].trim())}</span>`); }
        else if ((m = p.match(/^\[\[ring:\s*([a-z]\d+)\s*\]\]$/i))) { bubble = null; log.appendChild(ringCard(m[1].toLowerCase())); }
        else if ((m = p.match(/^\[\[chips:(.*)\]\]$/))) {
          bubble = null;
          const wrap = document.createElement('div'); wrap.className = 'emcChips' + (fresh ? '' : ' used');
          m[1].split('|').map((s) => s.trim()).filter(Boolean).slice(0, 4).forEach((c) => {
            const b = document.createElement('button'); b.type = 'button'; b.textContent = c;
            b.onclick = () => { wrap.classList.add('used'); ask(c); };
            wrap.appendChild(b);
          });
          log.appendChild(wrap);
        } else { const b = textBubble(); b.insertAdjacentHTML('beforeend', (b.childNodes.length ? '' : '') + linkify(p)); }
      }
      scroll();
    }
    function renderUser(text, time) {
      const d = document.createElement('div'); d.className = 'emcU';
      d.innerHTML = `${esc(text)}<span class="tm">${esc(time || now())}${ICON.tick}</span>`;
      log.appendChild(d); scroll();
    }

    const greeting = () => T(
      '[[title:Hoş geldiniz.]]\nBen EMC Jewels Asistan. Yüzüklerimiz, taşlar, burçlar, ölçü, kargo ve iade hakkında merak ettiklerinizi sorabilirsiniz.\n[[chips:Erkek yüzükleri|Kadın yüzükleri|Burcuma göre öner|Kargo ve iade]]',
      "[[title:Welcome.]]\nI'm the EMC Jewels Assistant. Ask me about our rings, stones, zodiac signs, sizing, shipping or returns.\n[[chips:Men's rings|Women's rings|Pick by my sign|Shipping & returns]]");

    const save = () => store.set('emc_chat_hist', JSON.stringify(hist.slice(-40)));
    function replay() {
      log.innerHTML = '';
      if (!hist.length) { renderBot(greeting(), true); return; }
      renderBot(greeting(), false);
      hist.forEach((h, i) => (h.r === 'u' ? renderUser(h.t, h.tm) : renderBot(h.t, i === hist.length - 1)));
    }

    let opened = false;
    const hideHint = () => { hint.classList.remove('on'); setTimeout(() => hint.classList.add('hide'), 400); store.set('emc_hint_off', '1'); };
    const open = () => { hideHint(); labels(); if (!opened) { opened = true; replay(); } box.classList.add('on'); btn.classList.add('hide'); setTimeout(() => { ta.focus(); scroll(); }, 60); };
    const hide = () => { box.classList.remove('on'); btn.classList.remove('hide'); };
    labels(); btn.setAttribute('title', T('EMC Jewels Asistan ile yazışın', 'Chat with the EMC Jewels Assistant'));
    hint.innerHTML = `<b>${T('Merhaba!', 'Hello!')}</b>${T('Yüzüklerimizle ilgili sorunuz mu var? Bana yazın.', 'Questions about our rings? Write to me.')}<button type="button" aria-label="${T('Kapat', 'Close')}">×</button>`;
    hint.onclick = (e) => { if (e.target.closest('button')) { e.stopPropagation(); hideHint(); } else open(); };
    if (store.get('emc_hint_off')) hint.classList.add('hide'); else setTimeout(() => { if (!box.classList.contains('on')) hint.classList.add('on'); }, 2500);
    const restart = () => {
      hist = []; sid = ''; store.del('emc_chat_hist'); store.del('emc_chat_sid');
      const r = box.querySelector('[data-a="ref"]'); r.classList.remove('spin'); void r.offsetWidth; r.classList.add('spin');
      replay(); ta.value = ''; ta.focus();
    };
    btn.onclick = open;
    box.querySelector('.tools').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'ref') restart(); else hide();
    });
    box.addEventListener('click', (e) => {
      const a = e.target.closest('a'); if (!a || !a.hash || !a.hash.startsWith('#r=')) return;
      if (a.hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, '')) { e.preventDefault(); hide(); location.hash = a.hash; }
    });
    ta.addEventListener('input', () => { ta.style.height = '24px'; ta.style.height = Math.min(96, ta.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); box.querySelector('form').requestSubmit(); } });
    box.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const q = ta.value.trim(); if (q) { ta.value = ''; ta.style.height = '24px'; ask(q); } });

    async function ask(q) {
      if (send.disabled) return;
      log.querySelectorAll('.emcChips:not(.used)').forEach((c) => c.classList.add('used'));
      const tm = now();
      renderUser(q, tm); hist.push({ r: 'u', t: q, tm }); save();
      send.disabled = true;
      const typing = document.createElement('div'); typing.className = 'emcTyping'; typing.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(typing); scroll();
      let reply;
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: q, sessionId: sid }) });
        const d = await r.json();
        if (d.sessionId) { sid = d.sessionId; store.set('emc_chat_sid', sid); }
        reply = d.reply || T('Bir sorun oluştu, lütfen tekrar deneyin.', 'Something went wrong, please try again.');
      } catch (err) {
        reply = T('Bağlantı kurulamadı. emcjewels@gmail.com adresinden bize ulaşabilirsiniz.', 'Could not connect. You can reach us at emcjewels@gmail.com.');
      }
      typing.remove(); renderBot(reply, true); hist.push({ r: 'b', t: reply }); save();
      send.disabled = false; ta.focus();
    }
  }
})();
