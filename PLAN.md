# PLAN.md

## Product brief

Build a mobile-first construction inspection app for field engineers.

The engineer should be able to:

1. Open the app on a phone at the construction site.
2. Start or continue a project and an inspection visit.
3. Add checklist tasks quickly.
4. Add a defect quickly with title, optional description, optional location, and optional photo.
5. See active defects that were found in previous visits and have not been completed yet.
6. Mark existing defects as done when they were fixed, without deleting them.
7. Review new, open, in-progress, done, and historical defects before leaving the site.
8. Generate a clear printable visit report at the end of the visit.

The MVP should be simple, local-first, fast, Hebrew RTL, and focused on field usability.

## Product assumptions

- The first version is for a single engineer or small team using one device.
- No login, cloud sync, or backend in MVP.
- Data must persist locally after refresh.
- A project has multiple visits over time.
- Defects are project-level records that continue across visits until marked done/verified/closed.
- A report is a snapshot of a visit and the current project state.
- The user should never need to recreate old defects on the next visit.
- The most important moment is field capture: adding a defect must be very fast.
- Browser print/PDF is acceptable for MVP export.

## MVP scope

### Must have

- Hebrew RTL UI.
- Project/visit details:
  - project name
  - site/address
  - inspector name
  - visit date
- Task list:
  - add task
  - mark complete/incomplete
  - edit title
  - delete task
  - seed common inspection tasks
- Project defect register:
  - add defect
  - title required
  - description optional
  - location optional
  - photo optional
  - status
  - severity
  - responsible party optional
  - due date optional
  - edit defect
  - delete defect only for mistakes, with confirmation
  - carry active defects across visits
  - mark an existing defect as done
  - keep done/closed defects in project history
- Local persistence with IndexedDB.
- Summary counts.
- Filters by status and severity.
- Report preview.
- Print/PDF-friendly report.
- Minimal meaningful tests.

### Should have, if easy

- Image compression/resizing before saving.
- JSON export/import for backup.
- PWA manifest and installability.
- Offline indicator.
- Basic search by title/location/responsible party.
- Simple status history notes when marking a defect done.

### Not in MVP

- Backend.
- Login.
- Multi-user permissions.
- Real-time collaboration.
- Email sending.
- Contractor approval workflow.
- Blueprint/drawing pinning.
- BIM integration.
- Push notifications.
- AI features.

## Key product behavior: project defect lifecycle

This is the most important product behavior to implement correctly.

Example:

- Visit 1: engineer finds 5 defects and sends a report to the developer/client.
- Visit 2: engineer returns one week later. The same 5 defects should already exist in the project.
- If 2 defects were fixed, the engineer marks those 2 as `done`.
- The other 3 stay active/open and continue to appear in the project and in the next visit.
- Later, the app can show all defects ever found in the project, not only the latest report.

Rules:

- Defects belong to the project.
- Visits are inspection events/snapshots.
- Creating a new visit for the same project must load/show active project defects automatically.
- A defect should not be recreated if it already exists.
- Fixed defects are marked `done`; they are not deleted.
- Deleted defects are only for accidental entries.
- Every status change should record when it happened and which visit it belongs to when possible.

## Core screens

### 1. Home / project dashboard

Purpose: let the engineer continue quickly.

Content:

- Project name.
- Site/address.
- Latest visit date.
- Inspector name.
- Main buttons:
  - `המשך ביקור`
  - `ביקור חדש`
  - `הפק דו״ח`
- Summary cards:
  - tasks completed
  - active defects
  - defects marked done
  - total defects ever recorded in project

### 2. Visit workspace

Purpose: daily working screen.

Sections:

- Quick action: `הוסף ליקוי`
- Quick filters:
  - active/open
  - new this visit
  - done this visit
  - all project defects
- Task checklist
- Active defect list
- Done/recently updated defects
- Filters/search
- Report button

Behavior:

- When opening a new visit for an existing project, active defects from previous visits must be visible.
- The default defect list should focus on active work: `open` and `in_progress`.
- Done/closed items should be available through filter/history, but should not clutter the default view.

### 3. Add/edit defect

Purpose: fast field capture.

Fields:

- title: required
- description: optional
- location: optional
- photo: optional
- status: default `open`
- severity: default `medium`
- responsible party: optional
- due date: optional

UX:

- The save button should be visible without scrolling on common phone sizes when only basic fields are used.
- Advanced fields can be lower in the form.
- After save, return to the visit workspace and show the new defect.
- If the engineer notices an old defect again, they should update the existing defect instead of creating a duplicate.

### 4. Defect details

Purpose: review and update a defect.

Features:

- Show all fields.
- Show photo thumbnails.
- Show first seen visit/date.
- Show latest status update.
- Show simple status history if implemented.
- Edit.
- Change status.
- Quick action: `סמן כטופל`.
- Delete with confirmation only for accidental entries.

### 5. Project defect history

Purpose: let the engineer/client know what has happened across the whole project.

Features:

- Show all defects ever recorded for the project.
- Filter by:
  - active
  - done
  - verified/closed
  - severity
  - trade/responsible party if implemented
- Search by title/location/responsible party.
- Show created date / first seen visit and current status.

This screen can be simple in MVP. It may be part of the workspace using an `all` filter rather than a separate route.

### 6. Report preview

Purpose: final visit report.

Content:

- Header with project/site/inspector/date.
- Summary counts.
- Task summary.
- Defect sections:
  - new defects in this visit
  - open/in-progress defects carried over from previous visits
  - defects marked done in this visit
  - still-open defects after this visit
- Defect cards with photos.
- Print button.
- Optional JSON export button if implemented.

## Suggested data model

```ts
type Project = {
  id: string;
  name: string;
  address?: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
};

type InspectionVisit = {
  id: string;
  projectId: string;
  inspectorName: string;
  visitDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type TaskScope = 'project' | 'visit';
type TaskStatus = 'todo' | 'done';

type TaskItem = {
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

type DefectStatus = 'open' | 'in_progress' | 'done' | 'verified' | 'closed';
type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';

type Defect = {
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

type DefectStatusChange = {
  id: string;
  projectId: string;
  defectId: string;
  visitId?: string;
  fromStatus?: DefectStatus;
  toStatus: DefectStatus;
  note?: string;
  changedAt: string;
};

type PhotoAttachment = {
  id: string;
  defectId: string;
  dataUrl: string;
  fileName?: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
};
```

## Domain rules

### Defect status transitions

Minimum supported transitions:

- `open` -> `in_progress`
- `open` -> `done`
- `in_progress` -> `done`
- `done` -> `verified`
- `done` -> `open` if it was marked done by mistake or the problem returned
- `verified` -> `closed`
- `closed` -> `open` only if the user intentionally reopens it

Rules:

- When status becomes `done`, set `doneAt` and `doneVisitId`.
- When status changes away from `done`, clear or preserve `doneAt` based on the chosen implementation, but keep history.
- Always append a `DefectStatusChange`.
- Always update `updatedAt`, `statusUpdatedAt`, and `lastUpdatedVisitId`.
- Do not create a duplicate defect just to show it in a new visit.

### Defect query helpers

Implement domain/storage helpers such as:

```ts
getActiveDefects(projectId)
getAllDefects(projectId)
getDefectsFirstSeenInVisit(visitId)
getDefectsUpdatedInVisit(visitId)
getDefectsMarkedDoneInVisit(visitId)
getCarriedOverActiveDefects(projectId, visitId)
```

### Report mapping helpers

Report mapping should produce sections like:

```ts
type VisitReportData = {
  project: Project;
  visit: InspectionVisit;
  generatedAt: string;
  counts: {
    totalProjectDefects: number;
    newDefectsThisVisit: number;
    activeDefects: number;
    doneThisVisit: number;
    closedOrVerified: number;
    totalTasks: number;
    completedTasks: number;
  };
  tasks: TaskItem[];
  newDefects: Defect[];
  carriedOverActiveDefects: Defect[];
  doneThisVisit: Defect[];
  stillOpenDefects: Defect[];
};
```

## Implementation phases

### Phase 0 — Scaffold and baseline

- [ ] Create Vite React TypeScript app if no app exists.
- [ ] Add basic scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `test`
  - `test:e2e` only when Playwright is added.
- [ ] Configure TypeScript strict mode.
- [ ] Add basic styling system.
- [ ] Set app root to Hebrew RTL.
- [ ] Add initial layout shell.
- [ ] Add testing setup with Vitest and React Testing Library.
- [ ] Add one smoke test that verifies the app renders.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

### Phase 1 — Domain model and local persistence

- [ ] Add domain types.
- [ ] Add default task templates.
- [ ] Add validation helpers for defects and tasks.
- [ ] Add status transition helper for defects.
- [ ] Add date utilities for `he-IL`.
- [ ] Add IndexedDB storage wrapper.
- [ ] Add repository functions:
  - create/get/update project
  - create/get/update visit
  - create/update/delete task
  - create/update/delete defect
  - update defect status with history
  - get active defects for project
  - get all defects for project
  - get defects first seen in visit
  - get defects updated in visit
  - get defects marked done in visit
- [ ] Add summary calculation utility.

Tests:

- [ ] Summary counts test.
- [ ] Defect validation test.
- [ ] Defect status transition test.
- [ ] Cross-visit carryover test:
  - create visit 1
  - create 5 defects
  - create visit 2
  - active list still contains those 5 defects
  - mark 2 as done
  - active list contains 3 defects
  - project history still contains all 5 defects
- [ ] Storage wrapper can be mocked or tested lightly; do not over-test browser APIs.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`

### Phase 2 — Project dashboard, visit workspace, and tasks

- [ ] Build Home/project dashboard screen.
- [ ] Build project creation/edit basics.
- [ ] Build visit creation/edit basics.
- [ ] When starting a new visit for an existing project, load/show active project defects.
- [ ] Build task list.
- [ ] Add task creation.
- [ ] Add complete/incomplete toggle.
- [ ] Add task edit/delete.
- [ ] Seed useful inspection tasks for a new visit.
- [ ] Persist tasks locally.

Suggested seeded tasks:

- בדיקת איטום
- בדיקת ריצוף
- בדיקת טיח וצבע
- בדיקת חשמל
- בדיקת אינסטלציה
- בדיקת אלומיניום/פתחים
- בדיקת בטיחות באתר
- צילום תיעוד כללי

Tests:

- [ ] Task summary unit test.
- [ ] Optional component test for task add/toggle if quick.
- [ ] Test that a new visit for an existing project can show active defects from the project store.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

### Phase 3 — Defect capture and lifecycle

- [ ] Build quick `הוסף ליקוי` flow.
- [ ] Add title/description/location fields.
- [ ] Add status/severity defaults.
- [ ] Add responsible party and due date optional fields.
- [ ] Add camera/gallery input:
  - `accept="image/*"`
  - `capture="environment"`
- [ ] Add photo preview.
- [ ] Add image compression/resizing utility if practical.
- [ ] Save defect locally as a project-level record with `firstSeenVisitId`.
- [ ] Add edit defect.
- [ ] Add delete defect with confirmation.
- [ ] Add status change from the defect list/details screen.
- [ ] Add quick action to mark defect as `done`.
- [ ] Record status history when status changes.
- [ ] Ensure done defects leave the default active list but remain available in history/all filter.

Tests:

- [ ] Component test: title-only defect can be saved.
- [ ] Unit test: defect update keeps timestamps/status valid.
- [ ] Unit test: marking defect done sets `doneAt`, `doneVisitId`, and status history.
- [ ] Do not duplicate the same validation tests in component and domain layers.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

### Phase 4 — Filters, search, and field usability polish

- [ ] Add filters:
  - all
  - active/open
  - in progress
  - done this visit
  - done/closed history
  - high/critical
- [ ] Add text search by title/location/responsible party if simple.
- [ ] Add summary cards:
  - active defects
  - new this visit
  - done this visit
  - total project defects
- [ ] Improve mobile spacing and sticky primary actions.
- [ ] Add empty states in Hebrew.
- [ ] Add basic error handling for storage/image failures.

Tests:

- [ ] Unit test for filter logic.
- [ ] Unit test for active vs done/history list behavior.
- [ ] No visual snapshot tests.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`

### Phase 5 — Report preview and print/PDF export

- [ ] Build report data mapping utility.
- [ ] Build report preview screen.
- [ ] Include:
  - project/site details
  - inspector
  - visit date
  - generated-at timestamp
  - summary counts
  - task list
  - new defects in current visit
  - active defects carried over from previous visits
  - defects marked done in current visit
  - still-open defects after current visit
  - defect photos
- [ ] Add print CSS:
  - hide app navigation/buttons in print
  - page-friendly margins
  - avoid splitting defect cards awkwardly when practical
- [ ] Add `הדפס / שמור כ־PDF` button using browser print.
- [ ] Add optional JSON export if easy.

Tests:

- [ ] Unit test for report mapping.
- [ ] Report mapping test should verify new, carried-over, done-this-visit, and still-open sections.
- [ ] Component test or simple render test that report includes defect title and counts.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

### Phase 6 — PWA/offline readiness

- [ ] Add manifest.
- [ ] Add app name and icons/placeholders.
- [ ] Add offline-friendly configuration if using a PWA plugin.
- [ ] Verify refresh keeps data.
- [ ] Verify a later visit still shows open defects from earlier visits.
- [ ] Verify app works on narrow mobile viewport.
- [ ] Add accessible labels for key actions.

Checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

### Phase 7 — End-to-end happy path and final QA

- [ ] Add one Playwright happy path:
  - create/open project
  - create first visit
  - add task
  - complete task
  - add 5 defects
  - open report preview and verify 5 defects exist
  - create/continue second visit
  - verify the same 5 defects appear as active
  - mark 2 defects as done
  - verify active list shows 3 remaining defects
  - open report preview
  - verify report contains done-this-visit count and still-open count
- [ ] Run full checks.
- [ ] Fix failures.
- [ ] Remove unused code.
- [ ] Ensure there are no console errors during core flow.
- [ ] Ensure README has local run instructions.

Final checks:

- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run build`
- [ ] `npm run test:e2e` if Playwright is configured

## Acceptance criteria

The build is acceptable when:

- [ ] App is usable on a phone-sized viewport.
- [ ] UI is Hebrew and RTL.
- [ ] A user can start or continue a project.
- [ ] A user can start a visit.
- [ ] A user can add tasks quickly.
- [ ] A user can mark tasks complete.
- [ ] A user can add a defect with only a title.
- [ ] A user can add optional description/location/photo to a defect.
- [ ] A user can edit and delete a defect.
- [ ] Defects and tasks persist after refresh.
- [ ] Defects are stored at project level, not only visit level.
- [ ] A new visit for the same project shows active defects from previous visits.
- [ ] A user can mark an existing defect as done.
- [ ] Done defects leave the default active list but remain in project history.
- [ ] The app can show all defects ever recorded for the project.
- [ ] A user can filter defects by status/severity.
- [ ] A report preview is generated from the visit and project defect state.
- [ ] The report distinguishes:
  - new defects in this visit
  - carried-over active defects
  - defects marked done in this visit
  - still-open defects
- [ ] The report can be printed/saved as PDF through the browser.
- [ ] Tests are meaningful and not excessive.
- [ ] Typecheck, tests, and build pass.
