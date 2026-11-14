/* مخصوص سایت aratzareii.ir — این فایل روی سایت باز نمی‌شود؛ فقط کد ورکر کلودفلر است.
   Deploy on Cloudflare: Workers & Pages → Create → Worker → paste this file →
   Settings → Variables: LLM_BASE_URL=https://developer.amd.com.cn/radeon/api/v1 ,
   LLM_MODEL=MiniCPM-V-4.7-35B-A3B , LLM_API_KEY=<your key> (Encrypt) → Deploy. */
/**
 * آرات — چت هوش مصنوعی سایت روی Cloudflare Worker
 * Arat's site chat endpoint, runs on a free Cloudflare Worker:
 * the API key lives in the Worker's env (never in the page), CORS is handled here.
 *
 * Deploy (dashboard): Workers & Pages → Create → Worker → paste this file →
 *   Settings → Variables: LLM_BASE_URL, LLM_MODEL, LLM_API_KEY (encrypt this one) → Deploy.
 * Deploy (wrangler): wrangler deploy arat-chat-worker.js --name arat-chat
 * Then point the site widget at https://arat-chat.<account>.workers.dev :
 *   <script>window.ARAT_CHAT_API = 'https://arat-chat.<account>.workers.dev';</script>
 *
 * Free tier: 100k requests/day — far beyond what a portfolio site sees.
 * With no LLM_API_KEY set it falls back to the keyless free model.
 */

const DEFAULT_BASE = 'https://developer.amd.com.cn/radeon/api/v1';
const DEFAULT_MODEL = 'MiniCPM-V-4.7-35B-A3B';
const FALLBACK_MODELS = ['GLM-5.3-Flash', 'DeepSeek-V4-Flash', 'Gemma-4-31B-IT'];

const FACTS_FA = `اطلاعات واقعی درباره آرات زارعی و کارش (فقط از همین‌ها جواب بده):
- آرات زارعی، طراح و توسعه‌دهندهٔ وب و ربات تلگرام. پروژه‌ها را تک‌نفره جلو می‌برد (صحبت، طراحی، کد، تحویل).
- خدمات: ۱) توسعهٔ وب — پورتفولیو، سایت شرکتی، فروشگاهی، لندینگ، پنل مدیریت؛ فرانت و بک، ریسپانسیو و کد تمیز.
  ۲) ربات و مینی‌اپ تلگرام — بات فروش و پشتیبانی، پرداخت آنلاین، سبد خرید، پنل ادمین.
  ۳) اتصال به هوش مصنوعی و اتوماسیون — مدل‌های متن/تصویر/ویدیو روی سایت و بات.
  ۴) سرعت و سئو — سئوی فنی، نمایش درست روی موبایل، بارگذاری سریع، دامنهٔ اختصاصی و SSL.
- نمونه‌کارها: Diaz Shop (فروشگاه تلگرامی با مینی‌اپ، سبد خرید و پرداخت آنلاین)، ربات هوش مصنوعی Gorilla AI (ساخت عکس و ویدیو و پشتیبانی خودکار)، و همین سایت شخصی/پورتفولیو.
- مراحل کار: ۱) نیازسنجی و نقشهٔ کار ۲) طراحی و نمونهٔ اولیه قبل از کدنویسی ۳) توسعه، تحویل روی دامنهٔ خود مشتری و پشتیبانی بعد از انتشار.
- قیمت: اول نیاز بررسی می‌شود، بعد پیشنهاد دقیق و قیمت شفاف قبل از شروع کار گفته می‌شود. هیچ عدد یا تخمین قیمتی نده.
- زمان تحویل: بسته به حجم کار است؛ زمان‌بندی شفاف همان اول گفته می‌شود. تاریخ قطعی وعده نده.
- مالکیت: دامنه، سورس کد، SSL و همهٔ دسترسی‌ها کامل تحویل مشتری می‌شود.
- هاست: با هم انتخاب می‌کنند؛ آرات می‌گوید چه بخرند و ستاپ کامل با خودش است.
- پشتیبانی بعد از لانچ: آپدیت و رفع اشکال، معمولاً همان روز.
- تماس: تلگرام @KhodeArat (سریع‌ترین راه)، ایمیل aratzarei@gmail.com، اینستاگرام iarawt.
قواعد پاسخ:
- فارسی محاوره‌ای و مؤدب، کوتاه و مفید (۲ تا ۴ جمله). بدون فهرست بلند و بدون من‌من کردن.
- فقط از اطلاعات بالا جواب بده. اگر چیزی را نمی‌دانی بگو «دقیق نمی‌دانم» و راه تماس بده.
- هیچ‌وقت از طرف آرات تعهد قیمت، تخفیف یا تاریخ قطعی نده.
- اگر پرسیدند تو رباتی یا آدم؟ صادق باش: «من دستیار هوش مصنوعی سایت آرات هستم؛ برای توافق نهایی خودِ آرات در تلگرام جواب می‌دهد.»
- سؤال بی‌ربط (سیاست، مسائل شخصی، تکالیف درسی، کد طولانی) را کوتاه رد کن و به کار آرات برگردان.`;

const FACTS_EN = `Real facts about Arat Zarei and his work (answer only from these):
- Arat Zarei, web & Telegram bot developer. He runs projects solo (talk, design, code, delivery).
- Services: 1) Web development — portfolios, business sites, stores, landing pages, admin panels; front + back end, responsive, clean code.
  2) Telegram bots & mini apps — sales and support bots, online payment, cart, admin panel.
  3) AI integration & automation — text/image/video models wired into sites and bots.
  4) Speed & SEO — technical SEO, correct mobile rendering, fast loading, custom domain and SSL.
- Work: Diaz Shop (Telegram store with a mini app, cart and online payment), Gorilla AI (AI bot that makes images/videos and answers automatically), and this personal portfolio site.
- Process: 1) requirements & plan 2) design and a first prototype before coding 3) build, delivery on the client's own domain, and post-launch support.
- Price: scope first, then an exact offer and a clear price before work starts. Never quote a number or estimate.
- Timing: depends on the scope; a clear schedule is given up front. Never promise a fixed deadline.
- Ownership: domain, source code, SSL and all access are handed over fully.
- Hosting: picked together — Arat says exactly what to buy and sets it up.
- Post-launch support: updates and fixes, usually the same day.
- Contact: Telegram @KhodeArat (fastest), email aratzarei@gmail.com, Instagram iarawt.
Answer rules:
- Friendly, concise (2-4 sentences), in English, no long bullet lists.
- Only answer from the facts above. If you don't know, say so and give the contact.
- Never commit to a price, discount or firm deadline on Arat's behalf.
- If asked whether you're a bot or human, be honest: "I'm the AI assistant on Arat's site; for a final agreement Arat himself replies on Telegram."
- Off-topic requests (politics, personal matters, homework, long code) — decline briefly and steer back to Arat's work.`;

const ALLOWED_ORIGINS = ['https://aratzareii.ir', 'https://www.aratzareii.ir'];

// per-isolate soft limiter (resets with the isolate; good enough as a speed bump)
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const PER_IP = 20;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, origin);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const hits = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    if (hits.length >= PER_IP) {
      return json({ error: 'rate-limit', reply: 'تعداد پیام‌ها زیاد شد؛ چند دقیقه بعد دوباره امتحان کن یا مستقیم به آرات پیام بده: @KhodeArat' },
        429, origin);
    }
    hits.push(now);
    HITS.set(ip, hits);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, origin); }
    const lang = String(body.lang || 'fa').toLowerCase().startsWith('en') ? 'en' : 'fa';
    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-8)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 900) }))
      .filter((m) => m.content.trim());
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'no user message' }, 400, origin);

    const base = (env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
    const model = env.LLM_MODEL || DEFAULT_MODEL;
    const headers = { 'Content-Type': 'application/json' };
    if (env.LLM_API_KEY) headers['Authorization'] = 'Bearer ' + env.LLM_API_KEY;

    let reply = '';
    try {
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: lang === 'fa' ? FACTS_FA : FACTS_EN }, ...msgs],
          max_tokens: Number(env.MAX_TOKENS || 500),
          temperature: 0.4,
        }),
      });
      const data = await r.json();
      const m = (data.choices && data.choices[0] && data.choices[0].message) || {};
      reply = (m.content || m.reasoning_content || '').trim();
    } catch (e) {
      reply = '';
    }

    if (!reply) {
      reply = lang === 'fa'
        ? 'الان نتونستم جواب بدم؛ لطفاً چند لحظه بعد دوباره بپرس یا مستقیم به آرات پیام بده: @KhodeArat'
        : "I couldn't answer just now — please try again in a moment, or message Arat directly: @KhodeArat";
    }
    return json({ reply, model }, 200, origin);
  },
};
