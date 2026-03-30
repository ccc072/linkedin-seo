# LinkedIn Growth Assistant - PRD

## Problem Statement
Build a LinkedIn Growth Assistant web app: AI-powered profile optimization using Gemini 2.5 Flash, email delivery via Resend, Excel data storage, Vercel Cron for scheduled reminders. No authentication.

## Architecture
- **Frontend**: React (CRA + CRACO) at root `/app/`
- **Backend**: Vercel Serverless Functions in `/app/api/`
- **Dev Server**: Express wrapper in `/app/backend/server.js` (local dev only)
- **Storage**: ExcelJS writing to `/tmp/users.xlsx`
- **AI**: Google Gemini 2.5 Flash via `@google/generative-ai`
- **Email**: Resend API
- **Cron**: Vercel Cron Jobs → `/api/cron/reminder` every 30 min

## User Personas
- LinkedIn professionals seeking profile optimization
- Job seekers wanting AI-powered advice
- No accounts needed — form + email workflow

## Core Requirements
- Form with 8 fields (name, email, headline, about, skills, certs, target role, connections)
- AI generates: 3 headlines, rewritten about, skills, certs, 5 post ideas, 1 full post, growth tasks
- Immediate email with full growth plan
- 48-hour follow-up reminder email with status buttons
- Excel data storage for all user data + AI output

## What's Been Implemented (Feb 2026)
- [x] Full React frontend with Swiss/Brutalist design
- [x] Vercel serverless API routes: submit, update, health, cron/reminder
- [x] Shared libraries: excel.js, gemini.js, email.js
- [x] Gemini 2.5 Flash integration
- [x] Resend email integration (first email + reminder)
- [x] Excel storage with full schema (23 columns)
- [x] vercel.json with cron config + SPA routing
- [x] Express dev server wrapper for local development
- [x] All tests passing (100% backend, 100% frontend)

## Prioritized Backlog
### P0 (Done)
- Form submission → AI → Excel → Email → Success page
- Vercel deployment config
- Cron reminder system

### P1
- Domain verification for Resend (currently test mode)
- Production BASE_APP_URL configuration

### P2
- User dashboard to revisit growth plans
- Email retry mechanism
- Analytics tracking
