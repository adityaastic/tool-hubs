import { ApiError } from "../utils/apiError.js";
import multer from "multer";

export const notFound = (req, res, next) => next(new ApiError(404, "Route not found"));

export const errorHandler = (err, req, res, next) => {
  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum allowed size is 25 MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded at once.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field. Please use the correct upload field.",
      LIMIT_PART_COUNT: "Too many form parts.",
      LIMIT_FIELD_KEY: "Field name is too long.",
      LIMIT_FIELD_VALUE: "Field value is too long.",
      LIMIT_FIELD_COUNT: "Too many fields in the form.",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
};
