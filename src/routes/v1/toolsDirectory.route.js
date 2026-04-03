import { Router } from "express";
import * as DirectoryCtrl from "../../controllers/toolsDirectory.controller.js";

const router = Router();

// Public route for global frontend state (Homepage, dropdowns)
router.get("/public", DirectoryCtrl.getPublicDirectory);

// Seeding endpoint (WARNING: Only hit once by Admin UI migration tool)
router.post("/seed", DirectoryCtrl.seedDirectory);

// Category Management
router.route("/categories")
  .get(DirectoryCtrl.getCategories)
  .post(DirectoryCtrl.createCategory);

router.route("/categories/:id")
  .put(DirectoryCtrl.updateCategory)
  .delete(DirectoryCtrl.deleteCategory);

// Tool Management
router.route("/tools")
  .get(DirectoryCtrl.getTools)
  .post(DirectoryCtrl.createTool);

router.route("/tools/:id")
  .put(DirectoryCtrl.updateTool)
  .delete(DirectoryCtrl.deleteTool);

export default router;
