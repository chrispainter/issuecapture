import { issues, type Issue, type InsertIssue, media, type Media, type InsertMedia, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Issue methods
  getIssue(id: number): Promise<Issue | undefined>;
  getIssues(): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, updates: Partial<InsertIssue>): Promise<Issue | undefined>;
  updateJiraTicketId(id: number, jiraTicketId: string): Promise<Issue | undefined>;
  
  // Media methods
  getMediaForIssue(issueId: number): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private issues: Map<number, Issue>;
  private medias: Map<number, Media>;
  private currentUserId: number;
  private currentIssueId: number;
  private currentMediaId: number;

  constructor() {
    this.users = new Map();
    this.issues = new Map();
    this.medias = new Map();
    this.currentUserId = 1;
    this.currentIssueId = 1;
    this.currentMediaId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }

  async getIssues(): Promise<Issue[]> {
    return Array.from(this.issues.values());
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.currentIssueId++;
    const createdAt = new Date();
    const issue: Issue = { 
      ...insertIssue, 
      id, 
      status: "submitted", 
      createdAt,
      jiraTicketId: null
    };
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssue(id: number, updates: Partial<InsertIssue>): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { ...issue, ...updates };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  async updateJiraTicketId(id: number, jiraTicketId: string): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { ...issue, jiraTicketId, status: "processed" };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  // Media methods
  async getMediaForIssue(issueId: number): Promise<Media[]> {
    return Array.from(this.medias.values()).filter(
      (media) => media.issueId === issueId
    );
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = this.currentMediaId++;
    const createdAt = new Date();
    const media: Media = { ...insertMedia, id, createdAt };
    this.medias.set(id, media);
    return media;
  }
}

export const storage = new MemStorage();
