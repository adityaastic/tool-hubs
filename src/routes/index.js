import { Router } from "express";
import { API_PREFIX } from "../constants.js";
import pdfRoutes from "./v1/pdf.route.js";
import toolsRoutes from "./v1/tools.route.js";
import imageRoutes from "./v1/image.route.js";
import utilityRoutes from "./v1/utility.route.js";
import articleRoutes from "./v1/article.route.js";
import staticPageRoutes from "./v1/staticPage.route.js";
import settingsRoutes from "./v1/settings.route.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use(`${API_PREFIX}/articles`, articleRoutes);
router.use(`${API_PREFIX}/static-pages`, staticPageRoutes);
router.use(`${API_PREFIX}/settings`, settingsRoutes);

router.use(API_PREFIX, pdfRoutes);
router.use(API_PREFIX, imageRoutes);
router.use(API_PREFIX, utilityRoutes);
router.use(API_PREFIX, toolsRoutes);

export default router;
