import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["contact", "userinfo"],
      default: "contact",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "replied"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
