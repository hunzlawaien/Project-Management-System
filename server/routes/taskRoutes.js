const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/Task");
const Project = require("../models/Project");

const router = express.Router();

const validStatuses = ["To Do", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

function isValidId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// GET /api/tasks - Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req, res) => {
  try {
    const { title, description, project, status, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (!project || !isValidId(project)) {
      return res.status(400).json({ message: "A valid project is required" });
    }

    const existingProject = await Project.findById(project);

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid task priority" });
    }

    const task = await Task.create({
      title,
      description,
      project,
      status,
      priority,
      dueDate: dueDate || null,
    });

    const populatedTask = await Task.findById(task._id).populate(
      "project",
      "name",
    );

    res.status(201).json(populatedTask);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create task" });
  }
});

// GET /api/tasks/:id - Get one task
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(req.params.id).populate("project", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

// PUT /api/tasks/:id - Update a task
router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const allowedFields = [
      "title",
      "description",
      "project",
      "status",
      "priority",
      "dueDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    if (updates.title !== undefined && !updates.title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (
      updates.status !== undefined &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    if (
      updates.priority !== undefined &&
      !validPriorities.includes(updates.priority)
    ) {
      return res.status(400).json({ message: "Invalid task priority" });
    }

    if (updates.project !== undefined) {
      if (!isValidId(updates.project)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const existingProject = await Project.findById(updates.project);

      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("project", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
