<h1 align="center">
  AI Concierge for WordPress <br />(RAG Proof of Concept)
</h1>

## 🌟 Overview

This repository contains a working end-to-end RAG pipeline for intelligent website search. Provides automatic summarization and source citations to help users search a website in a more human way.

#### Learn more at **[@todo blog post]**

## 🗂️ Project Structure

This project is structured as a monorepo using [TurboRepo](https://turbo.build/repo). It contains multiple applications and packages that work together to provide the full functionality of the POC.

<details>
<summary>Directory Structure (click to expand)</summary>

**NOTE**: This is a high-level overview of the project structure. For detailed documentation, please see [DEVELOPMENT.md](docs/DEVELOPMENT.md#directory-structure).

```bash
wpai-chatbot-example/
│   # GitHub Actions and deployment configurations
├── .github/
│   ├── deploy/              # Deployment scripts and configurations
│   └── workflows/           # CI/CD workflows and automation
│
│   # Main applications
├── apps/
│   ├── api/                 # NestJS REST API server - main backend service.
│   ├── chat/                # Next.js chat interface for end users.
│   ├── dashboard/           # Next.js admin dashboard for system management.
│   ├── nlp/                 # Python-Flask NLP operations like keyword recognition
│   ├── rag/                 # NestJS RAG pipeline (chunking, embedding, retrieval, re-ranking).
│   └── wordpress/           # WordPress plugin for CMS integration.
│
│   # Internal project documentation.
├── docs/
│   ├── DEVELOPMENT.md       # Development and contribution guidelines
│   └── SETUP.md             # Project setup and installation guide
│
├── README.md                # 👈 This file - repository overview.
│
├── docker-compose.yml              # Local development Docker setup
├── docker-compose.prod.yml         # Production Docker setup
├── package.json                    # Root package.json (workspace)
└── turbo.json                      # Turborepo configuration
```

</details>

## ⚙️ Setup

> [!WARNING]
> 🐉 There be dragons!
> This is an experimental **proof of concept** and not meant for production use.

For detailed setup instructions, please refer to the [SETUP.md](docs/SETUP.md) file.

## 🛠️ Development & Contributing

For detailed development guidelines, please refer to the [DEVELOPMENT.md](docs/DEVELOPMENT.md) file.

## 🚀 Application Server

| Application                      | Localhost Port        |
| -------------------------------- | --------------------- |
| API Server (NestJS)              | http://localhost:3000 |
| Chat Interface (Next.js)         | http://localhost:3001 |
| Admin Dashboard (Next.js)        | http://localhost:3002 |
| Firecrawl Service (Web Scraping) | http://localhost:3003 |
| Weaviate Console                 | http://localhost:8080 |
| Logto Auth (Core)                | http://localhost:6001 |
| Logto Auth (Admin)               | http://localhost:6002 |

## 🤩 Like what you see?

<a href="https://rtcamp.com/"><img src="https://rtcamp.com/wp-content/uploads/sites/2/2019/04/github-banner@2x.png" alt="Join us at rtCamp, we specialize in providing high performance enterprise WordPress solutions"></a>
