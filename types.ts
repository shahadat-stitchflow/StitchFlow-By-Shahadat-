
export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED'
}

export type WorkflowStepId = 
  | 'design'
  | 'fabrics'
  | 'pattern'
  | 'prototype'
  | 'final_approval';

export interface StepRecord {
  id: string;
  note: string;
  imageUrl?: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  status: StepStatus;
  updatedAt: string;
  dueDate?: string;
  records?: StepRecord[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  companyRole: string;
  isAdmin: boolean;
  color?: string;
}

export interface CollaborationState {
  userId: string;
  userName: string;
  userColor: string;
  activeSection?: string;
  lastSeen: number;
}

// Added ChatMessage interface to resolve missing exported member error in AIAdvisor.tsx
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Project {
  id: string;
  styleName: string;
  styleNumber: string;
  buyerName: string;
  season: string;
  quantity: number;
  shipDate: string;
  currentStepIndex: number;
  workflow: WorkflowStep[];
  productImageUrl?: string;
  merchandiserNotes?: string;
  fabricType?: string;
  fabricWeight?: string;
  fabricComposition?: string;
  // Added fields to support usage in App.tsx and ProjectDashboard components
  isUrgent?: boolean;
  techPackUrl?: string;
  todoItems?: any[];
  targetFob?: number;
  gender?: string;
  colorways?: string;
}
