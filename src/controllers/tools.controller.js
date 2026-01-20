import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { spawn } from "child_process";
import axios from "axios";
import * as cheerio from "cheerio";
import http from "http";
import https from "https";
import { URL } from "url";

export const backlinkChecker = asyncHandler(async (req, res) => {
  const { domain, limit = 10 } = req.body;
  if (!domain) {
    return res.status(400).json(new ApiResponse(400, null, "Domain is required"));
  }
  try {
    const query = encodeURIComponent(`"${domain}" -site:${domain}`);
    const searchUrl = `https://www.bing.com/search?q=${query}&count=${limit}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36"
      }
    });
    const $ = cheerio.load(data);
    const resultUrls = [];
    $("li.b_algo h2 a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) resultUrls.push(href);
    });
    const backlinks = [];
    for (const referringUrl of resultUrls) {
      try {
        const page = await axios.get(referringUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36"
          },
          timeout: 10000
        });
        const $$ = cheerio.load(page.data);
        $$("a[href]").each((_, a) => {
          const href = $$(a).attr("href") || "";
          if (href.includes(domain)) {
            const anchorText = ($$(a).text() || "").trim();
            backlinks.push({ referringUrl, anchorText });
          }
        });
      } catch {
      }
      if (backlinks.length >= limit) break;
    }
    res.status(200).json(new ApiResponse(200, { backlinks }, "Backlinks fetched"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to fetch backlinks"));
  }
});


export const pageSpeedTest = asyncHandler(async (req, res) => {
  const { url, strategy = "mobile", apiKey } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }
  const key = apiKey || process.env.PSI_API_KEY;
  if (key) {
    try {
      const r = await axios.get("https://www.googleapis.com/pagespeedonline/v5/runPagespeed", {
        params: { url, strategy, key }
      });
      const lr = r.data && r.data.lighthouseResult;
      const metrics = {
        performanceScore: lr && lr.categories && lr.categories.performance && typeof lr.categories.performance.score === "number" ? Math.round(lr.categories.performance.score * 100) : null,
        firstContentfulPaintMs: lr && lr.audits && lr.audits["first-contentful-paint"] ? Math.round(lr.audits["first-contentful-paint"].numericValue || 0) : null,
        largestContentfulPaintMs: lr && lr.audits && lr.audits["largest-contentful-paint"] ? Math.round(lr.audits["largest-contentful-paint"].numericValue || 0) : null,
        speedIndexMs: lr && lr.audits && lr.audits["speed-index"] ? Math.round(lr.audits["speed-index"].numericValue || 0) : null,
        totalBlockingTimeMs: lr && lr.audits && lr.audits["total-blocking-time"] ? Math.round(lr.audits["total-blocking-time"].numericValue || 0) : null,
        cumulativeLayoutShift: lr && lr.audits && lr.audits["cumulative-layout-shift"] ? +(lr.audits["cumulative-layout-shift"].numericValue || 0).toFixed(3) : null,
        timeToFirstByteMs: lr && lr.audits && lr.audits["server-response-time"] ? Math.round(lr.audits["server-response-time"].numericValue || 0) : null
      };
      return res.status(200).json(new ApiResponse(200, metrics, "PageSpeed Insights metrics"));
    } catch (e) {
      const msg = e && e.response && e.response.data && e.response.data.error && e.response.data.error.message ? e.response.data.error.message : "Failed to fetch PageSpeed Insights";
      const code = e && e.response && e.response.status === 400 ? 400 : 500;
      return res.status(code).json(new ApiResponse(code, null, msg));
    }
  }
  try {
    const u = new URL(url);
    const client = u.protocol === "https:" ? https : http;
    const start = performance.now();
    await new Promise((resolve, reject) => {
      const rq = client.request(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } }, resp => {
        const ttfb = performance.now() - start;
        let bytes = 0;
        const chunks = [];
        resp.on("data", chunk => {
          bytes += chunk.length;
          chunks.push(chunk);
        });
        resp.on("end", () => {
          const html = Buffer.concat(chunks).toString("utf8");
          const parseStart = performance.now();
          const $ = cheerio.load(html);
          void $;
          const domLoadTime = performance.now() - parseStart;
          const pageSize = bytes;
          res.status(200).json(new ApiResponse(200, {
            ttfb: `${ttfb.toFixed(2)} ms`,
            domLoadTime: `${domLoadTime.toFixed(2)} ms`,
            pageSize: `${(pageSize / 1024).toFixed(2)} KB`
          }, "Page speed measured"));
          resolve(null);
        });
      });
      rq.on("error", reject);
      rq.end();
    });
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to measure page speed"));
  }
});


const checkCmd = (cmd, args = ["--version"]) =>
  new Promise(resolve => {
    try {
      const p = spawn(cmd, args, { windowsHide: true });
      let ok = false;
      p.on("error", () => resolve(false));
      p.on("close", code => resolve(code === 0 || ok));
      p.stdout.on("data", () => (ok = true));
    } catch {
      resolve(false);
    }
  });

export const backlinkMaker = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }

  const backlinks = [
    `http://www.google.com/search?q=link:${url}`,
    `http://www.bing.com/search?q=link:${url}`,
    `http://www.yahoo.com/search?p=link:${url}`,
  ];

  res.status(200).json(new ApiResponse(200, { backlinks }, "Backlinks generated successfully"));
});

export const brokenLinkChecker = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const links = [];
    $("a").each((i, link) => {
      const href = $(link).attr("href");
      if (href) {
        links.push(href);
      }
    });

    const brokenLinks = [];
    for (const link of links) {
      try {
        await axios.get(link);
      } catch (error) {
        brokenLinks.push(link);
      }
    }

    res.status(200).json(new ApiResponse(200, { brokenLinks }, "Broken links checked successfully"));
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, "Failed to fetch the URL"));
  }
});

export const websiteSeoScore = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("title").text();
    const description = $("meta[name='description']").attr("content");
    const h1 = $("h1").length;
    const h2 = $("h2").length;
    const images = $("img").length;
    const alt = $("img[alt]").length;

    let score = 0;
    if (title) score += 10;
    if (description) score += 10;
    if (h1 > 0) score += 10;
    if (h2 > 0) score += 5;
    if (images > 0) score += 5;
    if (alt > 0) score += 10;

    res.status(200).json(new ApiResponse(200, { score, title, description, h1, h2, images, alt }, "SEO score calculated successfully"));
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, "Failed to fetch the URL"));
  }
});

export const keywordResearch = asyncHandler(async (req, res) => {
  const { seed, strategy = "both", limit = 20 } = req.body;
  if (!seed) {
    return res.status(400).json(new ApiResponse(400, null, "Seed is required"));
  }
  try {
    const suggestions = new Set();
    const tasks = [];
    if (strategy === "google" || strategy === "both") {
      tasks.push(
        axios
          .get("https://suggestqueries.google.com/complete/search", {
            params: { client: "firefox", q: seed },
            headers: { "User-Agent": "Mozilla/5.0" }
          })
          .then(r => {
            const arr = Array.isArray(r.data) ? r.data[1] || [] : [];
            arr.forEach(s => suggestions.add(String(s)));
          })
          .catch(() => {})
      );
    }
    if (strategy === "bing" || strategy === "both") {
      tasks.push(
        axios
          .get("https://api.bing.com/osjson.aspx", {
            params: { query: seed },
            headers: { "User-Agent": "Mozilla/5.0" }
          })
          .then(r => {
            const arr = Array.isArray(r.data) ? r.data[1] || [] : [];
            arr.forEach(s => suggestions.add(String(s)));
          })
          .catch(() => {})
      );
    }
    await Promise.all(tasks);
    const out = Array.from(suggestions).slice(0, limit);
    res.status(200).json(new ApiResponse(200, { suggestions: out }, "Keyword suggestions"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to gather suggestions"));
  }
});

export const keywordDensityChecker = asyncHandler(async (req, res) => {
  const { url, text, top = 20, excludeStopwords = true } = req.body;
  if (!url && !text) {
    return res.status(400).json(new ApiResponse(400, null, "Provide url or text"));
  }
  try {
    let content = text || "";
    if (url) {
      const r = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $ = cheerio.load(r.data);
      $("script,style,noscript").remove();
      content = $("body").text();
    }
    const stop = new Set([
      "the","and","a","an","to","of","in","is","it","for","on","with","as","at","by","from","or","this","that","be","are","was","were","will","can","not","your","you","we","our"
    ]);
    const tokens = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2);
    const filtered = excludeStopwords ? tokens.filter(t => !stop.has(t)) : tokens;
    const total = filtered.length;
    const counts = new Map();
    for (const t of filtered) counts.set(t, (counts.get(t) || 0) + 1);
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([term, count]) => ({ term, count, densityPercent: +((count / total) * 100).toFixed(2) }));
    res.status(200).json(new ApiResponse(200, { totalTokens: total, top: sorted }, "Keyword density"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to analyze density"));
  }
});

export const keywordDifficultyChecker = asyncHandler(async (req, res) => {
  const { keyword, limit = 10 } = req.body;
  if (!keyword) {
    return res.status(400).json(new ApiResponse(400, null, "Keyword is required"));
  }
  try {
    const { data } = await axios.get("https://www.bing.com/search", {
      params: { q: keyword, count: limit },
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);
    const domains = [];
    $("li.b_algo h2 a").each((_, el) => {
      const href = $(el).attr("href") || "";
      try {
        const u = new URL(href);
        domains.push(u.hostname);
      } catch {}
    });
    const authority = new Set(["wikipedia.org","amazon.com","youtube.com","linkedin.com","facebook.com","pinterest.com","nytimes.com","bbc.co.uk","cnn.com","medium.com"]);
    let score = 30;
    let strong = 0;
    let eduGov = 0;
    for (const d of domains) {
      if ([...authority].some(a => d.endsWith(a))) strong++;
      if (d.endsWith(".edu") || d.endsWith(".gov")) eduGov++;
    }
    score += strong * 8 + eduGov * 12;
    if (domains.length >= 10) score += 10;
    if (score > 100) score = 100;
    const category = score < 40 ? "easy" : score < 70 ? "medium" : "hard";
    res.status(200).json(new ApiResponse(200, { score, category, signals: { strongDomains: strong, eduGov } }, "Keyword difficulty"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to estimate difficulty"));
  }
});

export const longTailKeywordTool = asyncHandler(async (req, res) => {
  const { seed, modifiers, limit = 50 } = req.body;
  if (!seed) {
    return res.status(400).json(new ApiResponse(400, null, "Seed is required"));
  }
  const baseMods =
    modifiers && Array.isArray(modifiers) && modifiers.length
      ? modifiers
      : ["best","how to","near me","for beginners","2026","cheap","free","guide","tips","vs","review"];
  try {
    const set = new Set();
    const combos = baseMods.map(m => `${seed} ${m}`);
    const queries = [seed, ...combos];
    const tasks = queries.slice(0, 10).map(q =>
      axios
        .get("https://suggestqueries.google.com/complete/search", {
          params: { client: "firefox", q },
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        .then(r => {
          const arr = Array.isArray(r.data) ? r.data[1] || [] : [];
          arr.forEach(s => set.add(String(s)));
        })
        .catch(() => {})
    );
    await Promise.all(tasks);
    const out = Array.from(set).slice(0, limit);
    res.status(200).json(new ApiResponse(200, { suggestions: out }, "Long-tail keywords"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to generate long-tail keywords"));
  }
});

export const metaTagGenerator = asyncHandler(async (req, res) => {
  const { url, title, description, keywords = [], canonical, robots = "index,follow" } = req.body;
  try {
    let t = title || "";
    let d = description || "";
    let can = canonical || url || "";
    if (url && (!t || !d)) {
      const r = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $ = cheerio.load(r.data);
      t = t || $("title").text() || "";
      d = d || $("meta[name='description']").attr("content") || "";
      if (!can) {
        const c = $("link[rel='canonical']").attr("href");
        if (c) can = c;
      }
    }
    const tags = [
      t ? `<title>${t}</title>` : "",
      d ? `<meta name="description" content="${d}">` : "",
      keywords && keywords.length ? `<meta name="keywords" content="${keywords.join(", ")}">` : "",
      robots ? `<meta name="robots" content="${robots}">` : "",
      can ? `<link rel="canonical" href="${can}">` : ""
    ]
      .filter(Boolean)
      .join("\n");
    res.status(200).json(new ApiResponse(200, { title: t, description: d, keywords, canonical: can, robots, tags }, "Meta tags generated"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to generate meta tags"));
  }
});

export const metaTagAnalyzer = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }
  try {
    const r = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(r.data);
    const title = $("title").text() || "";
    const description = $("meta[name='description']").attr("content") || "";
    const keywords = $("meta[name='keywords']").attr("content") || "";
    const canonical = $("link[rel='canonical']").attr("href") || "";
    const robots = $("meta[name='robots']").attr("content") || "";
    const ogTitle = $("meta[property='og:title']").attr("content") || "";
    const ogDesc = $("meta[property='og:description']").attr("content") || "";
    const ogImage = $("meta[property='og:image']").attr("content") || "";
    const twTitle = $("meta[name='twitter:title']").attr("content") || "";
    const twDesc = $("meta[name='twitter:description']").attr("content") || "";
    const twImage = $("meta[name='twitter:image']").attr("content") || "";
    const issues = [];
    if (!title) issues.push("Missing title");
    if (title.length < 10 || title.length > 60) issues.push("Title length out of range");
    if (!description) issues.push("Missing description");
    if (description.length < 50 || description.length > 160) issues.push("Description length suboptimal");
    if (!canonical) issues.push("Missing canonical");
    const data = {
      title,
      description,
      keywords,
      canonical,
      robots,
      openGraph: { title: ogTitle, description: ogDesc, image: ogImage },
      twitter: { title: twTitle, description: twDesc, image: twImage },
      issues
    };
    res.status(200).json(new ApiResponse(200, data, "Meta tag analysis"));
  } catch {
    res.status(500).json(new ApiResponse(500, null, "Failed to analyze meta tags"));
  }
});

export const grammarChecker = asyncHandler(async (req, res) => {
  const { text, language = "en-US" } = req.body;
  if (!text) {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  try {
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("language", language);
    const r = await axios.post("https://api.languagetool.org/v2/check", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const matches = (r.data?.matches || []).map(m => ({
      message: m.message,
      shortMessage: m.shortMessage || "",
      offset: m.offset,
      length: m.length,
      replacements: (m.replacements || []).map(x => x.value),
      rule: { id: m.rule?.id || "", description: m.rule?.description || "" }
    }));
    res.status(200).json(new ApiResponse(200, { count: matches.length, matches }, "Grammar check"));
  } catch (e) {
    const msg = e?.response?.data?.message || "Failed to check grammar";
    res.status(500).json(new ApiResponse(500, null, msg));
  }
});

const hfCall = async (model, input, headers, parameters = {}) => {
  const base = process.env.HF_API_BASE || "https://router.huggingface.co";
  const body = { inputs: input, parameters: { wait_for_model: true, ...parameters } };
  try {
    const r = await axios.post(
      `${base}/models/${model}`,
      body,
      { headers }
    );
    return r.data;
  } catch (e) {
    const status = e?.response?.status;
    if (status === 503) {
      await new Promise(res => setTimeout(res, 1500));
      const r2 = await axios.post(
        `${base}/models/${model}`,
        body,
        { headers }
      );
      return r2.data;
    }
    throw e;
  }
};

export const paraphraseText = asyncHandler(async (req, res) => {
  const { text, numReturnSequences = 3, numBeams = 4, temperature = 0.7, apiKey } = req.body;
  if (!text) {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const bearer = req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const token = apiKey || bearer || process.env.HUGGING_FACE_API_TOKEN || "";
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  try {
    const data = await hfCall(
      "prithivida/parrot_paraphraser_on_T5",
      `paraphrase: ${text}`,
      headers,
      { num_return_sequences: numReturnSequences, num_beams: numBeams, temperature }
    );
    const variants = Array.isArray(data)
      ? data
          .flatMap(x => {
            if (typeof x === "string") return [x];
            if (x?.generated_text) return [x.generated_text];
            if (Array.isArray(x) && x[0]?.generated_text) return [x[0].generated_text];
            return [];
          })
          .filter(Boolean)
      : [];
    if (!variants.length) {
      return res.status(502).json(new ApiResponse(502, null, "Paraphraser returned no variants"));
    }
    res.status(200).json(new ApiResponse(200, { variants }, "Paraphrases"));
  } catch (e) {
    const status = e?.response?.status;
    const msg =
      e?.response?.data?.error || e?.response?.data?.message || "Failed to paraphrase";
    const code = status === 401 || status === 403 ? 401 : status === 429 ? 429 : 500;
    res.status(code).json(new ApiResponse(code, null, msg || "Unauthorized. Provide apiKey or set HUGGING_FACE_API_TOKEN"));
  }
});

export const sentenceRewriter = asyncHandler(async (req, res) => {
  const { text, apiKey, numReturnSequences = 3, numBeams = 4, temperature = 0.7 } = req.body;
  if (!text) {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const bearer = req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const provided = apiKey && String(apiKey).startsWith("hf_") ? apiKey : "";
  const token = bearer && String(bearer).startsWith("hf_")
    ? bearer
    : provided || process.env.HUGGING_FACE_API_TOKEN || "";
  if (!token) {
    return res.status(401).json(new ApiResponse(401, null, "Hugging Face API token missing"));
  }
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  try {
    const data = await hfCall(
      "Vamsi/T5_Paraphrase_Paws",
      `paraphrase: ${text}`,
      headers,
      { num_return_sequences: numReturnSequences, num_beams: numBeams, temperature }
    );
    let variants = Array.isArray(data)
      ? data
          .flatMap(x => {
            if (typeof x === "string") return [x];
            if (x?.generated_text) return [x.generated_text];
            if (Array.isArray(x) && x[0]?.generated_text) return [x[0].generated_text];
            return [];
          })
          .filter(Boolean)
      : [];
    if (!variants.length) {
      const data2 = await hfCall(
        "eugenesiow/bart-paraphrase",
        text,
        headers,
        { num_return_sequences: numReturnSequences, temperature }
      );
      variants = Array.isArray(data2)
        ? data2
            .flatMap(x => {
              if (typeof x === "string") return [x];
              if (x?.generated_text) return [x.generated_text];
              if (Array.isArray(x) && x[0]?.generated_text) return [x[0].generated_text];
              return [];
            })
            .filter(Boolean)
        : [];
      if (!variants.length) {
        return res.status(502).json(new ApiResponse(502, null, "Rewriter returned no variants"));
      }
    }
    return res.status(200).json(new ApiResponse(200, { variants }, "Sentence rewrites"));
  } catch (e) {
    const status = e?.response?.status;
    try {
      const data2 = await hfCall(
        "eugenesiow/bart-paraphrase",
        text,
        headers,
        { num_return_sequences: numReturnSequences, temperature }
      );
      const variants = Array.isArray(data2)
        ? data2
            .flatMap(x => {
              if (typeof x === "string") return [x];
              if (x?.generated_text) return [x.generated_text];
              if (Array.isArray(x) && x[0]?.generated_text) return [x[0].generated_text];
              return [];
            })
            .filter(Boolean)
        : [];
      if (!variants.length) {
        const msg = e?.response?.data?.error || e?.response?.data?.message || "Failed to rewrite";
        const code = status === 401 || status === 403 ? 401 : status === 429 ? 429 : 500;
        return res.status(code).json(new ApiResponse(code, null, msg || "Unauthorized. Provide apiKey or set HUGGING_FACE_API_TOKEN"));
      }
      return res.status(200).json(new ApiResponse(200, { variants }, "Sentence rewrites"));
    } catch (e2) {
      const status2 = e2?.response?.status;
      const msg2 = e2?.response?.data?.error || e2?.response?.data?.message || "Failed to rewrite";
      const code2 = status2 === 401 || status2 === 403 ? 401 : status2 === 429 ? 429 : 500;
      return res.status(code2).json(new ApiResponse(code2, null, msg2 || "Unauthorized. Provide apiKey or set HUGGING_FACE_API_TOKEN"));
    }
  }
});


export const aiContentDetector = asyncHandler(async (req, res) => {
  const { text, apiKey } = req.body;
  if (!text) {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const bearer = req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const token = apiKey || bearer || process.env.HUGGING_FACE_API_TOKEN || "";
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  try {
    const data = await hfCall("roberta-base-openai-detector", text, headers, {});
    const result = Array.isArray(data) ? data : [];
    let label = result[0]?.label || "";
    let score = result[0]?.score ?? 0;
    const mapped =
      label === "LABEL_1" ? "AI-generated" : label === "LABEL_0" ? "Human-written" : label;
    const isAi = mapped === "AI-generated";
    res.status(200).json(new ApiResponse(200, { label: mapped, score, isAi, raw: result }, "AI content detection"));
  } catch (e) {
    const status = e?.response?.status;
    const msg =
      e?.response?.data?.error || e?.response?.data?.message || "Failed to detect AI content";
    const code = status === 401 || status === 403 ? 401 : status === 429 ? 429 : 500;
    res.status(code).json(new ApiResponse(code, null, msg || "Unauthorized. Provide apiKey or set HUGGING_FACE_API_TOKEN"));
  }
});

export const textSummarizer = asyncHandler(async (req, res) => {
  const { text, minLength = 56, maxLength = 180, apiKey } = req.body;
  if (!text) {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const bearer = req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const token = apiKey || bearer || process.env.HUGGING_FACE_API_TOKEN || "";
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  try {
    const data = await hfCall(
      "facebook/bart-large-cnn",
      text,
      headers,
      { min_length: minLength, max_length: maxLength }
    );
    let summary = "";
    if (Array.isArray(data)) {
      if (data[0]?.summary_text) summary = data[0].summary_text;
      else if (typeof data[0] === "string") summary = data[0];
    }
    if (!summary) {
      return res.status(502).json(new ApiResponse(502, null, "Summarizer returned no output"));
    }
    res.status(200).json(new ApiResponse(200, { summary }, "Summary"));
  } catch (e) {
    const status = e?.response?.status;
    const msg =
      e?.response?.data?.error || e?.response?.data?.message || "Failed to summarize";
    const code = status === 401 || status === 403 ? 401 : status === 429 ? 429 : 500;
    res.status(code).json(new ApiResponse(code, null, msg || "Unauthorized. Provide apiKey or set HUGGING_FACE_API_TOKEN"));
  }
});
export const wordCounter = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s+/g, "").length;
  const words = (text.trim().match(/\S+/g) || []).length;
  const lines = text.split(/\r?\n/).length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length;
  const paragraphs = (text.trim().split(/\r?\n\r?\n+/).filter(Boolean)).length || (chars ? 1 : 0);
  const readingTimeMinutes = +(words / 200).toFixed(2);
  res.status(200).json(
    new ApiResponse(200, { chars, charsNoSpaces, words, lines, sentences, paragraphs, readingTimeMinutes }, "Counts computed")
  );
});

export const caseConverter = asyncHandler(async (req, res) => {
  const { text, mode = "lower" } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  let out = text;
  const toTitle = s =>
    s
      .toLowerCase()
      .split(/\s+/)
      .map(w => w ? w[0].toUpperCase() + w.slice(1) : "")
      .join(" ");
  const toSentence = s =>
    s
      .toLowerCase()
      .replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, m => m.toUpperCase());
  if (mode === "upper") out = text.toUpperCase();
  else if (mode === "lower") out = text.toLowerCase();
  else if (mode === "title") out = toTitle(text);
  else if (mode === "sentence") out = toSentence(text);
  else if (mode === "toggle") out = text.split("").map(c => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
  res.status(200).json(new ApiResponse(200, { result: out }, "Case converted"));
});

export const reverseText = asyncHandler(async (req, res) => {
  const { text, mode = "chars" } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  let out;
  if (mode === "words") {
    out = text.split(/\s+/).reverse().join(" ");
  } else {
    out = text.split("").reverse().join("");
  }
  res.status(200).json(new ApiResponse(200, { result: out }, "Text reversed"));
});

export const morseCode = asyncHandler(async (req, res) => {
  const { text, action = "encode" } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const map = {
    a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
    i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
    q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
    y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
    "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.",
    "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
    "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.", "$": "...-..-", "@": ".--.-.",
    " ": "/"
  };
  if (action === "encode") {
    const out = text.toLowerCase().split("").map(ch => map[ch] ?? "").filter(Boolean).join(" ");
    return res.status(200).json(new ApiResponse(200, { result: out }, "Encoded to Morse"));
  } else {
    const rev = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
    const out = text.split(" ").map(tok => rev[tok] ?? "").join("").replace(/\//g, " ");
    return res.status(200).json(new ApiResponse(200, { result: out }, "Decoded from Morse"));
  }
});

export const invisibleChar = asyncHandler(async (req, res) => {
  const { text, action = "inject", char = "zwsp", every = 1 } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json(new ApiResponse(400, null, "Text is required"));
  }
  const chars = {
    zwsp: "\u200B",
    zwnj: "\u200C",
    zwj: "\u200D"
  };
  const ins = chars[char] || chars.zwsp;
  if (action === "inject") {
    const n = Math.max(1, Number(every) || 1);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      out += text[i];
      if ((i + 1) % n === 0) out += ins;
    }
    return res.status(200).json(new ApiResponse(200, { result: out }, "Invisible chars injected"));
  } else {
    const out = text.replace(/[\u200B\u200C\u200D]/g, "");
    return res.status(200).json(new ApiResponse(200, { result: out }, "Invisible chars removed"));
  }
});
export const sitemapGenerator = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const links = [];
    $("a").each((i, link) => {
      const href = $(link).attr("href");
      if (href && href.startsWith(url)) {
        links.push(href);
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${links.map(link => `<url><loc>${link}</loc></url>`).join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(sitemap);
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, "Failed to fetch the URL"));
  }
});

export const robotsTxtGenerator = asyncHandler(async (req, res) => {
  const { rules } = req.body;
  if (!rules) {
    return res.status(400).json(new ApiResponse(400, null, "Rules are required"));
  }

  const robotsTxt = rules.map(rule => `User-agent: ${rule.userAgent}\n${rule.disallow.map(path => `Disallow: ${path}`).join("\n")}`).join("\n\n");

  res.header("Content-Type", "text/plain");
  res.status(200).send(robotsTxt);
});

const urlMap = new Map();

export const urlShortener = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json(new ApiResponse(400, null, "URL is required"));
  }

  const shortUrl = Math.random().toString(36).substring(2, 8);
  urlMap.set(shortUrl, url);

  res.status(200).json(new ApiResponse(200, { shortUrl: `http://localhost:5000/api/v1/tools/s/${shortUrl}` }, "URL shortened successfully"));
});

export const redirectUrl = asyncHandler(async (req, res) => {
  const { shortUrl } = req.params;
  const longUrl = urlMap.get(shortUrl);

  if (longUrl) {
    res.redirect(longUrl);
  } else {
    res.status(404).json(new ApiResponse(404, null, "Short URL not found"));
  }
});

export const toolsHealth = asyncHandler(async (req, res) => {
  const gsCmds = [process.env.GS_BIN || "gswin64c", "gswin32c"];
  const sofficeCmd = process.env.SOFFICE_BIN || "soffice";
  const popplerCmd = process.env.POPPLER_PPM_BIN || "pdftoppm";

  const gsAvailable = (await Promise.all(gsCmds.map(c => checkCmd(c)))).some(Boolean);
  const sofficeAvailable = await checkCmd(sofficeCmd);
  const popplerAvailable = await checkCmd(popplerCmd);

  const data = {
    ghostscript: gsAvailable,
    libreoffice: sofficeAvailable,
    poppler: popplerAvailable
  };
  res.status(200).json(new ApiResponse(200, data, "Tools health"));
});
