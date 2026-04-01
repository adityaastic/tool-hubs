import { Router } from "express";
import {
  createStaticPage,
  getStaticPages,
  getStaticPageById,
  getStaticPageBySlug,
  updateStaticPage,
  deleteStaticPage
} from "../../controllers/staticPage.controller.js";

const router = Router();

// Public routes
router.route("/")
  .get(getStaticPages);

router.route("/slug/:slug")
  .get(getStaticPageBySlug);

router.route("/:id")
  .get(getStaticPageById);

// Admin routes (TODO: Add auth middleware here)
router.route("/")
  .post(createStaticPage);

router.route("/:id")
  .put(updateStaticPage)
  .delete(deleteStaticPage);

export default router;
