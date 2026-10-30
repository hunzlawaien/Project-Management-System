const express = require("express");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");
const User = require("../models/User");

const router = express.Router();

const validStatuses = ["Planning", "In Progress", "Completed"];

function isValidId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

async function getUserWorkspace(userId) {
  return Workspace.findOne({ members: userId });
}

// Get projects the current user owns or belongs to
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.userId,
    })
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// Create a project
router.post("/", async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.userId);

    if (!workspace) {
      return res.status(404).json({
        message: "No workspace found for this account",
      });
    }

    const { name, description, status, deadline } = req.body;

    let progress = 0;

    if (status === "Completed") {
      progress = 100;
    } else if (status === "In Progress") {
      progress = Number(req.body.progress ?? 0);
    }

    if (
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100 ||
      (status === "In Progress" && progress === 0)
    ) {
      return res.status(400).json({
        message:
          "Progress must be a whole number from 1 to 99 for projects in progress.",
      });
    }

    const project = await Project.create({
      name,
      description,
      status,
      deadline,
      progress,
      workspace: workspace._id,
      owner: req.user.userId,
      members: [req.user.userId],
    });

    await project.populate("members", "name email");

    res.status(201).json(project);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create project" });
  }
});

// Add a registered user to a project
router.post("/:id/members", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "A valid email address is required",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the project owner can add members",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "No registered CoWork user found with this email",
      });
    }

    if (user._id.toString() === project.owner.toString()) {
      return res.status(400).json({
        message: "The project owner is already a member",
      });
    }

    const alreadyMember = project.members.some(
      (memberId) => memberId.toString() === user._id.toString(),
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "This user is already a member of the project",
      });
    }

    project.members.push(user._id);

    await project.save();
    await project.populate("members", "name email");

    res.status(200).json({
      message: "Collaborator added successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add collaborator" });
  }
});

// Remove a member from a project
router.delete("/:id/members/:memberId", async (req, res) => {
  try {
    const { id, memberId } = req.params;

    if (!isValidId(id) || !isValidId(memberId)) {
      return res.status(400).json({
        message: "Invalid project or member ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the project owner can remove members",
      });
    }

    if (memberId === project.owner.toString()) {
      return res.status(400).json({
        message: "The project owner cannot be removed",
      });
    }

    const isMember = project.members.some(
      (member) => member.toString() === memberId,
    );

    if (!isMember) {
      return res.status(404).json({
        message: "This user is not a member of the project",
      });
    }

    project.members = project.members.filter(
      (member) => member.toString() !== memberId,
    );

    await project.save();
    await project.populate("members", "name email");

    res.json({
      message: "Collaborator removed successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove collaborator",
    });
  }
});

// Get one project, only if the user is a member
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user.userId,
    }).populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

// Update project (owner only)
router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the project owner can edit this project",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "progress",
      "deadline",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    if (
      updates.status !== undefined &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({ message: "Invalid project status" });
    }

    if (updates.status === "Completed") {
      updates.progress = 100;
    } else if (updates.status === "Planning") {
      updates.progress = 0;
    } else if (updates.status === "In Progress") {
      if (updates.progress === undefined) {
        updates.progress = project.progress || 1;
      }

      updates.progress = Number(updates.progress);

      if (
        !Number.isInteger(updates.progress) ||
        updates.progress < 1 ||
        updates.progress > 99
      ) {
        return res.status(400).json({
          message: "Progress must be a whole number from 1 to 99",
        });
      }
    } else if (updates.progress !== undefined) {
      updates.progress = Number(updates.progress);

      if (
        !Number.isInteger(updates.progress) ||
        updates.progress < 0 ||
        updates.progress > 100
      ) {
        return res.status(400).json({
          message: "Progress must be a whole number from 0 to 100",
        });
      }
    }

    Object.assign(project, updates);

    await project.save();
    await project.populate("members", "name email");

    res.json(project);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update project" });
  }
});

// Delete project (owner only)
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only the project owner can delete this project",
      });
    }

    await Project.findByIdAndDelete(project._id);

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;
