import StaticPage from "../models/staticPage.model.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Create a new static page
 * @param {Object} pageData
 * @returns {Promise<StaticPage>}
 */
export const createStaticPage = async (pageData) => {
  if (await StaticPage.findOne({ slug: pageData.slug })) {
    throw new ApiError(409, "Static page with this slug already exists");
  }
  return await StaticPage.create(pageData);
};

/**
 * Get static page by ID
 * @param {string} id
 * @returns {Promise<StaticPage>}
 */
export const getStaticPageById = async (id) => {
  const page = await StaticPage.findById(id);
  if (!page) {
    throw new ApiError(404, "Static page not found");
  }
  return page;
};

/**
 * Get static page by Slug
 * @param {string} slug
 * @returns {Promise<StaticPage>}
 */
export const getStaticPageBySlug = async (slug) => {
  const page = await StaticPage.findOne({ slug });
  if (!page) {
    throw new ApiError(404, "Static page not found for this slug");
  }
  return page;
};

/**
 * Query static pages
 * @param {Object} filter
 * @returns {Promise<Array<StaticPage>>}
 */
export const queryStaticPages = async (filter = {}) => {
  return await StaticPage.find(filter).sort("-createdAt");
};

/**
 * Update static page by ID
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<StaticPage>}
 */
export const updateStaticPageById = async (id, updateBody) => {
  const page = await StaticPage.findById(id);
  if (!page) {
    throw new ApiError(404, "Static page not found");
  }
  
  if (updateBody.slug && (await StaticPage.findOne({ slug: updateBody.slug, _id: { $ne: id } }))) {
    throw new ApiError(409, "Slug already taken by another page");
  }

  Object.assign(page, updateBody);
  await page.save();
  return page;
};

/**
 * Delete static page by ID
 * @param {string} id
 * @returns {Promise<StaticPage>}
 */
export const deleteStaticPageById = async (id) => {
  const page = await StaticPage.findById(id);
  if (!page) {
    throw new ApiError(404, "Static page not found");
  }
  await page.deleteOne();
  return page;
};
