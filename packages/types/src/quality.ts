// ─── Quality Domain ───────────────────────────────────────────

export type QCType = 'incoming' | 'in-process' | 'final';
export type QCResult = 'pass' | 'fail' | 'conditional-pass';

export interface QCPlan {
  id: string;
  productId: string;
  qcType: QCType;
  checklists: QCChecklist[];
}

export interface QCChecklist {
  id: string;
  qcPlanId: string;
  checkpointName: string;
  description?: string;
  acceptanceCriteria: string;
  sortOrder: number;
}

export interface QCInspection {
  id: string;
  workOrderId?: string;
  workOrderStepId?: string;
  qcPlanId: string;
  qcType: QCType;
  result: QCResult;
  inspectedBy: string;
  inspectedAt: string;
  notes?: string;
  defects: Defect[];
  photos: QCPhoto[];
}

export interface Defect {
  id: string;
  inspectionId: string;
  defectType: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  quantity: number;
}

export interface NCR {
  id: string;
  inspectionId: string;
  workOrderId: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  correctiveActions: CorrectiveAction[];
  createdAt: string;
}

export interface CorrectiveAction {
  id: string;
  ncrId: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
}

export interface QCPhoto {
  id: string;
  inspectionId: string;
  fileUrl: string;
  caption?: string;
  uploadedAt: string;
}
