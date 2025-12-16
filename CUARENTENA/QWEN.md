# Qwen Code Context File for donna-website

## Project Overview

The "donna-website" is a Next.js 15.5.6 application that serves as a food delivery platform focused on supporting local restaurants. The platform connects local restaurants, customers, and delivery drivers in a community-focused ecosystem. The name "Doña Repartos" reflects its emphasis on local, community-centered service.

Key features of the platform:
- Customer-facing website for ordering food from local restaurants
- Restaurant partner onboarding and management
- Delivery driver recruitment and management
- Real-time order tracking
- Supabase backend integration for authentication and data management

## Project Structure

```
donna-website/
├── app/                    # Next.js app directory (App Router)
│   ├── repartidores/       # Delivery driver section
│   │   └── page.tsx        # Driver onboarding form
│   ├── socios/             # Restaurant partners section
│   │   └── page.tsx        # Restaurant onboarding form
│   ├── favicon.ico
│   ├── globals.css         # Global styles with Tailwind CSS
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Homepage with hero section and testimonials
├── components/             # Reusable UI components
│   ├── Footer.tsx
│   └── Header.tsx
├── lib/                    # Shared utilities and libraries
│   ├── hooks/              # Custom React hooks
│   │   └── useSupabase.ts  # Singleton Supabase client hook
│   └── supabase/           # Supabase configuration
│       └── client.ts       # Supabase client creation
├── public/                 # Static assets
├── .gitignore
├── README.md               # Project documentation
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
```

## Technologies Used

- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4 with PostCSS
- **Database/Authentication**: Supabase (supabase-js 2.75.1)
- **UI Components**: Custom React components
- **Icons**: Inline SVG icons

## Key Features

### For Customers
- Homepage with hero section showcasing the platform's value proposition
- Location-based restaurant search functionality
- Testimonials carousel
- Mobile-responsive design

### For Restaurant Partners
- Dedicated onboarding form for restaurants to join the platform
- Pre-signup validation to check restaurant name and email availability
- Benefits highlighting: increased sales, fair commissions, local support

### For Delivery Drivers
- Dedicated onboarding form for drivers
- Pre-signup validation for email and phone number
- Benefits highlighting: flexible scheduling, fair earnings, full tips retention
- Real-time email and phone validation with debounce

## Technical Implementation Details

### Supabase Integration
The application uses Supabase as a backend service, with:
- Authentication for different user roles (client, restaurant, driver)
- Database tables for user profiles
- Custom RPC functions for pre-signup validation
- Client-side Supabase integration using a singleton pattern

### Form Validation
- Real-time validation for email and phone numbers using Supabase RPC calls
- Debounced API calls to prevent excessive requests
- Visual feedback for validation states (valid, invalid, checking)
- Error handling and user-friendly messages

### State Management
- React hooks (useState, useEffect) for local component state
- Custom useSupabase hook with singleton pattern for Supabase client management
- Form state management with controlled components

### UI/UX Design
- Mobile-first responsive design using Tailwind CSS
- Consistent color scheme with pink (#e4007c) as primary brand color
- Accessible navigation with mobile hamburger menu
- Interactive elements with hover and focus states

## Environment Configuration

The application expects the following environment variables to be set (typically in a `.env.local` file):

```
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

## Building and Running

### Development
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the result.

### Production
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## Deployment

This project is configured for deployment on Vercel (the creators of Next.js). The project is set up but currently doesn't have a production deployment.

To deploy to production:
1. Push your code to the main branch, or
2. Run `vercel --prod` using the Vercel command-line interface

The project's domain is properly configured, but a production deployment needs to be triggered to make it live.

## Development Conventions

- TypeScript is used throughout the project
- Tailwind CSS utility classes for styling
- Component organization in separate files
- Client-side components use `"use client"` directive
- Supabase integration follows singleton pattern for efficiency
- Mobile-responsive design with appropriate breakpoints
- Accessible HTML structure with semantic elements and ARIA attributes

## File Purpose

This QWEN.md file serves as the instructional context for future interactions with the Qwen Code agent. It provides a comprehensive overview of the "donna-website" project, including its purpose, structure, technologies used, key features, and development conventions, enabling the agent to provide more accurate and contextually relevant assistance.