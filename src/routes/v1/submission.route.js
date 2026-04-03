import { Router } from "express";
import * as submissionController from "../../controllers/submission.controller.js";

const router = Router();

/**
 * Public Route
 */
router.post("/", submissionController.createSubmission);

/**
 * Admin Routes
 */
router.get("/", submissionController.getAllSubmissions);
router.patch("/:id/status", submissionController.updateStatus);
router.delete("/:id", submissionController.deleteSubmission);

export default router;
