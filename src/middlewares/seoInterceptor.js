import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Article from '../models/article.model.js';
import Settings from '../models/settings.model.js';
import { getSettings } from '../services/settings.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to the frontend template
const DIST_PATH = path.resolve(__dirname, '../../../tool-hub-frontend/dist');
const DIST_INDEX_PATH = path.join(DIST_PATH, 'index.html');
const DEV_INDEX_PATH = path.resolve(__dirname, '../../../tool-hub-frontend/index.html');

// In-memory cache for the base abstract template
let baseTemplate = null;
let lastTemplateReadTime = 0;

function getBaseTemplate() {
  const now = Date.now();
  // Refresh cache every 10 minutes to pick up new frontend builds without restarting backend
  if (baseTemplate && (now - lastTemplateReadTime < 600000)) {
    return baseTemplate;
  }

  try {
    if (fs.existsSync(DIST_INDEX_PATH)) {
      baseTemplate = fs.readFileSync(DIST_INDEX_PATH, 'utf-8');
    } else if (fs.existsSync(DEV_INDEX_PATH)) {
      baseTemplate = fs.readFileSync(DEV_INDEX_PATH, 'utf-8');
    } else {
      return null;
    }
    lastTemplateReadTime = now;
    return baseTemplate;
  } catch (error) {
    console.error("Error reading index.html template:", error);
    return null;
  }
}

export const seoInterceptor = async (req, res, next) => {
  // If it's an API call, skip it completely.
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
    return next();
  }

  // If this handles a static asset request (like .js, .css, .png, etc.), pass it onto express.static
  // since this interceptor only cares about HTML page loads.
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') {
    return next();
  }

  const template = getBaseTemplate();
  if (!template) {
    // If we absolutely cannot find the frontend, just pass to 404
    return next();
  }

  try {
    let finalHtml = template;
    const routePath = req.path; // e.g., "/tools/split-pdf"

    // Fetch site settings for marketing scripts
    const settings = await getSettings();
    const marketing = settings?.marketing || {};

    // ── MARKETING SCRIPT INJECTION ──────────────────────────────────────────

    // 1. Google Analytics (gtag.js) - Top of <head>
    if (marketing.googleAnalyticsId) {
      const gaScript = `
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${marketing.googleAnalyticsId}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${marketing.googleAnalyticsId}');
        </script>
      `;
      finalHtml = finalHtml.replace('<head>', `<head>${gaScript}`);
    }

    // 2. Google Tag Manager (GTM) - Top of <head>
    if (marketing.googleTagManagerId) {
      const gtmHeadScript = `
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${marketing.googleTagManagerId}');</script>
        <!-- End Google Tag Manager -->
      `;
      finalHtml = finalHtml.replace('<head>', `<head>${gtmHeadScript}`);
    }

    // 3. Meta Pixel - Top of <head>
    if (marketing.metaPixelId) {
      const pixelScript = `
        <!-- Meta Pixel Code -->
        <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${marketing.metaPixelId}');
        fbq('track', 'PageView');
        </script>
        <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${marketing.metaPixelId}&ev=PageView&noscript=1"
        /></noscript>
        <!-- End Meta Pixel Code -->
      `;
      finalHtml = finalHtml.replace('<head>', `<head>${pixelScript}`);
    }

    // 4. Custom Header Scripts
    if (marketing.headerScripts) {
      finalHtml = finalHtml.replace('</head>', `${marketing.headerScripts}</head>`);
    }

    // 5. GTM Noscript - Top of <body>
    if (marketing.googleTagManagerId) {
      const gtmBodyScript = `
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${marketing.googleTagManagerId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
      `;
      finalHtml = finalHtml.replace('<body>', `<body>${gtmBodyScript}`);
    }

    // 6. Custom Footer Scripts
    if (marketing.footerScripts) {
      finalHtml = finalHtml.replace('</body>', `${marketing.footerScripts}</body>`);
    }

    // ── DYNAMIC SEO TAGS (ARTICLES) ─────────────────────────────────────────

    // Search for a dynamic article by the route path
    const article = await Article.findOne({ 
      routePath: routePath,
      status: "published" // Assuming you only want published SEO tags
    }).lean();

    // Or try without status if status field isn't reliably used
    const articleFallback = article || await Article.findOne({ routePath: routePath }).lean();

    if (articleFallback && articleFallback.seoMetadata) {
      const { metaTitle, metaDescription } = articleFallback.seoMetadata;

      // Extract raw text from rich-text description if metaDescription is empty
      const rawDescription = articleFallback.description 
        ? articleFallback.description.replace(/<[^>]*>?/gm, '').trim()
        : "";

      const titleToInject = metaTitle || articleFallback.title || "thedapachecker";
      const descToInject = metaDescription || rawDescription;

      // 1. Replace <title>
      finalHtml = finalHtml.replace(
        /<title>.*?<\/title>/gi,
        `<title>${titleToInject}</title>`
      );

      // 2. Replace <meta name="title">
      finalHtml = finalHtml.replace(
        /<meta\s+name=["']title["']\s+content=["'][^"']*["']\s*\/?>/gi,
        `<meta name="title" content="${titleToInject}" />`
      );

      // 3. Replace <meta name="description">
      if (descToInject) {
        finalHtml = finalHtml.replace(
          /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/gi,
          `<meta name="description" content="${descToInject}" />`
        );
      }

      // 4. Replace og:title
      finalHtml = finalHtml.replace(
        /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/gi,
        `<meta property="og:title" content="${titleToInject}" />`
      );

      // 5. Replace twitter:title
      finalHtml = finalHtml.replace(
        /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/gi,
        `<meta name="twitter:title" content="${titleToInject}" />`
      );

      // 6. Replace og:description and twitter:description
      if (descToInject) {
        finalHtml = finalHtml.replace(
          /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/gi,
          `<meta property="og:description" content="${descToInject}" />`
        );
        finalHtml = finalHtml.replace(
          /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/gi,
          `<meta name="twitter:description" content="${descToInject}" />`
        );
      }
    }

    // Send the correctly injected HTML immediately!
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(finalHtml);
  } catch (error) {
    console.error("SEO Interceptor Error:", error);
    // On failure, send the default static template gracefully
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(template);
  }
};
