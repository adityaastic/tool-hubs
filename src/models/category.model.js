import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconName: { type: String, required: true }, // The string name of the Lucide Icon
    color: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
