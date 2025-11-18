# Project Structure

## Directory Organization

```
app/                    # Next.js App Router pages
├── admin/             # Admin dashboard
├── clientes/          # Client registration and dashboard
├── socios/            # Restaurant registration and dashboard
├── repartidores/      # Delivery agent registration and dashboard
├── login/             # Authentication pages
├── legal/             # Legal pages (privacy, terms)
├── cookies/           # Cookie policy
├── layout.tsx         # Root layout with Header/Footer
├── page.tsx           # Homepage
└── globals.css        # Global styles and Tailwind

components/            # Reusable React components
├── dashboard/         # Dashboard-specific components
├── forms/             # Form components
├── ui/                # UI primitives
├── registration/      # Registration flow components
├── providers/         # Context providers
└── __tests__/         # Component tests

lib/                   # Utilities and configurations
├── supabase/          # Supabase client setup (server, middleware)
├── hooks/             # Custom React hooks
├── utils/             # Utility functions (validation, errors)
└── constants.ts       # Design system constants

types/                 # TypeScript type definitions
├── auth.ts            # Authentication types
├── user.ts            # User types
├── form.ts            # Form types
├── address.ts         # Address types
└── registration.ts    # Registration flow types

scripts/               # Build and test scripts
public/                # Static assets
```

## Key Patterns

### Page Structure
- Server Components by default (async functions for data fetching)
- Use `createClient()` from `@/lib/supabase/server` for server-side auth
- Redirect unauthenticated users with `redirect('/login')`
- Export metadata for SEO

### Component Organization
- Client components marked with `'use client'`
- Reusable components in `components/` directory
- Dashboard components in `components/dashboard/`
- Form components follow consistent patterns (FormField, FormButton)

### Authentication Flow
- Middleware protects routes based on user role
- Role mapping: `delivery_agent` → `delivery`, `restaurant` → `restaurant`, etc.
- Each role has dedicated dashboard route
- Session management via Supabase SSR

### Styling Conventions
- Use constants from `lib/constants.ts` for colors, spacing, typography
- Brand color: `#e4007c` (primary pink)
- Tailwind utility classes preferred
- Responsive design: mobile-first approach
- Accessibility: ARIA labels, keyboard navigation, focus states

### Path Aliases
- `@/*` maps to project root
- Import example: `import { createClient } from '@/lib/supabase/server'`
