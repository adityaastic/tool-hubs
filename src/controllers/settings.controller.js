import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import * as settingsService from "../services/settings.service.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.status(200).json(new ApiResponse(200, settings, "Settings retrieved successfully"));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  res.status(200).json(new ApiResponse(200, settings, "Settings updated successfully"));
});
