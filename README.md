# Pool Cleaner

A modern web application for managing pool cleaning services.

## Features

- User authentication and authorization
- Pool service scheduling
- Service history tracking
- Customer management
- Service provider management
- Real-time notifications
- Mobile-responsive design

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth.js

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pool_cleaner"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
├── app/          # Next.js app directory
├── components/   # React components
├── lib/          # Utility functions and configurations
├── prisma/       # Database schema and migrations
└── types/        # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 