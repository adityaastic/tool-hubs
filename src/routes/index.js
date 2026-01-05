import { Router } from "express";
import { API_PREFIX } from "../constants.js";
import pdfRoutes from "./v1/pdf.route.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use(API_PREFIX, pdfRoutes);

export default router;
