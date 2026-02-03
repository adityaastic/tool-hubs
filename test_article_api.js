import axios from "axios";

const testApi = async () => {
  try {
    console.log("Starting test...");
    
    // 1. Create Article with SEO Metadata
    console.log("Creating article...");
    const createRes = await axios.post("http://localhost:5000/api/v1/articles", {
      routePath: "/pdf/test-seo-" + Date.now(),
      title: "Test SEO Article",
      description: "An article with SEO metadata.",
      headings: ["Introduction", "Usage"],
      subheadings: ["Step 1", "Step 2"],
      content: "Full content with SEO...",
      seoMetadata: {
        metaTitle: "Best PDF Tool",
        metaDescription: "Split PDF online for free",
        keywords: ["pdf", "split", "tool"],
        canonicalUrl: "https://example.com/pdf/split",
        ogTitle: "Open Graph Title",
        ogDescription: "Open Graph Desc"
      },
      apiUsage: {
        endpoint: "/api/v1/pdf/split",
        method: "POST",
        parameters: { file: "PDF file" },
        responseExample: { url: "..." }
      }
    });
    
    console.log("Create Status:", createRes.status);
    console.log("Create Data:", JSON.stringify(createRes.data, null, 2));

    const articleId = createRes.data.data._id;

    // 2. Get Article by ID
    console.log("\nGetting article by ID...");
    const getRes = await axios.get(`http://localhost:5000/api/v1/articles/${articleId}`);
    console.log("Get Status:", getRes.status);
    console.log("Get Data:", JSON.stringify(getRes.data, null, 2));

    // 3. Delete Article
    console.log("\nDeleting article...");
    const delRes = await axios.delete(`http://localhost:5000/api/v1/articles/${articleId}`);
    console.log("Delete Status:", delRes.status);
    console.log("Delete Data:", JSON.stringify(delRes.data, null, 2));

  } catch (error) {
    console.error("Test Error:", error.response ? error.response.data : error.message);
  }
};

testApi();
