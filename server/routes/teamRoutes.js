const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Team = require("../models/Team");

const router = express.Router();

async function getOrCreateTeam(userId) {
  let team = await Team.findOne().sort({ createdAt: 1 });

  if (!team) {
    team = await Team.create({
      name: "CoWork Team",
      members: [userId],
      createdBy: userId,
    });
  } else if (!team.members.some((memberId) => memberId.toString() === userId)) {
    team.members.push(userId);
    await team.save();
  }

  return team;
}

// GET /api/team - Get shared team members
router.get("/", async (req, res) => {
  try {
    const team = await getOrCreateTeam(req.user.userId);

    const members = await User.find({
      _id: { $in: team.members },
    })
      .select("name email createdAt")
      .sort({ name: 1 });

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// POST /api/team - Add a registered user by email
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "A valid email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userToAdd = await User.findOne({ email: normalizedEmail });

    if (!userToAdd) {
      return res.status(404).json({
        message: "No registered CoWork user found with this email",
      });
    }

    const currentUserId = req.user.userId;

    if (userToAdd._id.toString() === currentUserId) {
      return res.status(400).json({
        message: "You are already part of your team",
      });
    }

    const team = await getOrCreateTeam(currentUserId);

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
    res.status(500).json({ message: "Failed to add team member" });
  }
});

// DELETE /api/team/:userId - Remove a member
router.delete("/:userId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const team = await Team.findOne();

    if (
      !team ||
      !team.members.some(
        (memberId) => memberId.toString() === req.params.userId,
      )
    ) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const currentUserId = req.user.userId;

    if (team.createdBy.toString() !== currentUserId) {
      return res.status(403).json({
        message: "Only the team creator can remove members",
      });
    }

    if (req.params.userId === currentUserId) {
      return res.status(400).json({
        message: "Remove other members before leaving the shared team",
      });
    }

    team.members = team.members.filter(
      (memberId) => memberId.toString() !== req.params.userId,
    );

    await team.save();

    res.status(200).json({
      message: "Team member removed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove team member" });
  }
});

module.exports = router;
