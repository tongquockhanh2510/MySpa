# AGENTS.md

# MySpa AI Engineering Guide

## Project Overview

This is a Spa Management System.

Tech Stack

- React + Vite
- Tailwind CSS
- Node.js / Express
- MySQL
- JWT Authentication

The project contains modules such as:

- Dashboard
- Customers
- Employees
- Services
- Products
- Treatment Packages
- Appointments
- Customer Treatments
- Orders / POS
- Salaries
- Reports
- Users / Roles / Permissions

---

## Workflow

Before starting any task:

1. Read `skills/using-agent-skills/SKILL.md`.
2. Determine the task type.
3. Read the matching skill.
4. Follow the skill completely.
5. Verify before finishing.

---

## Skill Mapping

### New Feature

spec-driven-development

↓

planning-and-task-breakdown

↓

incremental-implementation

↓

test-driven-development

↓

code-review-and-quality

---

### UI

frontend-ui-engineering

---

### Backend/API

api-and-interface-design

↓

test-driven-development

---

### Bug

debugging-and-error-recovery

↓

test-driven-development

↓

code-review-and-quality

---

### Full System Audit

context-engineering

↓

test-driven-development

↓

debugging-and-error-recovery

↓

code-review-and-quality

---

### Security

security-and-hardening

---

### Performance

performance-optimization

---

## Coding Rules

- Keep changes focused.
- Never refactor unrelated code.
- Never delete code you don't understand.
- State assumptions before non-trivial work.
- Ask questions when requirements are unclear.
- Prefer simple solutions.
- Preserve existing architecture.
- Follow existing coding style.

---

## UI Rules

When modifying UI:

- Keep orange/black spa branding.
- Responsive for desktop/tablet/mobile.
- Improve UX.
- Maintain consistency.
- Handle loading/empty/error states.
- Do not redesign unrelated pages.

---

## Functional Rules

When modifying business logic:

Always verify:

- CRUD
- Validation
- Authentication
- Authorization
- API response
- Error handling
- State updates
- Database consistency

---

## Full System Audit

When asked to audit the whole application:

Do NOT modify code immediately.

First create a report.

Each module must contain:

- Expected behavior
- Current behavior
- Status
- Missing functionality
- Logic issues
- UI issues
- Priority
- Recommended fixes

Wait for approval before implementation.

---

## Verification

Before finishing:

- npm run lint
- npm run build
- Run tests if available
- Summarize files changed
- Summarize remaining risks

Never finish without verification.