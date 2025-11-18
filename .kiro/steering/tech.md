# Tech Stack

## Core Technologies

- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (authentication, database, RPC functions)
- **Maps**: Google Maps API (Places Autocomplete)
- **UI Libraries**: react-hot-toast for notifications

## Development Tools

- **Testing**: Vitest with React Testing Library
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript strict mode enabled

## Common Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Building
npm run build            # Production build
npm start                # Start production server

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:all         # Run all test suites
npm run test:responsive  # Test responsive design
npm run test:performance # Test performance
npm run test:accessibility # Test accessibility

# Utilities
npm run lint             # Run ESLint
npm run verify:env       # Verify environment variables
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Build Configuration

- TypeScript and ESLint errors are ignored during build (`ignoreBuildErrors: true`)
- Image optimization enabled for pravatar.cc, placehold.co, unsplash.com
- Output file tracing configured for workspace root
