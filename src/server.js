import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";

const server = http.createServer(app);

// Large PDF processing (Ghostscript compression, conversions) can take 2-4 minutes.
// Increase timeouts so requests aren't killed mid-processing.
server.timeout = 5 * 60 * 1000;         // 5 minutes
server.keepAliveTimeout = 5 * 60 * 1000;
server.headersTimeout = 5 * 60 * 1000 + 1000;

const start = async () => {
  const connected = await connectDB();
  server.listen(config.port, () => {
    const status = connected ? "connected" : "not connected";
    console.log(`Server on http://localhost:${config.port} | Mongo ${status}`);
  });
};

start();

const shutdown = () => {
  server.close(() => {
    const conn = mongoose.connection;
    if (conn.readyState === 1) conn.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
