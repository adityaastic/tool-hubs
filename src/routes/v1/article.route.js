import { Router } from "express";
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle
} from "../../controllers/article.controller.js";

const router = Router();

// Public routes
router.route("/")
  .get(getArticles);

router.route("/:id")
  .get(getArticleById);

// Admin routes (TODO: Add auth middleware here)
// router.use(authMiddleware);
router.route("/")
  .post(createArticle);

router.route("/:id")
  .put(updateArticle)
  .delete(deleteArticle);

export default router;
