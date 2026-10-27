const express = require("express");
const Project = require("../models/Project");

const router = express.Router();

const validStatuses = ["Planning", "In Progress", "Completed"];

function isValidId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// POST /api/projects - Create a project
router.post("/", async (req, res) => {
  try {
    const { name, description, status, deadline, members } = req.body;

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
      members,
      progress,
    });

    res.status(201).json(project);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create project" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "progress",
      "deadline",
      "members",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one field to update.",
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
        const existingProject = await Project.findById(req.params.id);

        if (!existingProject) {
          return res.status(404).json({ message: "Project not found" });
        }

        updates.progress = existingProject.progress || 1;
      }

      const progress = Number(updates.progress);

      if (!Number.isInteger(progress) || progress < 1 || progress > 99) {
        return res.status(400).json({
          message:
            "Progress must be a whole number from 1 to 99 for projects in progress.",
        });
      }

      updates.progress = progress;
    } else if (updates.progress !== undefined) {
      const progress = Number(updates.progress);

      if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
        return res.status(400).json({
          message: "Progress must be a whole number from 0 to 100.",
        });
      }

      updates.progress = progress;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update project" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;
