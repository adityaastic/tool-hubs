import mongoose from "mongoose";

const staticPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      description: "The URL slug for the page (e.g., privacy-policy, terms-of-service)"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      description: "HTML content of the page"
    },
    seoMetadata: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

const StaticPage = mongoose.model("StaticPage", staticPageSchema);
export default StaticPage;
