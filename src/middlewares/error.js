import { ApiError } from "../utils/apiError.js";

export const notFound = (req, res, next) => next(new ApiError(404, "Route not found"));

export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
};
