const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Team = require("../models/Team");

const router = express.Router();

// Get the shared team
async function getTeam() {
  return Team.findOne().sort({ createdAt: 1 });
}

// GET /api/team
// Only existing team members can view the team
router.get("/", async (req, res) => {
  try {
    let team = await getTeam();

    // Create the first shared team if it doesn't exist
    if (!team) {
      team = await Team.create({
        name: "CoWork Team",
        members: [req.user.userId],
        createdBy: req.user.userId,
      });
    }

    const isMember = team.members.some(
      (memberId) => memberId.toString() === req.user.userId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of the shared team",
      });
    }

    const members = await User.find({
      _id: { $in: team.members },
    })
      .select("name email createdAt")
      .sort({ name: 1 });

    res.status(200).json({
      members,
      isCreator: team.createdBy.toString() === req.user.userId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch team members",
    });
  }
});

// POST
// Only the team creator can add registered users
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "A valid email address is required",
      });
    }

    const team = await getTeam();

    if (!team) {
      return res.status(404).json({
        message: "Shared team not found",
      });
    }

    if (team.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the team creator can add members",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userToAdd = await User.findOne({
      email: normalizedEmail,
    });

    if (!userToAdd) {
      return res.status(404).json({
        message: "No registered CoWork user found with this email",
      });
    }

    if (userToAdd._id.toString() === req.user.userId) {
      return res.status(400).json({
        message: "You are already the team creator",
      });
    }

    const alreadyMember = team.members.some(
      (memberId) => memberId.toString() === userToAdd._id.toString(),
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "This user is already in the shared team",
      });
    }

    team.members.push(userToAdd._id);
    await team.save();

    const members = await User.find({
      _id: { $in: team.members },
    }).select("name email createdAt");

    res.status(201).json({
      message: "User added to the shared team successfully",
      members,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add team member",
    });
  }
});

// DELETE
// Only the team creator can remove members
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const team = await getTeam();

    if (!team) {
      return res.status(404).json({
        message: "Shared team not found",
      });
    }

    if (team.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the team creator can remove members",
      });
    }

    if (userId === req.user.userId) {
      return res.status(400).json({
        message: "The team creator cannot remove themselves",
      });
    }

    const isMember = team.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (!isMember) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    team.members = team.members.filter(
      (memberId) => memberId.toString() !== userId,
    );

    await team.save();

    res.status(200).json({
      message: "Team member removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove team member",
    });
  }
});

module.exports = router;
