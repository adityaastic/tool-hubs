import Settings from "../models/settings.model.js";

/**
 * Get current settings
 * @returns {Promise<Settings>}
 */
export const getSettings = async () => {
  let settings = await Settings.findOne({ key: "site_settings" });
  
  if (!settings) {
    // Create default settings if not exists
    settings = await Settings.create({
      key: "site_settings",
      general: {
        siteName: "THEDAPACHECKER",
        siteDescription: "Your one-stop destination for free online tools."
      },
      footer: {
        copyrightText: "© 2026 THEDAPACHECKER. All rights reserved.",
        columns: [
          {
            title: "Quick Links",
            links: [
              { name: "Home", href: "/" },
              { name: "About Us", href: "/About-Us" },
              { name: "Contact", href: "/Contact" }
            ]
          },
          {
            title: "Legal",
            links: [
              { name: "Privacy Policy", href: "/Privacy-Policy" },
              { name: "Terms of Service", href: "/Terms-of-Service" },
              { name: "Cookie Policy", href: "/Cookie-Policy" },
              { name: "Legal", href: "/Legal" }
            ]
          }
        ],
        socialLinks: [
          { name: "Twitter", icon: "Twitter", href: "https://twitter.com" },
          { name: "GitHub", icon: "Github", href: "https://github.com" },
          { name: "LinkedIn", icon: "Linkedin", href: "https://linkedin.com" }
        ]
      }
    });
  }
  
  return settings;
};

/**
 * Update settings
 * @param {Object} updateBody
 * @returns {Promise<Settings>}
 */
export const updateSettings = async (updateBody) => {
  let settings = await Settings.findOne({ key: "site_settings" });
  
  if (!settings) {
    settings = new Settings({ key: "site_settings" });
  }

  // Deep merge settings
  if (updateBody.general) {
    settings.general = { ...settings.general, ...updateBody.general };
  }
  if (updateBody.footer) {
    settings.footer = { ...settings.footer, ...updateBody.footer };
  }
  if (updateBody.marketing) {
    settings.marketing = { ...settings.marketing, ...updateBody.marketing };
  }

  await settings.save();
  return settings;
};
