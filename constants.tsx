
import { WorkflowStepId, StepStatus, Project } from './types';

export const WORKFLOW_STRUCTURE: { id: WorkflowStepId; label: string }[] = [
  { id: 'design', label: 'Design' },
  { id: 'fabrics', label: 'Fabrics' },
  { id: 'pattern', label: 'Pattern' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'final_approval', label: 'Final Approval' },
];

const generateDueDate = (baseIdx: number, currentIdx: number) => {
  const date = new Date();
  date.setDate(date.getDate() + (currentIdx - baseIdx) * 7);
  return date.toISOString().split('T')[0];
};

export const createInitialWorkflow = () => {
  return WORKFLOW_STRUCTURE.map((step, idx) => ({
    id: step.id,
    label: step.label,
    status: idx === 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
    updatedAt: new Date().toISOString(),
    dueDate: generateDueDate(0, idx),
  }));
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    styleName: 'Slim Fit Chino',
    styleNumber: 'CH-2024-001',
    buyerName: 'Urban Outfitters',
    season: 'Autumn 24',
    quantity: 5000,
    shipDate: '2024-10-15',
    currentStepIndex: 1,
    productImageUrl: 'https://images.unsplash.com/photo-1473963441512-7064619d77e4?q=80&w=800&auto=format&fit=crop',
    workflow: WORKFLOW_STRUCTURE.map((step, idx) => ({
      id: step.id,
      label: step.label,
      status: idx < 1 ? StepStatus.COMPLETED : idx === 1 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
      updatedAt: new Date().toISOString(),
      dueDate: generateDueDate(1, idx),
    })),
  },
  {
    id: 'p2',
    styleName: 'Heavyweight Hoodie',
    styleNumber: 'HD-2024-082',
    buyerName: 'Zara Men',
    season: 'Winter 24',
    quantity: 12000,
    shipDate: '2024-11-20',
    currentStepIndex: 3,
    productImageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    workflow: WORKFLOW_STRUCTURE.map((step, idx) => ({
      id: step.id,
      label: step.label,
      status: idx < 3 ? StepStatus.COMPLETED : idx === 3 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
      updatedAt: new Date().toISOString(),
      dueDate: generateDueDate(3, idx),
    })),
  }
];
