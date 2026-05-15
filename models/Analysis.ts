import mongoose from "mongoose";

const KeyDateSchema = new mongoose.Schema({
  label: String,
  date: String,
  page: Number,
});

const RequirementSchema = new mongoose.Schema({
  text: String,
  category: {
    type: String,
    enum: ["Technical", "Management", "Past Performance", "Pricing", "Legal", "Compliance", "Operational", "Financial", "Other"],
    default: "Other",
  },
  mandatory: { type: Boolean, default: false },
  severity: {
    type: String,
    enum: ["Critical", "High", "Medium", "Low", "Informational"],
    default: "Medium",
  },
  page: Number,
});

const RedFlagSchema = new mongoose.Schema({
  text: String,
  reason: String,
  risk_type: {
    type: String,
    enum: ["Financial", "Legal", "Operational", "Timeline", "Other"],
    default: "Other",
  },
  page: Number,
});

// Reusing DeliverableSchema to store Evaluation Criteria
const DeliverableSchema = new mongoose.Schema({
  text: String, // "Factor: Weight" format
  page: Number,
});

const AnalysisSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    // Document metadata
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ["processing", "done", "error"],
      default: "processing",
    },
    errorMessage: { type: String },

    // AI-extracted contract metadata
    rfpTitle: { type: String, default: null },
    issuingAgency: { type: String, default: null },

    // AI analysis
    executiveSummary: { type: String, default: "" },
    goNoGoScore: { type: Number, default: null },
    goNoGoReasoning: { type: String, default: "" },

    keyDates: [KeyDateSchema],
    requirements: [RequirementSchema],
    redFlags: [RedFlagSchema],
    deliverables: [DeliverableSchema], // Used for evaluation criteria
  },
  { timestamps: true }
);

export default mongoose.models.Analysis ||
  mongoose.model("Analysis", AnalysisSchema);
