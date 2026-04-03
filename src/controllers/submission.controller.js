import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import * as submissionService from "../services/submission.service.js";

/**
 * Public: Submit info
 */
export const createSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.createSubmission(req.body);
  res.status(201).json(new ApiResponse(201, submission, "Submission successful"));
});

/**
 * Admin: Get all submissions
 */
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const submissions = await submissionService.getAllSubmissions(filter);
  res.status(200).json(new ApiResponse(200, submissions, "Submissions retrieved successfully"));
});

/**
 * Admin: Update status
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const submission = await submissionService.updateStatus(req.params.id, status);
  if (!submission) throw new ApiError(404, "Submission not found");
  res.status(200).json(new ApiResponse(200, submission, "Status updated successfully"));
});

/**
 * Admin: Delete
 */
export const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.deleteSubmission(req.params.id);
  if (!submission) throw new ApiError(404, "Submission not found");
  res.status(200).json(new ApiResponse(200, null, "Submission deleted successfully"));
});
