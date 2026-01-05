import mongoose from "mongoose";
import { config } from "./index.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, { autoIndex: true });
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};
