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
  pageSpeedTest,
  backlinkChecker,
  keywordResearch,
  keywordDensityChecker,
  keywordDifficultyChecker,
  longTailKeywordTool,
  metaTagGenerator,
  metaTagAnalyzer,
} from "../../controllers/tools.controller.js";

const router = Router();

router.post("/tools/page-speed-test", pageSpeedTest);
router.post("/tools/backlink-checker", backlinkChecker);
router.post("/tools/backlink-maker", backlinkMaker);
router.post("/tools/broken-link-checker", brokenLinkChecker);
router.post("/tools/website-seo-score", websiteSeoScore);
router.post("/tools/sitemap-generator", sitemapGenerator);
router.post("/tools/robots-txt-generator", robotsTxtGenerator);
router.post("/tools/url-shortener", urlShortener);
router.post("/tools/keyword-research", keywordResearch);
router.post("/tools/keyword-density", keywordDensityChecker);
router.post("/tools/keyword-difficulty", keywordDifficultyChecker);
router.post("/tools/long-tail-keywords", longTailKeywordTool);
router.post("/tools/meta-tag-generator", metaTagGenerator);
router.post("/tools/meta-tag-analyzer", metaTagAnalyzer);
router.get("/tools/s/:shortUrl", redirectUrl);
router.get("/tools/health", toolsHealth);

export default router;
