# VestQuest MVP

This is the initial MVP for VestQuest, a startup equity modeling tool built with Next.js, Supabase, and shadcn/ui.

## Features

- Simple equity calculator
- Equity grant management
- Vesting schedule visualization
- Basic tax calculations
- User authentication

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/`
   - Copy your Supabase URL and anon key to `.env.local`
4. Run the development server: `npm run dev`

## Tech Stack

- Next.js 14 (App Router)
- JavaScript
- Supabase (Database & Auth)
- shadcn/ui (UI Components)
- Tailwind CSS
- Recharts (Charts)

## Directory Structure

```
src/
├── app/               # Next.js app router pages
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── calculator/   # Calculator components
│   ├── dashboard/    # Dashboard components
│   └── ui/           # shadcn/ui components
├── lib/              # Utilities and configs
└── utils/            # Helper functions
```
# VestQuest
