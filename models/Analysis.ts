import mongoose from "mongoose";

const KeyDateSchema = new mongoose.Schema({
  label: String,
  date: String,
  page: Number,
  confidence: Number,
});

const RequirementSchema = new mongoose.Schema({
  text: String,
  category: {
    type: String,
    enum: ["Technical", "Compliance", "Financial", "Operational", "Other"],
    default: "Other",
  },
  mandatory: { type: Boolean, default: false },
  page: Number,
  confidence: Number,
});

const RedFlagSchema = new mongoose.Schema({
  text: String,
  reason: String,
  page: Number,
});

const DeliverableSchema = new mongoose.Schema({
  text: String,
  page: Number,
});

const AnalysisSchema = new mongoose.Schema(
  {
    // The user who uploaded this document
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Document metadata
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ["processing", "done", "error"],
      default: "processing",
    },
    errorMessage: { type: String },

    // AI-extracted fields
    rfpTitle: { type: String, default: null },
    issuingAgency: { type: String, default: null },
    executiveSummary: { type: String, default: "" },
    goNoGoScore: { type: Number, default: null },
    goNoGoReasoning: { type: String, default: "" },

    keyDates: [KeyDateSchema],
    requirements: [RequirementSchema],
    redFlags: [RedFlagSchema],
    deliverables: [DeliverableSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Analysis ||
  mongoose.model("Analysis", AnalysisSchema);
