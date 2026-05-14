import { newId } from '../utils/ids';
import { nowIso } from '../utils/dates';
import type { Defect, DefectStatus, DefectStatusChange } from './types';

export const ACTIVE_DEFECT_STATUSES: DefectStatus[] = ['open', 'in_progress'];
export const HISTORY_DEFECT_STATUSES: DefectStatus[] = ['done', 'verified', 'closed'];

export function isActiveDefectStatus(status: DefectStatus): boolean {
  return ACTIVE_DEFECT_STATUSES.includes(status);
}

export function isHistoryDefectStatus(status: DefectStatus): boolean {
  return HISTORY_DEFECT_STATUSES.includes(status);
}

export function changeDefectStatus(
  defect: Defect,
  toStatus: DefectStatus,
  options: {
    visitId?: string;
    note?: string;
    changedAt?: string;
    idFactory?: () => string;
  } = {}
): Defect {
  const changedAt = options.changedAt ?? nowIso();
  const idFactory = options.idFactory ?? (() => newId('status-change'));

  if (defect.status === toStatus) {
    return {
      ...defect,
      updatedAt: changedAt,
      lastUpdatedVisitId: options.visitId ?? defect.lastUpdatedVisitId
    };
  }

  const statusChange: DefectStatusChange = {
    id: idFactory(),
    projectId: defect.projectId,
    defectId: defect.id,
    visitId: options.visitId,
    fromStatus: defect.status,
    toStatus,
    note: options.note?.trim() || undefined,
    changedAt
  };

  const next: Defect = {
    ...defect,
    status: toStatus,
    statusUpdatedAt: changedAt,
    lastUpdatedVisitId: options.visitId ?? defect.lastUpdatedVisitId,
    updatedAt: changedAt,
    statusHistory: [...defect.statusHistory, statusChange]
  };

  if (toStatus === 'done') {
    next.doneAt = changedAt;
    next.doneVisitId = options.visitId;
  }

  if (toStatus === 'verified') {
    next.verifiedAt = changedAt;
  }

  if (toStatus === 'closed') {
    next.closedAt = changedAt;
  }

  if (toStatus === 'open' || toStatus === 'in_progress') {
    next.doneAt = undefined;
    next.doneVisitId = undefined;
    next.verifiedAt = undefined;
    next.closedAt = undefined;
  }

  return next;
}
