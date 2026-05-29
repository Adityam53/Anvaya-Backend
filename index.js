const { initializeDatabase } = require("./db/db.connect");
require("dotenv").config();
const Comment = require("./Models/comment.models");
const Lead = require("./Models/lead.models");
const SalesAgent = require("./Models/salesAgent.models");
const Tag = require("./Models/tag.models");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // Imported to check connection state

const corsOptions = {
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200, // Fixed typo
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

// SERVERLESS MIDDLWARE: Ensures DB is connected BEFORE processing any route
const ensureDbConnected = async (req, res, next) => {
  try {
    // mongoose.connection.readyState: 1 means connected, 2 means connecting
    if (
      mongoose.connection.readyState !== 1 &&
      mongoose.connection.readyState !== 2
    ) {
      console.log("Cold start detected: Initializing database connection...");
      await initializeDatabase();
    }
    next();
  } catch (error) {
    console.error(
      "Database connection failed during request processing:",
      error,
    );
    res.status(500).json({ error: "Database connection failed" });
  }
};

// Apply the database connection guard to all incoming requests
app.use(ensureDbConnected);

/* ==================== AGENTS ROUTES ==================== */

const createSalesAgent = async (newAgent) => {
  const agent = new SalesAgent(newAgent);
  return await agent.save();
};

app.post("/agents", async (req, res) => {
  try {
    const savedAgent = await createSalesAgent(req.body);
    res
      .status(201)
      .json({ message: "New Sales agent created successfully!", savedAgent });
  } catch (error) {
    console.error("Error in creating a new sales agent.", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Invalid input or missing required fields." });
    }
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Failed to create new agent." });
  }
});

const readAllAgents = async () => {
  return await SalesAgent.find();
};

app.get("/agents", async (req, res) => {
  try {
    const allAgents = await readAllAgents();
    // FIXED: Return empty array with 200 status instead of 404
    res.status(200).json(allAgents);
  } catch (error) {
    console.error("Error in fetching agents", error);
    res.status(500).json({ error: "Failed to fetch agents!" });
  }
});

const readAgentById = async (agentId) => {
  return await SalesAgent.findById(agentId);
};

app.get("/agents/:id", async (req, res) => {
  try {
    const agent = await readAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the agent" });
  }
});

const deleteAgentById = async (agentId) => {
  return await SalesAgent.findByIdAndDelete(agentId);
};

app.delete("/agents/:id", async (req, res) => {
  try {
    const deleteAgent = await deleteAgentById(req.params.id);
    if (!deleteAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.status(200).json(deleteAgent);
  } catch (error) {
    console.error("Error deleting agentId", error);
    res.status(500).json({ error: "An error occurred while deleting agent." });
  }
});

const createLead = async (newLead) => {
  if (newLead.status === "Closed") {
    newLead.closedAt = new Date();
  }
  const lead = new Lead(newLead);
  return await lead.save();
};

app.post("/leads", async (req, res) => {
  try {
    const savedLead = await createLead(req.body);
    res
      .status(201)
      .json({ message: "New Lead created successfully!", savedLead });
  } catch (error) {
    console.error("Error in creating a new lead", error);
    res.status(500).json({ error: "Failed to create new lead." });
  }
});

const readAllLeads = async (filters = {}) => {
  const query = {};
  if (filters.salesAgent) query.salesAgent = filters.salesAgent;
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.tags) query.tags = { $in: filters.tags.split(",") };

  return await Lead.find(query)
    .populate("salesAgent", "name email")
    .select(
      "name source salesAgent status tags timeToClose priority createdAt",
    );
};

app.get("/leads", async (req, res) => {
  try {
    const filters = {
      salesAgent: req.query.salesAgent,
      status: req.query.status,
      tags: req.query.tags,
      priority: req.query.priority,
    };
    const allLeads = await readAllLeads(filters);
    res.status(200).json(allLeads);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    res.status(500).json({ error: "An error occurred while fetching leads" });
  }
});

const readLeadsByAgentId = async (agentId, filters = {}) => {
  const query = { salesAgent: agentId };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  return await Lead.find(query).populate("salesAgent", "name email");
};

app.get("/leads/agent/:agentId", async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
    };
    const leads = await readLeadsByAgentId(req.params.agentId, filters);
    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching lead by AgentID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the lead for agent" });
  }
});

const readLeadById = async (leadId) => {
  return await Lead.findById(leadId)
    .populate("salesAgent", "name email")
    .select(
      "name source salesAgent status tags timeToClose priority createdAt",
    );
};

app.get("/leads/:id", async (req, res) => {
  try {
    const lead = await readLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.status(200).json(lead);
  } catch (error) {
    console.error("Error fetching lead by ID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the lead" });
  }
});

const updateLeadsById = async (leadId, leadData) => {
  if (leadData.status === "Closed") {
    leadData.closedAt = new Date();
  }
  return await Lead.findByIdAndUpdate(leadId, leadData, {
    new: true,
    runValidators: true,
  });
};

app.put("/leads/:id", async (req, res) => {
  try {
    const updatedLead = await updateLeadsById(req.params.id, req.body);
    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.status(200).json(updatedLead);
  } catch (error) {
    console.error("Error updating lead", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the lead" });
  }
});

const deleteLeadById = async (leadId) => {
  return await Lead.findByIdAndDelete(leadId);
};

app.delete("/leads/:id", async (req, res) => {
  try {
    const deletedLead = await deleteLeadById(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ error: "Lead not found" }); // Added explicit return
    }
    res.status(200).json({ message: "Lead deleted successfully", deletedLead });
  } catch (error) {
    console.error("Error in deleting lead", error);
    res
      .status(500)
      .json({ error: "An error occured while deleting the lead!" });
  }
});

const readAllComments = async (leadId) => {
  return await Comment.find({ lead: leadId })
    .populate("lead", "name")
    .populate("author", "name email");
};

app.get("/leads/:id/comments", async (req, res) => {
  try {
    const allComments = await readAllComments(req.params.id);
    res.status(200).json(allComments); // Fixed empty state handler to be standard 200
  } catch (error) {
    console.error("Failed to fetch data", error);
    res.status(500).json({ error: "An error occured while fetching comments" });
  }
});

const createComment = async (newComment) => {
  const comment = new Comment(newComment);
  return await comment.save();
};

app.post("/leads/:id/comments", async (req, res) => {
  try {
    const savedComment = await createComment(req.body);
    res
      .status(201)
      .json({ message: "Comment added successfully!", savedComment });
  } catch (error) {
    console.error("Error in adding comment", error);
    res.status(500).json({
      error: "Failed to add comment. Make sure Lead/Author IDs are correct.",
    });
  }
});

const createTags = async (newTag) => {
  const tag = new Tag(newTag);
  return await tag.save();
};

app.post("/tags", async (req, res) => {
  try {
    const tag = await createTags(req.body);
    res.status(200).json({ message: "Tag created successfully!", tag });
  } catch (error) {
    console.error("Error in creating tag.", error);
    res.status(500).json({ error: "Failed to create new tag." });
  }
});

const readAllTags = async () => {
  return await Tag.find();
};

app.get("/tags", async (req, res) => {
  try {
    const tags = await readAllTags();
    res.status(200).json(tags); // Fixed empty state handler
  } catch (error) {
    console.error("Error in fetching tags.");
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});

const PIPELINE_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
];

const CLOSED_STATUS = "Closed";

/* ==========================================================================
   RECENT CLOSED DEALS (LAST 7 DAYS)
   ========================================================================== */

const readRecentClosedDeals = async () => {
  // UTC-safe date calculation
  const now = new Date();

  const sevenDaysAgo = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 7,
      0,
      0,
      0,
    ),
  );

  return await Lead.find({
    status: CLOSED_STATUS,
    closedAt: {
      $exists: true,
      $ne: null,
      $gte: sevenDaysAgo,
    },
  })
    .populate("salesAgent", "name email")
    .select(
      "name source salesAgent status closedAt priority createdAt updatedAt",
    )
    .sort({ closedAt: -1 })
    .lean();
};

app.get("/report/last-week", async (req, res) => {
  try {
    const recentClosedLeads = await readRecentClosedDeals();

    res.status(200).json({
      success: true,
      count: recentClosedLeads.length,
      data: recentClosedLeads,
    });
  } catch (error) {
    console.error("Error fetching recent closed leads:", error);

    res.status(500).json({
      success: false,
      error: "An error occurred while fetching recent closed leads.",
    });
  }
});

/* ==========================================================================
   PIPELINE LEADS COUNT
   ========================================================================== */

const readLeadsInPipeline = async () => {
  return await Lead.countDocuments({
    status: {
      $in: PIPELINE_STATUSES,
    },
  });
};

app.get("/report/pipeline", async (req, res) => {
  try {
    const totalLeadsInPipeline = await readLeadsInPipeline();

    res.status(200).json({
      success: true,
      totalLeadsInPipeline,
    });
  } catch (error) {
    console.error("Error fetching leads in pipeline:", error);

    res.status(500).json({
      success: false,
      error: "An error occurred while fetching leads in pipeline.",
    });
  }
});

/* ==========================================================================
   CLOSED LEADS BY AGENT
   ========================================================================== */

const readClosedLeadsByAgent = async () => {
  return await Lead.aggregate([
    {
      $match: {
        status: CLOSED_STATUS,
      },
    },

    {
      $group: {
        _id: "$salesAgent",
        closedLeadsCount: {
          $sum: 1,
        },
      },
    },

    {
      $lookup: {
        from: "salesagents", // VERIFY this collection name in MongoDB
        localField: "_id",
        foreignField: "_id",
        as: "salesAgentDetails",
      },
    },

    {
      $unwind: {
        path: "$salesAgentDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,

        salesAgentId: "$_id",

        salesAgentName: {
          $ifNull: ["$salesAgentDetails.name", "Unassigned / Deleted Agent"],
        },

        salesAgentEmail: {
          $ifNull: ["$salesAgentDetails.email", null],
        },

        closedLeadsCount: 1,
      },
    },

    {
      $sort: {
        closedLeadsCount: -1,
      },
    },
  ]);
};

app.get("/report/closed-by-agent", async (req, res) => {
  try {
    const closedLeadsByAgent = await readClosedLeadsByAgent();

    res.status(200).json({
      success: true,
      count: closedLeadsByAgent.length,
      data: closedLeadsByAgent,
    });
  } catch (error) {
    console.error("Error fetching closed leads by agent:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch closed leads by agent.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
