import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { spawn } from "child_process";
import axios from "axios";
import * as cheerio from "cheerio";

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
