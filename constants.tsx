
import { WorkflowStepId, StepStatus, Project, WorkflowStep } from './types';

export const WORKFLOW_STRUCTURE: { id: WorkflowStepId; label: string }[] = [
  { id: 'inquiry', label: 'Buyer Inquiry' },
  { id: 'design_dev', label: 'Design Dev' },
  { id: 'costing_quotation', label: 'Costing/Quote' },
  { id: 'proto_sample', label: 'Proto Sample' },
  { id: 'fit_sample', label: 'Fit Sample' },
  { id: 'lab_dip', label: 'Lab Dip' },
  { id: 'final_costing', label: 'Final Costing' },
  { id: 'po_release', label: 'PO Release' },
  { id: 'fabric_procurement', label: 'Fabric Sourcing' },
  { id: 'trims_procurement', label: 'Trims Sourcing' },
  { id: 'pp_meeting', label: 'PP Meeting' },
  { id: 'bulk_cutting', label: 'Bulk Cutting' },
  { id: 'sewing', label: 'Sewing Line' },
  { id: 'finishing', label: 'Finishing' },
  { id: 'inspection', label: 'Final Inspection' },
  { id: 'shipment', label: 'Shipment' },
];

const generateDueDate = (baseIdx: number, currentIdx: number) => {
  const date = new Date();
  date.setDate(date.getDate() + (currentIdx - baseIdx) * 5); // 5 days average per stage
  return date.toISOString().split('T')[0];
};

export const createInitialWorkflow = (): WorkflowStep[] => {
  return WORKFLOW_STRUCTURE.map((step, idx) => ({
    id: step.id,
    label: step.label,
    status: idx === 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
    updatedAt: new Date().toISOString(),
    dueDate: generateDueDate(0, idx),
    records: []
  }));
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    styleName: 'Slim Fit Chino',
    styleNumber: 'CH-24-UBN',
    buyerName: 'Urban Outfitters',
    season: 'Autumn 24',
    quantity: 5000,
    shipDate: '2024-10-15',
    currentStepIndex: 2,
    productImageUrl: 'https://images.unsplash.com/photo-1473963441512-7064619d77e4?q=80&w=800&auto=format&fit=crop',
    fabricType: '98% Cotton 2% Spandex',
    targetFob: 9.50,
    gender: 'Mens',
    colorways: '3',
    workflow: WORKFLOW_STRUCTURE.map((step, idx) => ({
      id: step.id,
      label: step.label,
      status: idx < 2 ? StepStatus.COMPLETED : idx === 2 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
      updatedAt: new Date().toISOString(),
      dueDate: generateDueDate(2, idx),
      records: []
    })),
  },
  {
    id: 'p2',
    styleName: 'Oversized Logo Hoodie',
    styleNumber: 'HD-24-ZAR',
    buyerName: 'Zara',
    season: 'Winter 24',
    quantity: 12000,
    shipDate: '2024-11-20',
    currentStepIndex: 5,
    productImageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    fabricType: 'Heavy Fleece 400GSM',
    targetFob: 14.20,
    gender: 'Unisex',
    colorways: '4',
    isUrgent: true,
    workflow: WORKFLOW_STRUCTURE.map((step, idx) => ({
      id: step.id,
      label: step.label,
      status: idx < 5 ? StepStatus.COMPLETED : idx === 5 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
      updatedAt: new Date().toISOString(),
      dueDate: generateDueDate(5, idx),
      records: []
    })),
  }
];
