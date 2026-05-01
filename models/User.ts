import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: false, // false because Google users won't have one
    },
    image: {
      type: String,
      required: false,
    },
    // Subscription tier: "free" | "pro" | "team" | "payg"
    plan: {
      type: String,
      enum: ["free", "pro", "team", "payg"],
      default: "free",
    },
    // Usage tracking — reset on the 1st of each month
    uploadsThisMonth: {
      type: Number,
      default: 0,
    },
    lastUploadResetDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
