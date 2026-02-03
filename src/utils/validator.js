import { ApiError } from "./apiError.js";

export const validateArticle = (data, isUpdate = false) => {
  const errors = [];
  const requiredFields = ["routePath", "title", "description", "content", "apiUsage"];

  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (!data[field]) errors.push(`${field} is required`);
    });
  }

  if (data.routePath && !data.routePath.startsWith("/")) {
    errors.push("routePath must start with /");
  }

  if (data.apiUsage) {
    if (!data.apiUsage.endpoint) errors.push("apiUsage.endpoint is required");
    if (!data.apiUsage.method) errors.push("apiUsage.method is required");
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }
};
