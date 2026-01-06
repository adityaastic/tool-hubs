import { Router } from "express";
import { API_PREFIX } from "../constants.js";
import pdfRoutes from "./v1/pdf.route.js";
import toolsRoutes from "./v1/tools.route.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use(API_PREFIX, pdfRoutes);
router.use(API_PREFIX, toolsRoutes);

export default router;
