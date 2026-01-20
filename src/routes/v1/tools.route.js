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
  wordCounter,
  caseConverter,
  reverseText,
  morseCode,
  invisibleChar,
  keywordResearch,
  keywordDensityChecker,
  keywordDifficultyChecker,
  longTailKeywordTool,
  metaTagGenerator,
  metaTagAnalyzer,
  grammarChecker,
  paraphraseText,
  sentenceRewriter,
  aiContentDetector,
  textSummarizer,
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
router.post("/tools/writing/word-counter", wordCounter);
router.post("/tools/writing/case-converter", caseConverter);
router.post("/tools/writing/reverse-text", reverseText);
router.post("/tools/writing/morse-code", morseCode);
router.post("/tools/writing/invisible-char", invisibleChar);
router.post("/tools/nlp/grammar-check", grammarChecker);
router.post("/tools/nlp/paraphrase", paraphraseText);
router.post("/tools/nlp/sentence-rewrite", sentenceRewriter);
router.post("/tools/nlp/ai-content-detector", aiContentDetector);
router.post("/tools/nlp/summarize", textSummarizer);
router.post("/tools/keyword-research", keywordResearch);
router.post("/tools/keyword-density", keywordDensityChecker);
router.post("/tools/keyword-difficulty", keywordDifficultyChecker);
router.post("/tools/long-tail-keywords", longTailKeywordTool);
router.post("/tools/meta-tag-generator", metaTagGenerator);
router.post("/tools/meta-tag-analyzer", metaTagAnalyzer);
router.get("/tools/s/:shortUrl", redirectUrl);
router.get("/tools/health", toolsHealth);

export default router;
