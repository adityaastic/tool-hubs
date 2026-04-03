import Submission from "../models/submission.model.js";

/**
 * Create a new submission
 * @param {Object} submissionBody
 * @returns {Promise<Submission>}
 */
export const createSubmission = async (submissionBody) => {
  return await Submission.create(submissionBody);
};

/**
 * Get all submissions
 * @param {Object} filter
 * @returns {Promise<Submission[]>}
 */
export const getAllSubmissions = async (filter = {}) => {
  return await Submission.find(filter).sort({ createdAt: -1 });
};

/**
 * Update submission status
 * @param {string} id
 * @param {string} status
 * @returns {Promise<Submission>}
 */
export const updateStatus = async (id, status) => {
  return await Submission.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
};

/**
 * Delete a submission
 * @param {string} id
 * @returns {Promise<Submission>}
 */
export const deleteSubmission = async (id) => {
  return await Submission.findByIdAndDelete(id);
};
