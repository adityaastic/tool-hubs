import { Router } from "express";
import { toolsHealth } from "../../controllers/tools.controller.js";

const router = Router();

router.get("/tools/health", toolsHealth);

export default router;
