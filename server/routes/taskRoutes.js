const express = require("express");

const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

const router = express.Router();

const validStatuses = ["To Do", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

function isValidId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// Find a project the logged-in user can access
async function getAccessibleProject(projectId, userId) {
  return Project.findOne({
    _id: projectId,
    members: userId,
  });
}

// Validate that an assignee belongs to the project
async function validateAssignee(assigneeId, project) {
  if (assigneeId === null || assigneeId === "") {
    return { assignee: null };
  }

  if (!isValidId(assigneeId)) {
    return { error: "Invalid assignee ID" };
  }

  const isMember = project.members.some(
    (memberId) => memberId.toString() === assigneeId,
  );

  if (!isMember) {
    return {
      error: "The assignee must be a member of this project",
    };
  }

  const user = await User.findById(assigneeId).select("_id");

  if (!user) {
    return { error: "Assignee not found" };
  }

  return { assignee: user._id };
}

function populateTask(query) {
  return query
    .populate("project", "name")
    .populate("createdBy", "name")
    .populate("assignee", "name");
}

// GET - Get tasks from accessible projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.userId,
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    const tasks = await populateTask(
      Task.find({
        project: { $in: projectIds },
      }).sort({ createdAt: -1 }),
    );

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate } =
      req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (!project || !isValidId(project)) {
      return res.status(400).json({ message: "A valid project is required" });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid task priority" });
    }

    const existingProject = await getAccessibleProject(
      project,
      req.user.userId,
    );

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found or you don't have access to it",
      });
    }

    let assignedUser = null;

    if (assignee !== undefined) {
      const result = await validateAssignee(assignee, existingProject);

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      assignedUser = result.assignee;
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      project: existingProject._id,
      createdBy: req.user.userId,
      assignee: assignedUser,
      status,
      priority,
      dueDate: dueDate || null,
    });

    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(201).json(populatedTask);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create task" });
  }
});

// GET - Get one task
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const projects = await Project.find({
      members: req.user.userId,
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    const task = await populateTask(
      Task.findOne({
        _id: req.params.id,
        project: { $in: projectIds },
      }),
    );

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

    const projects = await Project.find({
      members: req.user.userId,
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    const task = await Task.findOne({
      _id: req.params.id,
      project: { $in: projectIds },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = req.user.userId;
    const isOwner = project.owner.toString() === userId;
    const isCreator = task.createdBy && task.createdBy.toString() === userId;

    const requestedFields = Object.keys(req.body);

    if (requestedFields.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    if (!isOwner) {
      const isStatusOnlyUpdate = requestedFields.every(
        (field) => field === "status",
      );

      if (!isStatusOnlyUpdate && !isCreator) {
        return res.status(403).json({
          message: "You can only edit tasks you created",
        });
      }

      const allowedCollaboratorFields = [
        "title",
        "description",
        "assignee",
        "status",
        "priority",
        "dueDate",
      ];

      const hasDisallowedField = requestedFields.some(
        (field) => !allowedCollaboratorFields.includes(field),
      );

      if (hasDisallowedField) {
        return res.status(403).json({
          message: "You cannot change the project of a task",
        });
      }
    }

    const allowedFields = [
      "title",
      "description",
      "project",
      "assignee",
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
        message: "Please provide at least one valid field to update",
      });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" || !updates.title.trim())
    ) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
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

    let destinationProject = task.project;

    if (updates.project !== undefined) {
      if (!isOwner) {
        return res.status(403).json({
          message: "Only the project owner can move tasks between projects",
        });
      }

      if (!isValidId(updates.project)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      destinationProject = await getAccessibleProject(updates.project, userId);

      if (!destinationProject) {
        return res.status(404).json({
          message: "Project not found or you don't have access to it",
        });
      }

      updates.project = destinationProject._id;
    } else {
      destinationProject = await Project.findById(task.project);
    }

    if (!destinationProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (updates.assignee !== undefined) {
      const result = await validateAssignee(
        updates.assignee,
        destinationProject,
      );

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      updates.assignee = result.assignee;
    }

    Object.assign(task, updates);
    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(200).json(populatedTask);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE - Only the project owner can delete a task
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = req.user.userId;

    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (!isMember) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isOwner = project.owner.toString() === userId;

    if (!isOwner) {
      return res.status(403).json({
        message: "Only the project owner can delete tasks",
      });
    }

    await Task.findByIdAndDelete(task._id);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
