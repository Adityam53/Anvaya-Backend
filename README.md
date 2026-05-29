# Anvaya CRM - Backend API

Backend API for **Anvaya CRM**, a modern CRM platform designed to manage leads, sales agents, comments, tags, and analytics reporting.

Built using:

* Node.js
* Express.js
* MongoDB
* Mongoose

---

# Features

## Sales Agent Management

* Create sales agents
* Fetch all agents
* Fetch agent by ID
* Delete agent
* Duplicate email protection

---

## Lead Management

* Create leads
* Fetch all leads
* Filter leads by:

  * Sales Agent
  * Status
  * Priority
  * Tags
* Fetch lead by ID
* Update lead
* Delete lead
* Auto-track lead closing date

---

## Comment System

* Add comments to leads
* Fetch all comments for a lead
* Populate author and lead details

---

## Tag Management

* Create tags
* Fetch all tags

---

## Analytics & Reports

### Leads Closed Last Week

* Returns total closed leads grouped by date

### Closed Leads by Sales Agent

* Returns distribution of closed leads by sales agent

### Pipeline Distribution

* Returns lead counts grouped by pipeline stages

---

# Tech Stack

| Technology | Purpose               |
| ---------- | --------------------- |
| Node.js    | Runtime               |
| Express.js | Backend Framework     |
| MongoDB    | Database              |
| Mongoose   | ODM                   |
| dotenv     | Environment Variables |
| cors       | Cross-Origin Requests |

---

# Project Structure

```bash
├── db
│   └── db.connect.js
│
├── Models
│   ├── comment.models.js
│   ├── lead.models.js
│   ├── salesAgent.models.js
│   └── tag.models.js
│
├── .env
├── package.json
├── server.js
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone <https://github.com/Adityam53/Anvaya-Backend.git>
cd anvaya-crm-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Setup Environment Variables

Create a `.env` file in the root directory.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
```

---

# Running the Server

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

---

# API Base URL

```bash
http://localhost:3000
```

---

# API Endpoints

# Sales Agents

## Create Agent

### POST `/agents`

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Get All Agents

### GET `/agents`

---

## Get Agent By ID

### GET `/agents/:id`

---

## Delete Agent

### DELETE `/agents/:id`

---

# Leads

## Create Lead

### POST `/leads`

### Request Body

```json
{
  "name": "Acme Corp",
  "source": "Website",
  "salesAgent": "agent_id",
  "status": "New",
  "priority": "High",
  "tags": ["Enterprise"]
}
```

---

## Get All Leads

### GET `/leads`

### Query Parameters

| Parameter  | Description           |
| ---------- | --------------------- |
| salesAgent | Filter by sales agent |
| status     | Filter by status      |
| priority   | Filter by priority    |
| tags       | Filter by tags        |

Example:

```bash
/leads?status=Closed&priority=High
```

---

## Get Leads By Agent

### GET `/leads/agent/:agentId`

---

## Get Lead By ID

### GET `/leads/:id`

---

## Update Lead

### PUT `/leads/:id`

---

## Delete Lead

### DELETE `/leads/:id`

---

# Comments

## Add Comment

### POST `/leads/:id/comments`

### Request Body

```json
{
  "lead": "lead_id",
  "author": "agent_id",
  "content": "Followed up with the client."
}
```

---

## Get Lead Comments

### GET `/leads/:id/comments`

---

# Tags

## Create Tag

### POST `/tags`

### Request Body

```json
{
  "name": "Hot Lead"
}
```

---

## Get All Tags

### GET `/tags`

---

# Analytics APIs

# 1. Leads Closed Last Week

### GET `/report/last-week`

### Sample Response

```json
{
  "success": true,
  "totalClosedLeads": 14,
  "data": [
    {
      "date": "2026-05-22",
      "closedCount": 3
    }
  ]
}
```

---

# 2. Closed Leads By Agent

### GET `/report/closed-by-agent`

### Sample Response

```json
{
  "success": true,
  "totalAgents": 5,
  "data": [
    {
      "salesAgentName": "John Doe",
      "closedLeadsCount": 12
    }
  ]
}
```

---

# 3. Pipeline Distribution

### GET `/report/pipeline`

### Sample Response

```json
{
  "success": true,
  "totalPipelineLeads": 25,
  "data": [
    {
      "status": "Qualified",
      "totalLeads": 8
    }
  ]
}
```

---

# Lead Pipeline Stages

```text
New
Contacted
Qualified
Proposal Sent
Negotiation
Closed
```

---

# Database Connection Strategy

This project includes a **serverless-safe MongoDB connection middleware**.

Features:

* Prevents multiple DB connections
* Handles cold starts
* Automatically reconnects when required
* Optimized for deployment platforms like:

  * Vercel
  * Render
  * Railway

---

# Error Handling

The API includes:

* Validation error handling
* Duplicate email protection
* Standardized HTTP status codes
* Internal server error handling

---

# Future Improvements

* Authentication & Authorization
* JWT-based login
* Role-based access control
* Pagination
* Search & sorting
* Email notifications
* Activity logs
* Dashboard metrics
* WebSocket real-time updates

---

# Author
## Aditya Moorjmalani
Developed for the **Anvaya CRM** platform.

# Contact
For bugs or improvements contact adityamoorjmalani53@gmail.com
---
