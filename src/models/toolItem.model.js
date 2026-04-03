import mongoose from "mongoose";

const toolItemSchema = new mongoose.Schema(
  {
    toolId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    iconName: { type: String, required: true }, // The string name of the Lucide Icon
    href: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ToolItem = mongoose.model("ToolItem", toolItemSchema);
export default ToolItem;
