export type Project = {
  id: string;
  name: string;
  address?: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
};

export type InspectionVisit = {
  id: string;
  projectId: string;
  inspectorName: string;
  visitDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskScope = 'project' | 'visit';
export type TaskStatus = 'todo' | 'done';

export type TaskItem = {
  id: string;
  projectId: string;
  visitId?: string;
  scope: TaskScope;
  title: string;
  description?: string;
  status: TaskStatus;
  category?: string;
  completedAt?: string;
  completedVisitId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DefectStatus = 'open' | 'in_progress' | 'done' | 'verified' | 'closed';
export type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Defect = {
  id: string;
  projectId: string;
  firstSeenVisitId: string;
  lastUpdatedVisitId?: string;
  title: string;
  description?: string;
  location?: string;
  trade?: string;
  severity: DefectSeverity;
  status: DefectStatus;
  statusUpdatedAt: string;
  responsibleParty?: string;
  dueDate?: string;
  doneAt?: string;
  doneVisitId?: string;
  verifiedAt?: string;
  closedAt?: string;
  photos: PhotoAttachment[];
  statusHistory: DefectStatusChange[];
  createdAt: string;
  updatedAt: string;
};

export type DefectStatusChange = {
  id: string;
  projectId: string;
  defectId: string;
  visitId?: string;
  fromStatus?: DefectStatus;
  toStatus: DefectStatus;
  note?: string;
  changedAt: string;
};

export type PhotoAttachment = {
  id: string;
  defectId: string;
  dataUrl: string;
  fileName?: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
};

export type NewProjectInput = {
  name: string;
  address?: string;
  clientName?: string;
};

export type NewVisitInput = {
  projectId: string;
  inspectorName: string;
  visitDate: string;
  notes?: string;
};

export type NewTaskInput = {
  projectId: string;
  visitId?: string;
  scope?: TaskScope;
  title: string;
  description?: string;
  category?: string;
};

export type NewDefectInput = {
  projectId: string;
  firstSeenVisitId: string;
  title: string;
  description?: string;
  location?: string;
  trade?: string;
  severity?: DefectSeverity;
  status?: DefectStatus;
  responsibleParty?: string;
  dueDate?: string;
  photos?: PhotoDraft[];
};

export type PhotoDraft = {
  id?: string;
  dataUrl: string;
  fileName?: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt?: string;
};

export type DefectFilterMode =
  | 'active'
  | 'all'
  | 'new_this_visit'
  | 'in_progress'
  | 'done_this_visit'
  | 'history'
  | 'high_critical';

export type DefectFilter = {
  mode: DefectFilterMode;
  severity?: DefectSeverity | 'all';
  query?: string;
  visitId?: string;
};

export type ProjectSummary = {
  totalTasks: number;
  completedTasks: number;
  activeDefects: number;
  newDefectsThisVisit: number;
  doneThisVisit: number;
  totalProjectDefects: number;
  closedOrVerified: number;
};

export type VisitReportData = {
  project: Project;
  visit: InspectionVisit;
  generatedAt: string;
  counts: ProjectSummary;
  tasks: TaskItem[];
  newDefects: Defect[];
  carriedOverActiveDefects: Defect[];
  doneThisVisit: Defect[];
  stillOpenDefects: Defect[];
};
