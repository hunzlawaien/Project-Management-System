const express = require("express");
const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");

const router = express.Router();

// Get all team members
router.get("/", async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: -1 });

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// Add a team member
router.post("/", async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    const member = await TeamMember.create({
      name,
      email,
      role,
      department,
    });

    res.status(201).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A team member with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to add team member" });
  }
});

// Update a team member
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    const { name, email, role, department } = req.body;

    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department },
      { new: true, runValidators: true },
    );

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.status(200).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A team member with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update team member" });
  }
});

// Delete a team member
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    const member = await TeamMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete team member" });
  }
});

module.exports = router;
