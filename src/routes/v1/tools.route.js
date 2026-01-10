import { Router } from "express";
import {
  backlinkMaker,
  brokenLinkChecker,
  websiteSeoScore,
  sitemapGenerator,
  robotsTxtGenerator,
  urlShortener,
  redirectUrl,
  toolsHealth,
} from "../../controllers/tools.controller.js";

const router = Router();

router.post("/tools/backlink-maker", backlinkMaker);
router.post("/tools/broken-link-checker", brokenLinkChecker);
router.post("/tools/website-seo-score", websiteSeoScore);
router.post("/tools/sitemap-generator", sitemapGenerator);
router.post("/tools/robots-txt-generator", robotsTxtGenerator);
router.post("/tools/url-shortener", urlShortener);
router.get("/tools/s/:shortUrl", redirectUrl);
router.get("/tools/health", toolsHealth);

export default router;
