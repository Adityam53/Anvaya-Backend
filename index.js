const { initializeDatabase } = require("./db/db.connect");
require("dotenv").config();
const Comment = require("./Models/comment.models");
const Lead = require("./Models/lead.models");
const SalesAgent = require("./Models/salesAgent.models");
const Tag = require("./Models/tag.models");
const express = require("express");
const cors = require("cors");

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

initializeDatabase();

const createSalesAgent = async (newAgent) => {
  try {
    const agent = new SalesAgent(newAgent);
    const savedAgent = await agent.save();
    return savedAgent;
  } catch (error) {
    throw error;
  }
};

app.post("/agents", async (req, res) => {
  try {
    const savedAgent = await createSalesAgent(req.body);
    console.log(savedAgent);

    res.status(201).json({ message: "New Sales agent created successfully!" });
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
  try {
    const allAgents = await SalesAgent.find();
    return allAgents;
  } catch (error) {
    throw error;
  }
};

app.get("/agents", async (req, res) => {
  try {
    const allAgents = await readAllAgents();

    if (allAgents.length > 0) {
      res.status(200).json(allAgents);
    } else {
      res.status(404).json({ error: "No leads found" });
    }
  } catch (error) {
    console.error("Error in fetching agents", error);
    res.status(500).json({ error: "Failed to fetch agents!" });
  }
});

const readAgentById = async (agentId) => {
  try {
    const agent = await SalesAgent.findById(agentId);
    return agent;
  } catch (error) {
    throw error;
  }
};

app.get("/agents/:id", async (req, res) => {
  try {
    const agentId = req.params.id;
    const agent = await readAgentById(agentId);

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

const createLead = async (newLead) => {
  try {
    if (newLead.status === "Closed") {
      newLead.closedAt = new Date();
    }

    const lead = new Lead(newLead);
    const savedLead = await lead.save();
    return savedLead;
  } catch (error) {
    throw error;
  }
};

app.post("/leads", async (req, res) => {
  try {
    const savedLead = await createLead(req.body);
    console.log(savedLead);
    res
      .status(201)
      .json({ message: "New Lead created successfully!", savedLead });
  } catch (error) {
    console.log("Error in creating a new lead", error);
    res.status(500).json({ error: "Failed to create new lead." });
  }
});

//fetch all the leads with filters using mongodb queries

const readAllLeads = async (filters = {}) => {
  try {
    const query = {};

    if (filters.salesAgent) query.salesAgent = filters.salesAgent;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.tags) query.tags = { $in: filters.tags.split(",") };

    const allLeads = await Lead.find(query)
      .populate("salesAgent", "name email")
      .select(
        "name source salesAgent status tags timeToClose priority createdAt"
      );
    return allLeads;
  } catch (error) {
    throw error;
  }
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

    if (allLeads.length > 0) {
      res.status(200).json(allLeads);
    } else {
      res.status(404).json({ error: "No leads found" });
    }
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    res.status(500).json({ error: "An error occurred while fetching leads" });
  }
});

const readLeadsByAgentId = async (agentId) => {
  try {
    const leads = await Lead.find({ salesAgent: agentId }).populate(
      "salesAgent",
      "name email"
    );
    return leads;
  } catch (error) {
    throw error;
  }
};

app.get("/leads/agent/:agentId", async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const lead = await readLeadsByAgentId(agentId);

    if (!lead) {
      return res
        .status(404)
        .json({ error: "No assigned leads found for this agent." });
    }

    res.status(200).json(lead);
  } catch (error) {
    console.error("Error fetching lead by AgentID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the lead for agent" });
  }
});

const readLeadById = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId)
      .populate("salesAgent", "name email")
      .select(
        "name source salesAgent status tags timeToClose priority createdAt"
      );
    return lead;
  } catch (error) {
    throw error;
  }
};

app.get("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;
    const lead = await readLeadById(leadId);

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
  try {
    const updatedLead = await Lead.findByIdAndUpdate(leadId, leadData, {
      new: true,
      runValidators: true,
    });
    return updatedLead;
  } catch (error) {
    throw error;
  }
};

app.put("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;
    const leadData = req.body;
    console.log("body reached", leadData);
    const updatedLead = await updateLeadsById(leadId, leadData);
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
  try {
    const deletedLead = await Lead.findByIdAndDelete(leadId);
    return deletedLead;
  } catch (error) {
    throw error;
  }
};

app.delete("/leads/:id", async (req, res) => {
  try {
    const deletedLead = await deleteLeadById(req.params.id);

    if (!deletedLead) {
      res.status(404).json({ error: "Lead not found" });
    } else {
      res
        .status(200)
        .json({ message: "Lead deleted successfully", deletedLead });
    }
  } catch (error) {
    console.error("Error in deleting lead", error);
    res
      .status(500)
      .json({ error: "An error occured while deleting the lead!" });
  }
});

const readAllComments = async (leadId) => {
  try {
    const allComments = await Comment.find({ lead: leadId })
      .populate("lead", "name ")
      .populate("author", "name email");
    return allComments;
  } catch (error) {
    throw error;
  }
};

app.get("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;
    const allComments = await readAllComments(leadId);
    if (allComments.length > 0) {
      res.json(allComments);
    } else {
      res.status(404).json({ error: "No comments found for this lead ID." });
    }
  } catch (error) {
    console.error("Failed to fetch data", error);
    res.status(500).json({ error: "An error occured while fetching comments" });
  }
});

const createComment = async (newComment) => {
  try {
    const comment = new Comment(newComment);
    const savedComment = comment.save();
    return savedComment;
  } catch (error) {
    throw error;
  }
};

app.post("/leads/:id/comments", async (req, res) => {
  try {
    const savedComment = await createComment(req.body);
    console.log(savedComment);
    res
      .status(201)
      .json({ message: "Comment added successfully!", savedComment });
  } catch (error) {
    console.log("Error in adding comment", error);
    res.status(404).json({ error: "Lead with the given ID not found." });
  }
});

const createTags = async (newTag) => {
  try {
    const tag = new Tag(newTag);
    const savedTag = await tag.save();
    return savedTag;
  } catch (error) {
    throw error;
  }
};

app.post("/tags", async (req, res) => {
  try {
    const tag = await createTags(req.body);
    console.log(tag);
    res.status(200).json({ message: "Tag created successfully!" });
  } catch (error) {
    console.error("Error in creating tag.", error);
    res.status(500).json({ error: "Failed to create new tag." });
  }
});

const readAllTags = async () => {
  try {
    const allTags = await Tag.find();
    return allTags;
  } catch (error) {
    throw error;
  }
};

app.get("/tags", async (req, res) => {
  try {
    const tags = await readAllTags();
    if (tags.length > 0) {
      res.status(200).json(tags);
    } else {
      res.status(404).json({ error: "Tags not found." });
    }
  } catch (error) {
    console.error("Error in fetching tags.");
    res.status(500).json({ error: "Failed to fetch atgs." });
  }
});

const readRecentClosedDeals = async () => {
  try {
    const sevenDayAgo = new Date();
    sevenDayAgo.setDate(sevenDayAgo.getDate() - 7);

    const recentClosedLeads = await Lead.find({
      status: "Closed",
      closedAt: { $gte: sevenDayAgo },
    })
      .populate("salesAgent", "name email")
      .select("name source salesAgent status closedAt priority");
    return recentClosedLeads;
  } catch (error) {
    throw error;
  }
};

app.get("/report/last-week", async (req, res) => {
  try {
    const recentClosedLeads = await readRecentClosedDeals();

    if (recentClosedLeads.length > 0) {
      res.status(200).json(recentClosedLeads);
    } else {
      res
        .status(404)
        .json({ error: "No leads closed in the last seven days." });
    }
  } catch (error) {
    console.error("Error fetching recent closed leads:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recent closed leads." });
  }
});

const readLeadsInPipeline = async () => {
  try {
    const totalLeadsInPipeline = await Lead.find({ status: { $ne: "Closed" } });
    return totalLeadsInPipeline;
  } catch (error) {
    throw error;
  }
};

app.get("/report/pipeline", async (req, res) => {
  try {
    const totalLeadsInPipeline = await readLeadsInPipeline();

    if (totalLeadsInPipeline.length > 0) {
      res.status(200).json({
        totalLeadsInPipeline: totalLeadsInPipeline.length,
      });
    } else {
      res.status(404).json({ error: "No Leads found in pipeline." });
    }
  } catch (error) {
    console.error("Error fetching leads in pipeline");
    res
      .status(500)
      .json({ error: "An error occurred while fetching leads in pipeline." });
  }
});

const readClosedLeadsByAgent = async () => {
  try {
    const closedLeadsByAgent = await Lead.aggregate([
      { $match: { status: "Closed" } },
      {
        $group: {
          _id: "$salesAgent",
          closedLeadsCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "salesagents",
          localField: "_id",
          foreignField: "_id",
          as: "salesAgentDetails",
        },
      },
      {
        $unwind: "$salesAgentDetails",
      },
      {
        $project: {
          _id: 0,
          salesAgentId: "$salesAgentDetails._id",
          salesAgentName: "$salesAgentDetails.name",
          closedLeadsCount: 1,
        },
      },
    ]);

    return closedLeadsByAgent;
  } catch (error) {
    throw error;
  }
};

app.get("/report/closed-by-agent", async (req, res) => {
  try {
    const closedLeadsByAgent = await readClosedLeadsByAgent();

    if (closedLeadsByAgent.length > 0) {
      const formatted = closedLeadsByAgent.map((item) => ({
        salesAgentId: item.salesAgentId,
        salesAgentName: item.salesAgentName,
        closedLeadsCount: item.closedLeadsCount,
      }));

      res.status(200).send(formatted);
    } else {
      res.status(404).json({ error: "No closed leads found" });
    }
  } catch (error) {
    console.error("Error in fetching closed leads by agent", error);
    res.status(500).json({ error: "Failed to fetch closed leads by agent" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
