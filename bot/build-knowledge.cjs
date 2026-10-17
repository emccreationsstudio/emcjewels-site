// Sitenin index.html'indeki ürün verisinden botun bilgi dosyasını (knowledge.json) üretir.
// Kullanım: node bot/build-knowledge.cjs   (fiyat/ürün değişince tekrar çalıştır)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const code = s.slice(s.indexOf('const ZOD='), s.indexOf('const ALL=')) + '\n;globalThis.__out={R,W};';
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const { R, W } = ctx.__out;
const VIDEO = new Set(R.map(r => r.id));
const pick = (r) => ({
  id: r.id, no: 'N°' + String(r.n).padStart(2, '0'), name: r.name, tr_name: r.tr,
  collection: r.g === 'm' ? 'Erkek' : 'Kadın', stone: r.stone, stone_short: r.sname, material: r.mat,
  style: r.style, color: r.col, price_tl: r.p, only_one: !!r.one, zodiac: r.z,
  properties: r.props || [], story: r.story || '', motto: r.q || '',
  link: `https://emcjewels.com/#r=${r.id}`, has_video: VIDEO.has(r.id),
});
const K = {
  brand: 'EMC Jewels',
  about: 'El yapımı, 925 ayar gümüş, doğal taşlı yüzükler. İstanbul. Erkek ve kadın koleksiyonları. Kadın modellerin çoğu altın kaplama. İç yüzeye isim ve tarih kazıma seçeneği (en fazla 20 karakter).',
  site: 'https://emcjewels.com',
  contact: { email: 'emcjewels@gmail.com', address: 'Maslak Mah. Ahi Evran Cad. Nazmi Akbacı Ticaret Merkezi No: 5 İç Kapı No: 270, Sarıyer / İstanbul' },
  company: 'Evolution Media Center Yapımcılık Organizasyon Ticaret Ltd. Şti.',
  sizes: { erkek: '16–30 (Türkiye ölçüsü)', kadın: '10–22 (Türkiye ölçüsü)', tip: 'Ölçüsünü bilmeyen, parmağına uyan bir yüzüğü bir kuyumcuda ölçtürebilir ya da ince bir iple parmak çevresini ölçüp milimetre olarak bize iletebilir.' },
  prices_note: 'Fiyatlar KDV dahil Türk lirasıdır; dolar karşılığı bilgi amaçlıdır. Fiyatlar güncellenebilir, en güncel fiyat ürün sayfasındadır.',
  payment: 'Online ödeme altyapısı (iyzico, kredi/banka kartı) kurulum aşamasındadır. Şu an sipariş ve satın alma için e-posta ile iletişime geçilmelidir.',
  shipping: { stock: 'Stoktaki ürünler sipariş onayından sonra 3–7 iş günü içinde kargoya verilir.', custom: 'Kazımalı ve ölçüye özel ürünler 5–10 iş günü içinde kargoya verilir.', max: 'Yasal en geç teslim süresi 30 gün.', area: 'Şu an yalnızca Türkiye içine gönderim. Ürünler EMC Jewels kutusunda gönderilir.', page: 'https://emcjewels.com/yasal/teslimat.html' },
  returns: { right: 'Teslimden itibaren 14 gün içinde gerekçesiz cayma/iade hakkı. Anlaşmalı kargoyla iadede kargo ücreti EMC Jewels\'e aittir. Bedel 14 gün içinde karta iade edilir.', exceptions: 'İç yüzeyine kazıma yapılan ve talebe göre özel ölçüde üretilen ürünler kişiye özel olduğu için iade edilemez (ayıplı ürün hakları saklıdır).', size_exchange: 'Kazımasız ve kullanılmamış ürünlerde ölçü değişimi için teslimden itibaren 14 gün içinde iletişime geçilebilir; stok ve üretim durumuna göre yapılır.', natural_stones: 'Doğal taşlarda renk ve desen farklılıkları taşın doğasından kaynaklanır, ayıp sayılmaz.', page: 'https://emcjewels.com/yasal/iade.html' },
  only_one: '"Only one" ibareli ürünler tek adettir.',
  videos: 'Erkek yüzüklerinin ürün sayfasında kutuda ve elde çekilmiş videoları vardır.',
  coming_soon: { text: 'Yakında yeni ürünler: N°01, N°02 ve N°03 kolye, N°04 yüzük. Ana sayfadaki talep formundan ürün numarasıyla ön talep bırakılabilir.', link: 'https://emcjewels.com/#talep' },
  newsletter: { text: 'Yeni ürünlerden haberdar olmak için sayfanın sonundaki bültene e-posta ile kaydolunabilir.', link: 'https://emcjewels.com/#bulten' },
  legal: { kvkk: 'https://emcjewels.com/yasal/kvkk.html', mesafeli_satis: 'https://emcjewels.com/yasal/mesafeli-satis.html', gizlilik: 'https://emcjewels.com/yasal/gizlilik.html' },
  stone_beliefs_note: 'Taş özellikleri ve burç bilgileri geleneksel inanışlara dayanır; bilimsel veya tıbbi iddia değildir.',
  rings: [...R, ...W].map(pick),
};
fs.writeFileSync(path.join(__dirname, 'knowledge.json'), JSON.stringify(K, null, 1));
console.log('knowledge.json:', K.rings.length, 'yüzük');
