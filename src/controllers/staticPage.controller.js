import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import * as staticPageService from "../services/staticPage.service.js";

export const createStaticPage = asyncHandler(async (req, res) => {
  const page = await staticPageService.createStaticPage(req.body);
  res.status(201).json(new ApiResponse(201, page, "Static page created successfully"));
});

export const getStaticPages = asyncHandler(async (req, res) => {
  const filter = req.query.slug ? { slug: req.query.slug } : {};
  const pages = await staticPageService.queryStaticPages(filter);
  res.status(200).json(new ApiResponse(200, pages, "Static pages retrieved successfully"));
});

export const getStaticPageById = asyncHandler(async (req, res) => {
  const page = await staticPageService.getStaticPageById(req.params.id);
  res.status(200).json(new ApiResponse(200, page, "Static page retrieved successfully"));
});

export const getStaticPageBySlug = asyncHandler(async (req, res) => {
  const page = await staticPageService.getStaticPageBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, page, "Static page retrieved successfully"));
});

export const updateStaticPage = asyncHandler(async (req, res) => {
  const page = await staticPageService.updateStaticPageById(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, page, "Static page updated successfully"));
});

export const deleteStaticPage = asyncHandler(async (req, res) => {
  await staticPageService.deleteStaticPageById(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Static page deleted successfully"));
});
