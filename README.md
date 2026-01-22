# Precast Management System - Frontend

A modern web application for managing precast concrete manufacturing operations, built with React, TypeScript, and Vite.

## Overview

This frontend application provides a comprehensive interface for managing all aspects of precast concrete manufacturing, including project management, element tracking, work orders, dispatch operations, and more.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Context
- **Forms:** React Hook Form + Zod validation
- **Data Tables:** TanStack Table
- **Charts:** Recharts + D3
- **HTTP Client:** Axios
- **Routing:** React Router 7
- **PDF Generation:** jsPDF

## Features

### Project Management
- Multi-project dashboard
- Project hierarchy (Towers, Floors)
- Project reports and summaries

### Element Management
- Element Type configuration
- Element tracking
- BOM (Bill of Materials) management
- Template export (Excel/CSV)

### Work Orders
- Work order creation and tracking
- Stage-based workflow management

### Dispatch & Receiving
- Dispatch scheduling
- In-transit tracking
- Delivery confirmation
- Stockyard management

### Quality Control
- QC reporting and charts
- Inspection tracking

### Additional Modules
- User management
- Attendance tracking
- Drawing management
- Invoice management
- Tenant management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd precastfront
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
VITE_BASE_URL=<your-api-base-url>
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:9000`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── Layout/             # Main layout components
├── lib/                # Utility functions
├── Pages/              # Page components
│   ├── Attendance/
│   ├── Bom/
│   ├── Department/
│   ├── DispatchReceving/
│   ├── DispatchStockyard/
│   ├── Drawing/
│   ├── Element/
│   ├── Elementtype/
│   ├── Invoice/
│   ├── People/
│   ├── Projects/
│   ├── Users/
│   ├── WorkOrder/
│   └── ...
├── ProjectLayout/      # Project-specific layout
├── Provider/           # React Context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── apiClient.ts    # Axios instance configuration
│   └── ...
├── Routes.tsx          # Application routing
├── App.tsx             # Root component
└── main.tsx            # Application entry point
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_BASE_URL` | Backend API base URL |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure linting passes
4. Submit a pull request

## License

Private - All rights reserved
