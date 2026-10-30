const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
  },
  { timestamps: true },
);

teamMemberSchema.index({ workspace: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
