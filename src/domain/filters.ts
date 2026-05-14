import { isActiveDefectStatus, isHistoryDefectStatus } from './status';
import type { Defect, DefectFilter } from './types';

function normalize(value?: string): string {
  return value?.trim().toLocaleLowerCase('he-IL') ?? '';
}

function matchesQuery(defect: Defect, query?: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  return [defect.title, defect.description, defect.location, defect.responsibleParty, defect.trade]
    .map(normalize)
    .some((value) => value.includes(normalizedQuery));
}

export function filterDefects(defects: Defect[], filter: DefectFilter): Defect[] {
  return defects.filter((defect) => {
    if (filter.severity && filter.severity !== 'all' && defect.severity !== filter.severity) {
      return false;
    }

    if (!matchesQuery(defect, filter.query)) {
      return false;
    }

    switch (filter.mode) {
      case 'active':
        return isActiveDefectStatus(defect.status);
      case 'new_this_visit':
        return defect.firstSeenVisitId === filter.visitId;
      case 'in_progress':
        return defect.status === 'in_progress';
      case 'done_this_visit':
        return (
          defect.doneVisitId === filter.visitId ||
          defect.statusHistory.some(
            (statusChange) => statusChange.visitId === filter.visitId && statusChange.toStatus === 'done'
          )
        );
      case 'history':
        return isHistoryDefectStatus(defect.status);
      case 'high_critical':
        return defect.severity === 'high' || defect.severity === 'critical';
      case 'all':
      default:
        return true;
    }
  });
}
