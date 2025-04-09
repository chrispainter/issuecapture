import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertIssueSchema, insertMediaSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept images, videos, audios, and common document types
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed'
    ];
    
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audios, and specific document types are allowed.'), false);
    }
  }
});

// Function to simulate Jira ticket creation (would connect to actual Jira API in production)
async function createJiraTicket(issueData: any): Promise<string> {
  // In a real app, you would call the Jira API here
  // For now, we'll simulate it by generating a random ticket ID
  const ticketPrefix = "IRS";
  const ticketNumber = Math.floor(1000 + Math.random() * 9000);
  return `${ticketPrefix}-${ticketNumber}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints
  app.get("/api/issues", async (req: Request, res: Response) => {
    try {
      const issues = await storage.getIssues();
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssue(id);
      
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      // Get associated media
      const media = await storage.getMediaForIssue(id);
      
      res.json({ issue, media });
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  // Create issue with possible file attachments
  app.post("/api/issues", upload.array('files'), async (req: Request, res: Response) => {
    try {
      // Parse issue data
      const issueData = JSON.parse(req.body.issueData);
      
      // Validate using Zod schema
      const validatedIssueData = insertIssueSchema.parse(issueData);
      
      // Create issue in storage
      const issue = await storage.createIssue(validatedIssueData);
      
      // Process uploaded files if any
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const mediaType = file.mimetype.startsWith('image/') ? 'photo' :
                           file.mimetype.startsWith('video/') ? 'video' :
                           file.mimetype.startsWith('audio/') ? 'audio' : 'file';
          
          const mediaData = {
            issueId: issue.id,
            type: mediaType,
            filename: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            transcription: null // Would be filled by a transcription service for audio files
          };
          
          const validatedMediaData = insertMediaSchema.parse(mediaData);
          await storage.createMedia(validatedMediaData);
        }
      }
      
      // Create Jira ticket
      const jiraTicketId = await createJiraTicket(issue);
      
      // Update issue with Jira ticket ID
      const updatedIssue = await storage.updateJiraTicketId(issue.id, jiraTicketId);
      
      res.status(201).json({ 
        issue: updatedIssue, 
        message: "Issue reported successfully",
        ticketId: jiraTicketId
      });
    } catch (error) {
      console.error("Error creating issue:", error);
      
      // Clean up any uploaded files on error
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
      }
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ error: "Failed to create issue report" });
    }
  });

  // Serve uploaded files
  app.get("/uploads/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
