import Article from "../models/article.model.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Create a new article
 * @param {Object} articleData
 * @returns {Promise<Article>}
 */
export const createArticle = async (articleData) => {
  if (await Article.findOne({ routePath: articleData.routePath })) {
    throw new ApiError(409, "Article with this routePath already exists");
  }
  return await Article.create(articleData);
};

/**
 * Get article by ID
 * @param {string} id
 * @returns {Promise<Article>}
 */
export const getArticleById = async (id) => {
  const article = await Article.findById(id);
  if (!article) {
    throw new ApiError(404, "Article not found");
  }
  return article;
};

/**
 * Get article by Route Path
 * @param {string} routePath
 * @returns {Promise<Article>}
 */
export const getArticleByRoute = async (routePath) => {
  const article = await Article.findOne({ routePath });
  if (!article) {
    throw new ApiError(404, "Article not found for this route");
  }
  return article;
};

/**
 * Query articles
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Array<Article>>}
 */
export const queryArticles = async (filter, options = {}) => {
  return await Article.find(filter)
    .sort(options.sortBy || "-createdAt")
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

/**
 * Update article by ID
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Article>}
 */
export const updateArticleById = async (id, updateBody) => {
  const article = await Article.findById(id);
  if (!article) {
    throw new ApiError(404, "Article not found");
  }
  
  if (updateBody.routePath && (await Article.findOne({ routePath: updateBody.routePath, _id: { $ne: id } }))) {
    throw new ApiError(409, "RoutePath already taken by another article");
  }

  Object.assign(article, updateBody);
  await article.save();
  return article;
};

/**
 * Delete article by ID
 * @param {string} id
 * @returns {Promise<Article>}
 */
export const deleteArticleById = async (id) => {
  const article = await Article.findById(id);
  if (!article) {
    throw new ApiError(404, "Article not found");
  }
  await article.deleteOne();
  return article;
};
