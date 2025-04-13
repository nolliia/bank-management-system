# Bank Account Management App

A modern web application for managing bank accounts and transferring funds, built with Next.js 15, TypeScript, Redux, and TailwindCSS.

## Features

- **Account Management**: Create, view, edit, and delete bank accounts
- **Fund Transfers**: Transfer funds between accounts
- **Internationalization**: Multi-language support with English and additional language
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) with [Shadcn/UI](https://ui.shadcn.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Testing**: [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── actions/          # Server Actions
│   ├── [locale]/         # Localized routes
│   │   ├── accounts/     # Account management pages
│   │   └── transfer/     # Fund transfer pages
├── components/           # React components
│   ├── ui/               # Shadcn UI components
│   ├── account-list.tsx  # Account listing component
│   ├── create-account-form.tsx
│   ├── edit-account-form.tsx
│   ├── transfer-fund-form.tsx
│   └── transfer-history.tsx
├── i18n/                 # Internationalization setup
├── lib/                  # Utilities and Redux setup
│   ├── redux/            # Redux store and features
│   │   ├── features/     # Redux slices
│   │   ├── provider.tsx  # Redux provider
│   │   └── store.ts      # Redux store configuration
│   └── utils.ts          # Utility functions
└── middleware.ts         # Next.js middleware (for i18n)
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/nolliia/bank-management-system.git
cd bank-management-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## State Management

This application uses Redux for state management. All data is stored in the client-side Redux store and persists only for the duration of the browser session. Server Actions are used to simulate backend interactions.

## Testing

Run the test suite with:

```bash
npm test
# or
yarn test
```

For test coverage:

```bash
npm run test:coverage
# or
yarn test:coverage
```

## Internationalization

The app supports multiple languages (English and French) with routing based on locale. The language can be switched using the language switcher in the navigation bar.

## Notes

- This is a client-side application with no backend database
- All data is lost on page refresh as it's stored in memory using Redux
- The project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
