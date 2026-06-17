# AGENT.md — Inzozi Nziza Rebuild Agent

## Project

Inzozi Nziza is a Rwanda community savings and loans platform for members who contribute 105,000 RWF monthly, apply for loans, track fines, and receive admin-managed approvals.

## Current Problem

The current app uses Supabase Auth + Supabase PostgreSQL directly from the React frontend. Authentication and authorization have issues, business logic is spread across large React components, and some README features are not actually implemented.

## Goal

Refactor the project into a secure, modern, production-ready full-stack app with:

* Strong authentication
* Strong authorization
* Free PostgreSQL database replacement
* Modern animated UI
* Cleaner architecture
* Secure admin workflows
* Accurate README and docs

## Recommended Target Stack

Frontend:

* React + Vite OR migrate to Next.js only if needed
* Tailwind CSS
* shadcn/ui
* Framer Motion
* React Hook Form + Zod

Backend:

* Next.js API routes OR Express/Fastify API
* Prisma ORM
* PostgreSQL on Neon or Aiven Free PostgreSQL
* JWT access tokens + refresh tokens
* HttpOnly secure cookies
* Bcrypt or Argon2 password hashing

Database:

* PostgreSQL
* Prisma migrations
* Tables:

  * users
  * roles
  * user_roles
  * contributions
  * loans
  * loan_payments
  * fines
  * fine_payments
  * admin_approval_requests
  * audit_logs
  * notifications
  * sessions / refresh_tokens

## Security Requirements

* Remove frontend-only admin key validation.
* Never trust role selection from frontend.
* Store auth tokens in HttpOnly cookies, not localStorage.
* Add server-side RBAC middleware.
* Add CSRF protection for cookie-based auth.
* Add rate limiting on login, signup, password reset, and admin actions.
* Add account lockout after repeated failed login attempts.
* Require strong password validation.
* Add audit logs for admin actions.
* Add two-admin approval for sensitive actions:

  * approve admin
  * approve loan
  * delete user
  * deactivate user
  * large contribution correction
  * fine cancellation
* Validate every request using Zod.
* Hide admin routes and protect them server-side.
* Use environment variables for all secrets.
* Never expose database keys to the frontend.

## Authorization Rules

Admin:

* Manage users
* Approve members
* Approve or deny loans
* Record contributions
* Record loan payments
* Issue and manage fines
* View all reports
* Approve second-admin actions

User:

* View own profile
* View own contributions
* Apply for loans
* View own loan status
* View own fines
* Generate own report

Pending User:

* Can only view pending approval screen
* Cannot access dashboard financial features

## UI Direction

Create a modern financial dashboard:

* Less images
* Better spacing
* Clean cards
* Dark/light mode
* Smooth page transitions
* Framer Motion animations
* Modern colors: deep navy, emerald, gold, slate, soft white
* Glassmorphism only where useful
* Animated stats cards
* Animated contribution progress
* Clean admin tables
* Mobile-first responsive layout
* Professional landing page with Rwanda community finance theme

## Required Fixes

* Replace Supabase Auth with custom secure auth.
* Replace Supabase client DB calls with backend API calls.
* Migrate data model to Prisma.
* Fix admin loans query so admins see all member loans.
* Add missing fine_payments table.
* Remove hardcoded admin key.
* Implement real two-admin approval.
* Implement real inactivity handling if required.
* Replace fake WebSockets/polling with proper notifications or clearly document polling.
* Make README match actual implementation.

## Development Rule

Do not rewrite blindly. First inspect the existing code, identify current routes, components, Supabase calls, auth flow, and database usage. Then refactor in phases.

## Phases

1. Audit current app
2. Create Prisma schema
3. Set up Neon/Aiven PostgreSQL
4. Build backend auth
5. Build RBAC middleware
6. Replace Supabase client calls
7. Rebuild UI
8. Add audit logs and second-admin approval
9. Test all roles
10. Update README and deployment docs
