import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import { seoInterceptor } from "./middlewares/seoInterceptor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
// Increase JSON payload limit to 100mb to match file uploads and support large text/markdown submissions
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(morgan("dev"));

app.use(routes);

// --- FRONTEND STATIC ASSET SERVING ---
// Path to the frontend dist folder
const frontendDistPath = path.resolve(__dirname, '../../tool-hub-frontend/dist');

// Serve static assets EXCEPT index.html (which is handled by seoInterceptor)
app.use(express.static(frontendDistPath, { index: false }));

// The seoInterceptor catches all non-API GET requests and returns the modified index.html
app.get('*', seoInterceptor);
// -------------------------------------

app.use(notFound);
app.use(errorHandler);

export default app;
