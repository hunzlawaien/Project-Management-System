const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 150,
    },
    role: {
      type: String,
      required: [true, "Job role is required"],
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TeamMember", teamMemberSchema);
