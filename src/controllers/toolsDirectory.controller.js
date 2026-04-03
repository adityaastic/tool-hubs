import Category from "../models/category.model.js";
import ToolItem from "../models/toolItem.model.js";

// ------------------------------------------------------------------
// PUBLIC METHODS
// ------------------------------------------------------------------

/**
 * Get all categories and populate their ACTIVE tools
 * Sorts both categories and tools by sortOrder.
 */
export const getPublicDirectory = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();
    
    // Fetch all active tools
    const tools = await ToolItem.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    
    // Group tools by category
    const populatedCategories = categories.map((cat) => ({
      ...cat,
      // Create 'id' helper fields for frontend compatibility
      id: cat.categoryId, 
      tools: tools
        .filter((t) => t.category.toString() === cat._id.toString())
        .map(t => ({ ...t, id: t.toolId })),
    }));

    res.status(200).json({ success: true, data: populatedCategories });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// ADMIN METHODS: SEEDING
// ------------------------------------------------------------------

/**
 * Endpoint to safely migrate static frontend JS data into MongoDB.
 * WARNING: This completely wipes existing directories if called.
 * Should only be used once effectively.
 */
export const seedDirectory = async (req, res, next) => {
  try {
    const { payload } = req.body; // Expects an array of categories with embedded tools
    
    if (!payload || !Array.isArray(payload)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    // Clear existing
    await Category.deleteMany({});
    await ToolItem.deleteMany({});

    const resultCategories = [];
    const resultTools = [];

    // Loop through categories from JS data
    for (let c = 0; c < payload.length; c++) {
      const catData = payload[c];
      const newCat = await Category.create({
        categoryId: catData.id,
        name: catData.name,
        description: catData.description,
        iconName: catData.iconName, // Provided mapped string by frontend
        color: catData.color,
        sortOrder: c // Preserve original array order
      });
      resultCategories.push(newCat);

      if (catData.tools && Array.isArray(catData.tools)) {
        for (let t = 0; t < catData.tools.length; t++) {
          const toolData = catData.tools[t];
          resultTools.push({
            toolId: toolData.id,
            name: toolData.name,
            iconName: toolData.iconName,
            href: toolData.href,
            description: toolData.description || "",
            isPopular: toolData.isPopular || false,
            isActive: true,
            sortOrder: t,
            category: newCat._id
          });
        }
      }
    }

    // Bulk insert tools
    if (resultTools.length > 0) {
      await ToolItem.insertMany(resultTools);
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully migrated ${resultCategories.length} categories and ${resultTools.length} tools.` 
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// ADMIN METHODS: CATEGORIES
// ------------------------------------------------------------------

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    
    // Also delete orphaned tools
    await ToolItem.deleteMany({ category: req.params.id });

    res.status(200).json({ success: true, message: "Category and tools deleted." });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// ADMIN METHODS: TOOLS
// ------------------------------------------------------------------

export const getTools = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const tools = await ToolItem.find(filter).populate('category', 'name color').sort({ sortOrder: 1 });
    res.status(200).json({ success: true, data: tools });
  } catch (error) {
    next(error);
  }
};

export const createTool = async (req, res, next) => {
  try {
    const tool = await ToolItem.create(req.body);
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
};

export const updateTool = async (req, res, next) => {
  try {
    const tool = await ToolItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
};

export const deleteTool = async (req, res, next) => {
  try {
    const tool = await ToolItem.findByIdAndDelete(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });
    res.status(200).json({ success: true, message: "Tool deleted." });
  } catch (error) {
    next(error);
  }
};
