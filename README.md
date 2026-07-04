# FAR Tech & Developers — Invoice & Revenue Management System

Single-admin SaaS application for creating invoices, tracking payments, and
monitoring agency revenue. Built for FAR Tech & Developers' Finance Head.

## Features

- Single-admin authentication (Supabase Auth) with forgot-password flow
- Dashboard: revenue cards, invoice status cards, monthly revenue chart, status pie chart, activity feed
- Client management: CRUD, search, duplicate-email prevention
- Invoice management: draft → sent → pending approval → approved → pending payment → paid → delivered → cancelled
- Auto invoice numbering (`PREFIX-YEAR-SEQUENCE`), enforced unique at the DB level
- Line items with automatic subtotal/tax/grand total calculation (DB triggers, not client-side math)
- Payments: partial/multiple payments, automatic status transition to Paid, DB-enforced overpayment protection
- Invoice PDF generation matching the FAR Tech brand template exactly, with logo + Finance Head signature baked in automatically
- Reports: monthly/yearly revenue, pending payments, paid invoices, outstanding revenue, revenue by client — exportable to CSV/Excel
- Company settings: logo/signature upload to Supabase Storage, tax %, currency, invoice prefix, bank details
- Responsive dark-theme UI (desktop/tablet/mobile), loading skeletons, empty states, toast notifications, confirm dialogs

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query · React Hook Form + Zod · Recharts · @react-pdf/renderer · Supabase (Postgres, Auth, Storage) · Netlify

## Folder Structure

```
fartech-app/
├── frontend/               # React app
│   ├── src/
│   │   ├── assets/         # logo.png, signature.png (brand assets)
│   │   ├── components/     # layout, ui primitives, invoice PDF component
│   │   ├── contexts/       # AuthContext
│   │   ├── hooks/          # TanStack Query hooks per domain
│   │   ├── lib/            # supabase client, zod schemas, utils
│   │   ├── pages/          # route-level pages
│   │   ├── types/          # database.ts (mirrors Supabase schema)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── supabase/
│   └── migrations/001_initial_schema.sql
├── netlify.toml
└── README.md
```

## Installation

```bash
cd frontend
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key |

## Deployment

### 1. Supabase

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/001_initial_schema.sql
```

Then in the Supabase dashboard:
- Authentication → create the single admin user (Email + Password provider)
- Storage → confirm the `branding` bucket exists (created by the migration) and upload the logo/signature, or do it from Settings once the app is running
- Project Settings → API → copy the Project URL and anon key into your `.env`

### 2. GitHub

```bash
git init
git add .
git commit -m "feat: initial commit — FAR Tech invoice system"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Netlify

1. Import the GitHub repository in Netlify
2. Build command: `npm run build` (already set in `netlify.toml`, base = `frontend`)
3. Publish directory: `frontend/dist`
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Site Settings → Environment Variables
5. Deploy

## Business Rules (enforced at the database level)

- Invoice numbers auto-generate as `PREFIX-YEAR-SEQUENCE` and cannot collide
- Subtotal/tax/grand total recalculate automatically whenever line items change
- Status automatically flips to `paid` when `amount_paid >= grand_total`
- Payments can never exceed the invoice's grand total (hard constraint)
- Only `draft` invoices can be deleted
- `delivered` invoices are locked from further edits
- `cancelled` invoices are excluded from all revenue calculations and views

## Admin Manual (quick reference)

1. **Login** with the single admin account created in Supabase Auth.
2. **Add a client** before creating an invoice for them (Clients → Add Client).
3. **Create an invoice**: select client, add line items, save as Draft.
4. **Move status forward** as the deal progresses (Sent → Approved → Pending Payment).
5. **Record payments** from the invoice detail page — status flips to Paid automatically once fully paid.
6. **Download/share the PDF** — logo and signature are applied automatically, no manual upload needed per invoice.
7. **Check Reports** for monthly revenue, outstanding balances, and per-client totals; export to CSV/Excel as needed.
8. **Settings** — update company info, tax %, currency, and re-upload branding assets any time.
