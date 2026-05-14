# AGENTS.md

## Project mission

Build a mobile-first construction inspection app for field engineers.

The field engineer must be able to open the app on a phone, start or continue a project visit, add tasks and defects quickly during a site visit, attach optional photos, update the status of existing defects from previous visits, and generate a clear report at the end of the visit without retyping information.

The MVP is intentionally simple: local-first, fast, Hebrew RTL UI, and reliable print/PDF reporting.

Important product rule: this is not only a one-time visit report app. It is also a lightweight project defect register. Defects must persist across visits until they are marked done/verified/closed. A fixed defect is not deleted; it changes status.

## Operating mode for Cursor / coding agents

- Read this file and `PLAN.md` before making changes.
- Work phase by phase according to `PLAN.md`.
- Do not try to build every future enterprise feature at once.
- Make reasonable product decisions when details are missing. Prefer a simple, working MVP over incomplete complex architecture.
- Keep the app runnable after every phase.
- After every meaningful phase, run the smallest relevant checks. Do not run slow or duplicate tests repeatedly.
- Update `PLAN.md` checkboxes as work is completed.
- Do not introduce paid services, backend dependencies, authentication, or external cloud storage unless explicitly requested later.
- Do not treat report generation as the end of the data lifecycle. Reports are snapshots; the project data continues after the report.

## Product priorities

1. Fast defect capture in the field.
2. Ongoing project defect tracking across multiple visits.
3. Clear active list of open/in-progress items that carry over from visit to visit.
4. Simple status changes, especially marking an item as done after it was fixed.
5. Clear visit report showing new items, carried-over items, done items, and still-open items.
6. Optional photo capture from the phone camera/gallery.
7. Hebrew RTL user interface.
8. Local-first persistence so work is not lost.
9. Clean, maintainable TypeScript code.

## Recommended MVP tech stack

Use this stack unless the repository already has a different working stack:

- Vite
- React
- TypeScript
- Tailwind CSS or simple CSS modules/CSS variables
- IndexedDB via a small wrapper such as `idb` or `localforage`
- Vitest for unit tests
- React Testing Library for component tests
- Playwright only for one or two end-to-end happy paths
- Printable HTML + print CSS for report/PDF export

Avoid server-side PDF generation for the MVP. For Hebrew RTL, browser print/export is usually simpler and more reliable than low-level PDF drawing libraries.

## UI language and direction

- All user-facing UI text must be Hebrew.
- Use `dir="rtl"` at the app root.
- Use logical CSS properties when possible: `margin-inline`, `padding-inline`, `text-align: start`, etc.
- Format dates with Hebrew/Israel conventions, for example `Intl.DateTimeFormat('he-IL')`.
- Code identifiers, filenames, comments, and tests should be in English.

Suggested Hebrew labels:

- Open: `פתוח`
- In progress: `בטיפול`
- Done: `טופל`
- Verified: `אומת`
- Closed: `סגור`
- New this visit: `חדש בביקור`
- Carried over: `נמשך מביקור קודם`
- Done this visit: `טופל בביקור הזה`
- Still open: `עדיין פתוח`

## Core domain terms

Use consistent names in code:

- `Project`: construction project/site. A project has many visits and many defects over time.
- `InspectionVisit`: a dated field visit/inspection session. A visit creates a report snapshot, but does not end the project defect lifecycle.
- `TaskItem`: checklist or work item. For the MVP, support visit tasks and optionally project-level tasks.
- `Defect`: a reported construction issue/deficiency. Defects are project-level records, not only visit-level records.
- `DefectStatusChange`: an event that records a status change during a visit.
- `PhotoAttachment`: image attached to a defect.
- `Report`: generated visit summary/snapshot.

### Status model

Use a small status model that is easy for a field engineer:

```ts
type DefectStatus = 'open' | 'in_progress' | 'done' | 'verified' | 'closed';
```

Meaning:

- `open`: found and not handled yet.
- `in_progress`: someone is handling it.
- `done`: reported as fixed by the contractor or observed as fixed by the engineer.
- `verified`: engineer verified the repair.
- `closed`: no longer active in the project list/report except history views.

For the MVP, `open`, `in_progress`, and `done` are the most important statuses. `verified` and `closed` can be supported if easy, but do not let them slow down the core flow.

### Suggested types

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

For MVP, `title` is the only required field when quickly adding a defect. Everything else should be optional or have sensible defaults.

## Cross-visit defect rules

These rules are critical:

- Defects belong to a `Project`, not only to an `InspectionVisit`.
- `firstSeenVisitId` records where the defect was first found.
- A new visit must automatically show all active project defects:
  - `open`
  - `in_progress`
  - optionally `done` if the user wants to verify/close them
- Do not duplicate an old defect just because it appears again on a later visit. Update the existing defect.
- If a defect was fixed, mark it as `done`; do not delete it.
- Deletion is only for accidental/incorrect entries. Use confirmation.
- Every status change should update:
  - `status`
  - `statusUpdatedAt`
  - `lastUpdatedVisitId`
  - `doneAt` and `doneVisitId` when status becomes `done`
  - a `DefectStatusChange` event in `statusHistory`
- Reports are snapshots of the visit and project state at the time of generation.
- The app should support answering these questions:
  - What defects are still open today?
  - What defects were discovered during this visit?
  - What defects were already open from previous visits?
  - What defects were marked done during this visit?
  - What defects have ever been seen in this project?

## UX rules

- Mobile-first: design for a field engineer holding a phone at a construction site.
- Large tap targets. Avoid tiny icons as the only way to perform core actions.
- Main action must be obvious: `הוסף ליקוי`.
- A secondary quick action should allow `סמן כטופל` for existing active defects.
- The active defect list should be visible immediately when continuing a project/starting a new visit.
- The add-defect form must be short:
  - title
  - description
  - location
  - photo
  - optional advanced fields collapsed or lower on the screen
- Never force the engineer to fill long forms before saving a defect.
- Autosave locally after create/update/status change.
- Make edit/delete explicit and recoverable where possible.
- Keep report generation one click from the visit summary screen.
- Empty states should explain the next action in Hebrew.
- Active/default views should focus on current work:
  - open defects
  - in-progress defects
  - project tasks not done
- Done/closed history should be accessible, but should not clutter the default field workflow.

## Reporting rules

The visit report should include:

- Project/site name.
- Visit date and inspector name.
- Summary counts:
  - total project defects ever recorded
  - new defects in this visit
  - open/in-progress defects at report time
  - defects marked done in this visit
  - verified/closed defects, if supported
  - total tasks
  - completed tasks
- Task checklist summary.
- Defect sections:
  - `ליקויים חדשים בביקור`
  - `ליקויים פתוחים מביקורים קודמים`
  - `ליקויים שטופלו בביקור הזה`
  - `ליקויים שעדיין פתוחים`
- Defect list fields:
  - number
  - title
  - description
  - location
  - status
  - severity
  - responsible party, if available
  - due date, if available
  - first seen visit/date
  - latest status update date
  - photos, if available
- Report generation date/time.
- A print-friendly layout that works on mobile and desktop.

Prefer a dedicated report preview route/screen with print CSS. The primary action can call `window.print()` after showing the preview.

Report scope rule: a visit report is not only the list of defects created during the visit. It must also include the active carried-over defects that the engineer/owner still needs to track.

## Persistence rules

- Store MVP data locally in IndexedDB.
- No backend, login, or sync in the MVP.
- Use stable IDs with `crypto.randomUUID()` when available.
- Keep storage access behind a repository/service layer, not scattered across components.
- Repository APIs should support project-level queries:
  - get active defects for project
  - get all defects for project
  - get defects first seen in visit
  - get defects updated in visit
  - get defects marked done in visit
- Include export/import JSON hooks only if they are easy and do not delay the MVP.
- Export/import should preserve defect history, status changes, and photos metadata/data.

## Image rules

- Use `<input type="file" accept="image/*" capture="environment">` for camera-friendly capture.
- Allow uploading from gallery as fallback.
- Show a preview before/after save.
- Compress or resize large images before storing when practical.
- Keep image handling isolated in a utility/service so it can be replaced later.

## Code organization

Suggested structure:

```txt
src/
  app/
    App.tsx
    routes.tsx
  components/
    common/
    defects/
    reports/
    tasks/
    visits/
  domain/
    types.ts
    defaults.ts
    validation.ts
    status.ts
    summaries.ts
  storage/
    db.ts
    repositories.ts
  utils/
    dates.ts
    images.ts
    report.ts
  test/
    setup.ts
```

Rules:

- Keep components focused and small.
- Put business logic in `domain/` or `utils/`, not inside large React components.
- Put status transition logic in a dedicated domain utility, not inside UI event handlers.
- Use TypeScript strict mode.
- Avoid `any`; if unavoidable, explain why in a comment.
- Avoid global mutable state except controlled app state/store.
- Do not add unnecessary state libraries in MVP. React state/context is enough unless complexity clearly requires more.
- Keep dependencies minimal.

## Accessibility and robustness

- Every input needs a visible label in Hebrew.
- Buttons must have clear text or `aria-label`.
- Forms must show clear validation messages.
- Use semantic HTML before custom widgets.
- Do not rely on color alone for severity/status.
- Loading and error states should be visible and written in Hebrew.
- Status changes should be explicit and easy to undo/edit if the user tapped by mistake.

## Testing policy

The user explicitly asked for tests along the way, but not too many and not duplicate tests.

Write a small, meaningful test set:

1. Unit test for domain logic: create/update defect, status transitions, summary counts.
2. Unit test for cross-visit logic:
   - defects created in visit 1 appear as active in visit 2 when still open
   - defects marked done in visit 2 are counted as done and not duplicated
3. Component test for quick defect form: title-only save, optional photo path mocked if needed.
4. Unit test for report data mapping:
   - report includes tasks
   - new defects
   - carried-over defects
   - defects marked done in current visit
   - active project counts
5. One Playwright happy path near the end:
   - create/open project
   - create first visit
   - add a defect
   - create/continue second visit
   - mark the same defect as done
   - open report preview
   - verify report contains the defect title and done/open summary count

Do not over-test:

- CSS details
- browser/library behavior
- the same validation in multiple layers
- snapshots unless there is a strong reason

Recommended commands once scripts exist:

```bash
npm run typecheck
npm run test -- --run
npm run build
npm run test:e2e
```

During development, run only the relevant subset after each phase. Before final handoff, run typecheck, tests, and build.

## Definition of done for MVP

The MVP is done when:

- The app starts locally.
- The UI is Hebrew RTL.
- A user can create or continue a project/visit context.
- A user can add, edit, complete, and delete tasks.
- A user can add a defect with title, optional description, optional location, and optional photo.
- Defects persist after refresh.
- Open/in-progress defects from previous visits automatically appear in later visits for the same project.
- A user can mark an existing defect as done without deleting it.
- A user can see all defects ever recorded for the project in a history/all-items view.
- A user can filter or clearly see open/in-progress/done/closed defects.
- A report preview can be generated from the visit and project defect state.
- The report clearly distinguishes new, carried-over, done, and still-open defects.
- The report is printable/exportable to PDF through browser print.
- Core tests pass.
- The build passes.

## Explicit non-goals for the first build

Do not implement these in the MVP unless asked later:

- Multi-user collaboration
- Authentication/authorization
- Cloud sync
- Push notifications
- Email sending
- Contractor portals
- BIM/model integration
- Drawing/blueprint pinning
- Voice notes
- AI defect detection
- OCR
- Complex role permissions
- Billing/subscriptions
