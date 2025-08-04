# Contributing

This document provides comprehensive guidelines for contributing to the project, including development setup, workflows, and best practices.

## Table of Contents

- [Contributing](#contributing)
  - [Table of Contents](#table-of-contents)
  - [Directory Structure](#directory-structure)
  - [Local Development](#local-development)
    - [Prerequisites](#prerequisites)
    - [Quick Start](#quick-start)
    - [Setup](#setup)
  - [Code Contributions (Pull Requests)](#code-contributions-pull-requests)
    - [Workflow](#workflow)
    - [Code Quality / Code Standards](#code-quality--code-standards)
  - [Release Process](#release-process)
    - [Hotfix Releases](#hotfix-releases)

## Directory Structure

<details>
<summary>Directory Structure (click to expand)</summary>

```shell
wpai-chatbot/
│   # GitHub Actions and deployment configurations
├── .github/
│   ├── deploy/              # Deployment scripts and configurations
│   └── workflows/           # CI/CD workflows and automation
│
│   # WPAI_Chatbot applications.
├── apps/
│   │
│   │   # Main backend API (NestJS). Handles core business logic.
│   ├── api/
│   │   ├── prisma/                 # Database schema and migrations
│   │   │   └── schema.prisma       # Prisma schema definition
│   │   ├── src/
│   │   │   ├── app.controller.ts   # Main application controller
│   │   │   ├── app.module.ts       # Root application module
│   │   │   ├── app.service.ts      # Main application service
│   │   │   ├── cluster.service.ts  # Cluster management service
│   │   │   ├── main.ts             # Application entry point
│   │   │   ├── prisma.service.ts   # Prisma database service
│   │   │   │   # Default AI prompts
│   │   │   ├── default-prompts/
│   │   │   │   ├── index.ts        # Prompt exports
│   │   │   │   ├── inference.ts    # Inference prompts
│   │   │   │   ├── query-processor.ts # Query processing prompts
│   │   │   │   └── system.ts       # System prompts
│   │   │   │   # Data Transfer Objects
│   │   │   ├── dto/
│   │   │   │   ├── pagination.dto.ts
│   │   │   │   ├── default-prompts/
│   │   │   │   ├── documents/
│   │   │   │   ├── firecrawl/
│   │   │   │   ├── message/
│   │   │   │   ├── pipelines/
│   │   │   │   └── prompt-placeholders/
│   │   │   ├── fallbackPromptPlaceholders/
│   │   │   ├── guards/             # Authentication & authorization guards
│   │   │   ├── interfaces/         # TypeScript interfaces
│   │   │   ├── modules/            # Feature modules
│   │   │   └── utils/              # Utility functions
│   │   ├── test/                   # E2E tests
│   │   ├── Dockerfile              # Container configuration
│   │   ├── nest-cli.json           # NestJS CLI configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   └── tsconfig.build.json     # Build-specific TypeScript config
│   │
│   │   # User-facing chat interface (Next.js)
│   ├── chat/
│   │   ├── src/
│   │   │   ├── actions/            # Server actions
│   │   │   ├── app/                # Next.js app directory
│   │   │   ├── components/         # React components
│   │   │   ├── constants/          # Application constants
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── interfaces/         # TypeScript interfaces
│   │   │   ├── lib/                # Utility libraries
│   │   │   ├── stores/             # State management
│   │   │   └── middleware.ts       # Next.js middleware
│   │   ├── components.json         # shadcn/ui component configuration
│   │   ├── Dockerfile              # Container configuration
│   │   ├── eslint.config.mjs       # ESLint configuration
│   │   ├── middleware.ts           # Root middleware
│   │   ├── next.config.ts          # Next.js configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   ├── postcss.config.mjs      # PostCSS configuration
│   │   └── tsconfig.json           # TypeScript configuration
│   │
│   │   # Admin dashboard (Next.js)
│   ├── dashboard/
│   │   ├── src/
│   │   │   ├── app/                # Next.js app directory
│   │   │   ├── components/         # React components
│   │   │   ├── data/               # Data layer
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── interfaces/         # TypeScript interfaces
│   │   │   └── lib/                # Utility libraries
│   │   ├── components.json         # shadcn/ui component configuration
│   │   ├── Dockerfile              # Container configuration
│   │   ├── eslint.config.mjs       # ESLint configuration
│   │   ├── next.config.ts          # Next.js configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   ├── postcss.config.mjs      # PostCSS configuration
│   │   └── tsconfig.json           # TypeScript configuration
│   │
│   │   # Natural Language Processing service (Python)
│   ├── nlp/
│   │   ├── app.py                  # Main application
│   │   ├── Dockerfile              # Container configuration
│   │   └── requirements.txt        # Python dependencies
│   │
│   │   # RAG (Retrieval-Augmented Generation) service for AI-powered search
│   ├── rag/
│   │   ├── src/
│   │   │   ├── app.controller.ts   # Main controller
│   │   │   ├── app.module.ts       # Root module
│   │   │   ├── app.service.ts      # Main service
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── main.ts             # Application bootstrap
│   │   │   ├── commands/           # CLI commands
│   │   │   ├── langchain/          # LangChain integration
│   │   │   ├── openai/             # OpenAI integration
│   │   │   ├── pinecone/           # Pinecone vector database
│   │   │   └── weaviate/           # Weaviate vector database
│   │   ├── test/                   # Tests
│   │   ├── nest-cli.json           # NestJS CLI configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   └── tsconfig.build.json     # Build-specific TypeScript config
│   │
│   │   # WordPress plugin for integrating WPAI_Chatbot.
│   └── wordpress/
│       └── DEVELOPMENT.md       # See the local development section for more details.
│
│   # Docs
├── docs/
│   └── DEVELOPMENT.md              # Development guide . 👈 YOU ARE HERE
│
│   # Shared packages and utilities
├── packages/                       # Shared packages
││
│   # Tooling and configuration files
├── .editorconfig            # Code style configuration
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── .lintstagedrc.mjs       # Lint-staged configuration
├── .nvmrc                   # Node.js version specification
├── .prettierignore          # Prettier ignore rules
├── .prettierrc.mjs          # Prettier configuration
├── .eslint.config.js        # ESLint configuration
├── docker-compose.yml       # Local development environment
├── docker-compose.prod.yml  # Production deployment configuration
├── package.json             # Root package.json for workspace management
├── package-lock.json        # Dependency lock file
├── turbo.json               # TurboRepo build pipeline configuration.
│
└── README.md                # Repository overview.
```

</details>

## Local Development

### Prerequisites

- **NVM** (Node Version Manager) - For managing and installing Node.js and npm
- **Docker** + **Docker Compose** - For loading/running the container.
- **Storage**: At least 10-15GB free space

### Quick Start

Follow these steps to get WPAI_Chatbot running locally:

1. **Clone the repository**

   ```bash
   git clone https://github.com/rtCamp/wpai-chatbot.git
   cd wpai-chatbot
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and populate the variables, then copy it into the following `apps/*` directories:

   ```bash
   cp .env apps/api/.env
   cp .env apps/chat/.env
   cp .env apps/dashboard/.env
   cp .env apps/rag/.env
   ```

3. **Switch to the correct Node.js version**

   ```bash
   nvm use
   ```

   If you don't have the required Node.js version installed, you can install it using:

   ```bash
   nvm install

   # Then you can `use` it
   nvm use
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Start the development environment**

   ```bash
   docker compose up --build -d
   ```

6. **Access the applications**
   - **API Server**: http://localhost:3000
   - **Chat Interface**: available on local WordPress website after activating the plugin
   - **Admin Dashboard**: http://localhost:3002
   - **Firecrawl Service**: http://localhost:3003
   - **Weaviate Console**: http://localhost:8080
   - **Logto Auth**: http://localhost:6001 (Core), http://localhost:6002 (Admin)

7. **Verify the setup**
   - Check that all containers are running: `docker compose ps`
   - Access the chat interface in your browser

### Setup

For comprehensive and detailed setup instructions on configuring Logto, Weaviate, and symlinking with WordPress, please refer to [SETUP.md](./SETUP.md).

## Code Contributions (Pull Requests)

### Workflow

The `develop` branch is used for active development, while `main` contains a snapshot of the current production build. Always create a new branch from `develop` when working on a new feature or bug fix.

Branches should be prefixed with the type of change (e.g. `feat`, `chore`, `tests`, `fix`, etc.) followed by a short description of the change. For example, a branch for a new feature called "Add new feature" could be named `feat/add-new-feature`.

PR titles should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

As a general rule, PRs should be **squash-merged**, to keep the commit history helpful. If you think a PR should be merged with multiple commits, that's more likely a sign that the PR is too large and should be split into smaller, more manageable pieces.

### Code Quality / Code Standards

Before submitting any pull request, ensure your code meets our quality standards by running the following commands. These tools help maintain consistent code style, catch potential issues, and ensure type safety across the project.

- **ESLint:**
  This project uses [ESLint](https://eslint.org), which is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

  You can run ESLint using the following command:

  ```bash
  npm run lint
  ```

  To automatically fix linting issues where possible:

  ```bash
  npm run lint:fix
  ```

  Or for a specific app:

  ```bash
  cd apps/api
  npm run lint
  ```

- **TypeScript Type Checking:**
  Typechecking is done using the TypeScript compiler. This ensures that your code adheres to the defined types and interfaces.

  ```bash
  npm run typecheck
  ```

  Or for a specific app:

  ```bash
  cd apps/chat
  npm run typecheck
  ```

- **Prettier (Code formatting):**
  This project uses [Prettier](https://prettier.io) for code formatting. It ensures that all code is formatted consistently across the project.

  ```bash
  npm run format
  ```

  Or to check format of all files:

  ```bash
  npm run format:check
  ```

- **Build:**
  Build all applications and packages in the workspace using Turborepo:

  ```bash
  npm run build
  ```

- **Development:**
  Start the development environment for all applications:

  ```bash
  npm run dev
  ```

- **Database:**
  Generate Prisma client after schema changes:

  ```bash
  npm run db:generate
  ```

- **Clean:**
  Remove all node_modules, .next directories, and package-lock.json files to start fresh:

  ```bash
  npm run clean
  ```

- **Prepare**
  Runs Husky to set up Git hooks after install, but won’t throw an error if Husky isn’t installed.

  ```bash
  npm run prepare
  ```

## Release Process

A release is triggered by pushing `develop` to `main`. This is handled by a repository admin. Once pushed, the CI pipeline will push the changes to the production server and restart the services.

> [!IMPORTANT]
> Currently, the `apps/wordpress` plugin is not automatically deployed to the WordPress backend. It should be manually built, and then uploaded to the server.

### Hotfix Releases

If a hotfix is needed on production while `develop` is still in progress, create a new branch from `main` with the prefix `hotfix/`. After the hotfix "released" (merged into `main`), the `develop` branch should be **rebased** to include the hotfix changes.
