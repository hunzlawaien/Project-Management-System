const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Team = require("../models/Team");
const Workspace = require("../models/Workspace");

const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Upload an image buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cowork/profiles",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};

// Handle image upload errors
const handlePictureUpload = (req, res, next) => {
  upload.single("profilePicture")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image size must not exceed 4MB."
            : error.message,
      });
    }

    next();
  });
};

// Get logged-in user's profile
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email profilePicture",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to fetch profile.",
    });
  }
});

// Update user's name
router.put("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Please enter a valid name.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        message: "Name cannot exceed 100 characters.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim() },
      { new: true, runValidators: true },
    ).select("name email profilePicture");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
});

// Upload or replace profile picture
router.post("/picture", handlePictureUpload, async (req, res) => {
  let uploadedPublicId = "";
  let imageSaved = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    uploadedPublicId = result.public_id;

    const oldPublicId = user.profilePicturePublicId;

    user.profilePicture = result.secure_url;
    user.profilePicturePublicId = result.public_id;

    await user.save();

    imageSaved = true;

    // Delete the previous image after the new one is saved
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cleanupError) {
        console.error("Old profile picture cleanup error:", cleanupError);
      }
    }

    res.status(200).json({
      message: "Profile picture updated successfully.",
      user: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    // Delete the new Cloudinary image only if saving failed
    if (uploadedPublicId && !imageSaved) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      message: "Failed to upload profile picture.",
      error: error.message,
    });
  }
});

// Remove profile picture
router.delete("/picture", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const oldPublicId = user.profilePicturePublicId;

    user.profilePicture = "";
    user.profilePicturePublicId = "";

    await user.save();

    // Removing the Cloudinary image is separate from updating the database
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cleanupError) {
        console.error("Profile picture cleanup error:", cleanupError);
      }
    }

    res.status(200).json({
      message: "Profile picture removed successfully.",
      user: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);

    res.status(500).json({
      message: "Failed to remove profile picture.",
    });
  }
});

// Delete logged-in user's account
router.delete("/account", async (req, res) => {
  let session;

  try {
    const { password } = req.body;

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Please enter your current password.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Incorrect password.",
      });
    }

    const profilePicturePublicId = user.profilePicturePublicId;

    // Start a database transaction
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const userId = user._id;

      // Find projects owned by the departing user
      const ownedProjects = await Project.find({
        owner: userId,
      }).session(session);

      const ownedProjectIds = ownedProjects.map((project) => project._id);

      // Delete tasks and projects owned by this user
      if (ownedProjectIds.length > 0) {
        await Task.deleteMany({
          project: { $in: ownedProjectIds },
        }).session(session);

        await Project.deleteMany({
          _id: { $in: ownedProjectIds },
        }).session(session);
      }

      // Find projects owned by other users where this user is a member
      const remainingProjects = await Project.find({
        members: userId,
        owner: { $ne: userId },
      }).session(session);

      for (const project of remainingProjects) {
        // Remove departing user from project members
        project.members = project.members.filter(
          (memberId) => memberId.toString() !== userId.toString(),
        );

        await project.save({ session });

        // Clear task assignments belonging to departing user
        await Task.updateMany(
          {
            project: project._id,
            assignee: userId,
          },
          {
            $set: { assignee: null },
          },
          { session },
        );

        // Reassign tasks created by departing user to project owner
        await Task.updateMany(
          {
            project: project._id,
            createdBy: userId,
          },
          {
            $set: { createdBy: project.owner },
          },
          { session },
        );
      }

      // Handle team membership and creator status
      const teams = await Team.find({
        $or: [{ members: userId }, { createdBy: userId }],
      }).session(session);

      for (const team of teams) {
        team.members = team.members.filter(
          (memberId) => memberId.toString() !== userId.toString(),
        );

        if (team.createdBy.toString() === userId.toString()) {
          if (team.members.length > 0) {
            // Transfer creator status to another member
            team.createdBy = team.members[0];
          } else {
            // Delete team if no members remain
            await Team.deleteOne({
              _id: team._id,
            }).session(session);

            continue;
          }
        }

        await team.save({ session });
      }

      // Handle workspace membership and ownership
      const workspaces = await Workspace.find({
        $or: [{ owner: userId }, { members: userId }],
      }).session(session);

      for (const workspace of workspaces) {
        workspace.members = workspace.members.filter(
          (memberId) => memberId.toString() !== userId.toString(),
        );

        if (workspace.owner.toString() === userId.toString()) {
          // Find a project that will remain in this workspace
          const remainingProject = await Project.findOne({
            workspace: workspace._id,
          }).session(session);

          if (remainingProject) {
            // Transfer workspace ownership to the retained project owner
            workspace.owner = remainingProject.owner;

            const isAlreadyMember = workspace.members.some(
              (memberId) =>
                memberId.toString() === remainingProject.owner.toString(),
            );

            if (!isAlreadyMember) {
              workspace.members.push(remainingProject.owner);
            }
          } else if (workspace.members.length > 0) {
            // Use another workspace member as the new owner
            workspace.owner = workspace.members[0];
          } else {
            // Delete workspace if no projects or members remain
            await Workspace.deleteOne({
              _id: workspace._id,
            }).session(session);

            continue;
          }
        }

        await workspace.save({ session });
      }

      // Delete the user's account
      await User.deleteOne({
        _id: userId,
      }).session(session);
    });

    // Delete Cloudinary profile picture after database changes succeed
    if (profilePicturePublicId) {
      try {
        await cloudinary.uploader.destroy(profilePicturePublicId);
      } catch (cleanupError) {
        console.error("Profile picture cleanup error:", cleanupError);
      }
    }

    return res.status(200).json({
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);

    return res.status(500).json({
      message: "Failed to delete account. Please try again.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
