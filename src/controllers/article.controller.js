import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import * as articleService from "../services/article.service.js";
import { validateArticle } from "../utils/validator.js";

export const createArticle = asyncHandler(async (req, res) => {
  validateArticle(req.body);
  const article = await articleService.createArticle(req.body);
  res.status(201).json(new ApiResponse(201, article, "Article created successfully"));
});

export const getArticles = asyncHandler(async (req, res) => {
  const filter = req.query.routePath ? { routePath: req.query.routePath } : {};
  const articles = await articleService.queryArticles(filter);
  res.status(200).json(new ApiResponse(200, articles, "Articles retrieved successfully"));
});

export const getArticleById = asyncHandler(async (req, res) => {
  const article = await articleService.getArticleById(req.params.id);
  res.status(200).json(new ApiResponse(200, article, "Article retrieved successfully"));
});

export const updateArticle = asyncHandler(async (req, res) => {
  validateArticle(req.body, true);
  const article = await articleService.updateArticleById(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, article, "Article updated successfully"));
});

export const deleteArticle = asyncHandler(async (req, res) => {
  await articleService.deleteArticleById(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Article deleted successfully"));
});
