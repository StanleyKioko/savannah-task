# Frontend

A React/TypeScript e-commerce frontend application built with Vite, React Router, and shadcn/ui components.

## Features

- **Product Browsing**: View and search products with filtering options
- **User Authentication**: Secure login and registration
- **Shopping Cart**: Add, remove, and update cart items
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode**: Toggle between light and dark themes
- **Order Notifications**: Real-time order status updates

## Tech Stack

- **React**: UI library
- **TypeScript**: Type-safe code
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Zustand**: State management
- **React Router**: Routing

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend API running (see the backend documentation)

### Installation

```bash
# Clone the repository
git https://github.com/StanleyKioko/savannah-task
cd Frontend

# Install dependencies
npm install
# or with bun
bun install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=http://localhost:8000/api
```

### Development

```bash
# Start the development server
npm run dev
# or with bun
bun run dev
```

The app will be available at http://localhost:5173.

### Building for Production

```bash
# Build the application
npm run build
# or with bun
bun run build

# Preview the production build
npm run preview
# or with bun
bun run preview
```

## Testing

### Unit and Integration Tests

```bash
# Run all tests
npm run test
# or with bun
bun run test

# Run tests with coverage
npm run test:coverage
# or with bun
bun run test:coverage
```

### End-to-End Tests

```bash
# Run Cypress tests in headless mode
npm run test:e2e
# or with bun
bun run test:e2e

# Open Cypress for interactive testing
npm run cypress:open
# or with bun
bun run cypress:open
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Layout components
│   │   ├── products/    # Product-related components
│   │   └── ui/          # UI components from shadcn/ui
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and API clients
│   ├── pages/           # Page components
│   ├── stores/          # Zustand state stores
│   └── types/           # TypeScript type definitions
├── .env                 # Environment variables
└── ...config files      # Various configuration files
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Continuous Integration**: Runs linting, type checking, and tests
- **Continuous Deployment**: Deploys to production on successful merge to main branch

## Customization

### Themes

The application uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.ts`.

### Components

UI components are based on shadcn/ui. You can add or modify components using the CLI:

```bash
npx shadcn-ui@latest add button
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or suggestions, please open an issue or reach out to the project maintainers.
