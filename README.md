# Ustaad-app (Servome — Floot web app export)

This repo is an export of the Floot-built staff/admin web app for Servome
(Floot project id `46c3324a-69ed-457a-876d-9b4c0e5a6a45`), pushed from the
InstaPods `servome-backend-2` pod on 2026-09-22.

## What's included

Only Servome-specific application code:

- `base.css` — theme tokens (light + dark)
- `endpoints/` — every API route (auth OTP login, QR area lookup, shop
  registration + photo upload, ticket create/accept/advance/available/mine,
  and the `webhooks/n8n-booking` endpoint the n8n WhatsApp bot calls)
- `helpers/` — `db.tsx` (Kysely/Postgres), `schema.tsx` (generated DB types),
  session/auth helpers, and the React Query hooks used by the pages
- `pages/` — the three pages that exist so far: technician dashboard
  (`_index`), technician `login`, and the QR-stand `register-shop` page
- `static/__dev/` — the project's system prompt and design principles

## What's deliberately NOT included

The `components/` folder in the original Floot project is Floot's
**standard, generic UI kit** (Accordion, Button, Calendar, Chart, Dialog,
Select, Tabs, etc. — ~140 files, none of it Servome-specific). It ships with
every Floot project and was not transcribed here to keep this export to just
the application's own code. The pages in this repo import from a
`../components/...` path that assumes that kit is present.

To get a fully buildable project, either:
1. Re-pull the full file list from the Floot project (`components/` +
   everything above) and add it to this repo, or
2. Treat this repo as the **application logic reference** and re-host it
   inside a fresh Floot project (or hand-build the component kit).

## Stack

- Floot-hosted TypeScript/React app with a Postgres backend via Kysely
- Zod-validated request schemas, superjson wire format for the app's own
  endpoints (the n8n webhook uses plain JSON instead — see its file's
  comment)
- Auth: phone + OTP, technician sessions stored in Postgres, bearer token
  in `Authorization` header

## Relationship to the rest of Servome

This is **separate** from the production system, which is:
- Backend: FastAPI/Python + MongoDB on InstaPods (`servome-backend-2`)
- Technician app: Expo/React Native (`Servomeme_assignment/`)
- WhatsApp bot: n8n, self-hosted on InstaPods (`servome-services`)

This Floot app was a web rebuild of the staff/admin side of the same
product. Bookings created via its `webhooks/n8n-booking_POST` endpoint write
to *this app's own Postgres database* — a different database from the
MongoDB one the Python backend and Expo app use. The two are not currently
wired together.

### `pages/register-shop.tsx` is NOT the real QR-stand flow

This page is a Floot-side prototype and is **not used in production**. The
real QR-stand registration flow already exists, live, on the Python backend
at `servome-backend-2`'s `/dispatcher` route (staff OTP login, in-browser
jsQR camera scan, claim form with geotagged photo — see
`static/dispatcher.html` in that pod, not this repo). That route is meant to
sit behind a subdomain on Servome's own domain (e.g.
`dispatcher.servomeservice.com`), attached via the InstaPods dashboard.
`pages/register-shop.tsx` here should be treated as dead weight from an
earlier Floot iteration, not a second implementation to maintain.
