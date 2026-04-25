// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PM = 'PM',
  TEAM_LEAD = 'TEAM_LEAD',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Project Types
export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  client?: string;
  accountId?: string;
  account?: Account;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget?: number;
  price: number;
  currency: string;
  progress: number;
  managerId: string;
  manager?: User;
  members?: ProjectMember[];
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tasks: number;
    worklogs: number;
    raidItems: number;
  };
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  role: string;
  allocation: number;
  joinedAt: string;
  leftAt?: string;
}

export interface ProjectSettings {
  hoursPerDay: number;
  workDays: number[];
  costCalculation: 'assignee' | 'role';
  timezone?: string;
}

// Task Types
export interface Task {
  id: string;
  projectId: string;
  parentId?: string;
  parent?: Task;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  plannedHours?: number;
  actualHours: number;
  baselineStart?: string | null;
  baselineFinish?: string | null;
  actualStart?: string | null;
  actualFinish?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  createdById: string;
  createdBy?: User;
  assignedToId?: string;
  assignedTo?: User;
  order: number;
  createdAt: string;
  updatedAt: string;
  subtasks?: Task[];
  dependencies?: TaskDependency[];
  worklogs?: Worklog[];
  comments?: Comment[];
  _count?: {
    subtasks: number;
    worklogs: number;
    comments: number;
  };
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  dependsOn?: Task;
  type: DependencyType;
  lag: number;
  createdAt: string;
}

export enum DependencyType {
  FS = 'FS',
  SS = 'SS',
  FF = 'FF',
  SF = 'SF',
}

// Worklog Types
export interface Worklog {
  id: string;
  projectId: string;
  project?: Project;
  taskId?: string;
  task?: Task;
  userId: string;
  user?: User;
  date: string;
  hours: number;
  description?: string;
  whatDone?: string;
  whatNext?: string;
  blockers?: string;
  createdAt: string;
  updatedAt: string;
}

// RAID Types
export interface RAIDItem {
  id: string;
  projectId: string;
  project?: Project;
  type: RAIDType;
  title: string;
  description: string;
  impact?: ImpactLevel;
  probability?: ProbabilityLevel;
  riskScore?: number;
  status: RAIDStatus;
  priority: TaskPriority;
  ownerId: string;
  owner?: User;
  mitigation?: string;
  identifiedDate: string;
  targetDate?: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum RAIDType {
  RISK = 'RISK',
  ASSUMPTION = 'ASSUMPTION',
  ISSUE = 'ISSUE',
  DEPENDENCY = 'DEPENDENCY',
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProbabilityLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum RAIDStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  MITIGATED = 'MITIGATED',
  CLOSED = 'CLOSED',
}

// Rate Card Types
export interface RateCard {
  id: string;
  userId?: string;
  user?: User;
  role?: string;
  costRate: number;
  billRate?: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// Report Types
export interface Report {
  id: string;
  projectId: string;
  project?: Project;
  type: ReportType;
  period: string;
  title: string;
  content: any;
  generatedById: string;
  generatedBy?: User;
  createdAt: string;
}

export enum ReportType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

// Account Types
export interface Account {
  id: string;
  name: string;
  code: string;
  industry?: string;
  size?: string;
  status: AccountStatus;
  healthScore?: number;
  renewalProbability?: number;
  annualValue?: number;
  lifetimeValue?: number;
  primaryContact?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  nextReviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
  _count?: {
    projects: number;
    reviews: number;
  };
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  AT_RISK = 'AT_RISK',
  CHURNED = 'CHURNED',
  DORMANT = 'DORMANT',
}

// Comment Types
export interface Comment {
  id: string;
  taskId?: string;
  content: string;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
