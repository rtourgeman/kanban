# Construction Inspection MVP

This is a local-first construction inspection app for field engineers.

The product UI is Hebrew and RTL.

The app supports projects, inspection visits, visit tasks, project-level defect tracking across visits, optional photos, persistent report snapshots, and browser print/PDF report export.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run test -- --run
npm run build
npm run test:e2e
```

Latest local verification, 2026-05-14:

- `npm run typecheck` passed.
- `npm run test -- --run` passed: 6 files, 14 tests.
- `npm run build` passed.
- `npm run test:e2e` passed: 1 mobile Chromium happy path.

## MVP Capabilities

- No backend, login, or cloud sync.
- Data persists locally in IndexedDB.
- A project can have multiple inspection visits.
- Tasks can be added manually or seeded from common inspection templates.
- Defects are stored at project level, not only at visit level.
- Open and in-progress defects automatically carry over into later visits.
- Fixed defects are marked done and kept in project history.
- Status changes are recorded through status history events.
- Generated visit reports are stored as snapshots so historical reports do not change when live defects are updated later.
- Reports distinguish new defects, carried-over active defects, defects marked done in the visit, and defects still open after the visit.
- Reports can be printed or saved as PDF through the browser.
- Basic PWA metadata and a service worker are included.

## Data Lifecycle Notes

Reports are snapshots. The project defect register remains the source of truth for ongoing work, while each generated report preserves the visit state at the time it was created.

Status changes must go through `updateDefectStatus()` / `changeDefectStatus()`. Generic defect edits intentionally do not mutate lifecycle fields such as `status`, `doneAt`, `doneVisitId`, `verifiedAt`, `closedAt`, or `statusHistory`.