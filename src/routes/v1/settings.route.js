import { Router } from "express";
import { getSettings, updateSettings } from "../../controllers/settings.controller.js";

const router = Router();

router.route("/")
  .get(getSettings)
  .put(updateSettings);

export default router;
