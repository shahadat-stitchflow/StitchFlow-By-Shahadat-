
export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED'
}

export type WorkflowStepId = 
  | 'inquiry'
  | 'design_dev'
  | 'costing_quotation'
  | 'proto_sample'
  | 'fit_sample'
  | 'lab_dip'
  | 'final_costing'
  | 'po_release'
  | 'fabric_procurement'
  | 'trims_procurement'
  | 'pp_meeting'
  | 'bulk_cutting'
  | 'sewing'
  | 'finishing'
  | 'inspection'
  | 'shipment';

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
  aiSummary?: string;
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
  isUrgent?: boolean;
  techPackUrl?: string;
  techPackName?: string;
  costingSheetUrl?: string;
  costingSheetName?: string;
  todoItems?: any[];
  targetFob?: number;
  gender?: string;
  colorways?: string;
}
