import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    routePath: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      description: "The API endpoint path this article describes (e.g., /pdf/split)"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    headings: [{
      type: String,
      trim: true
    }],
    subheadings: [{
      type: String,
      trim: true
    }],
    content: {
      type: String,
      required: true,
      description: "Main HTML or Markdown content of the article"
    },
    seoMetadata: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      canonicalUrl: { type: String, trim: true },
      ogTitle: { type: String, trim: true },
      ogDescription: { type: String, trim: true },
      ogImage: { type: String, trim: true }
    },
    apiUsage: {
      endpoint: { type: String, required: true },
      method: { type: String, required: true, uppercase: true },
      parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
      responseExample: { type: mongoose.Schema.Types.Mixed, default: {} }
    }
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

const Article = mongoose.model("Article", articleSchema);
export default Article;
