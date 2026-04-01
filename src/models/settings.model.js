import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "site_settings"
    },
    general: {
      siteName: { type: String, default: "ToolHub" },
      siteDescription: { type: String, default: "Your one-stop destination for free online tools." },
      logoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" }
    },
    footer: {
      copyrightText: { type: String, default: "© 2026 ToolHub. All rights reserved." },
      columns: [
        {
          title: { type: String, default: "Quick Links" },
          links: [
            { name: { type: String }, href: { type: String } }
          ]
        },
        {
          title: { type: String, default: "Legal" },
          links: [
            { name: { type: String }, href: { type: String } }
          ]
        }
      ],
      socialLinks: [
        { name: { type: String }, icon: { type: String }, href: { type: String } }
      ]
    }
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

export const Settings = mongoose.model("Settings", settingsSchema);
