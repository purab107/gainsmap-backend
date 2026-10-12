# GainsMap Backend

Modular Monolith backend for GainsMap built with **Node.js (JavaScript ES Modules)**, **Fastify**, and **Prisma ORM** over **PostgreSQL 15+**.

## Quick Start

### 1. Start Local PostgreSQL
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client & Migrate
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Run Development Server
```bash
npm run dev
```

## Architectural Guidelines

- **Modular Monolith**: Code is organized into isolated domain modules under `src/modules/`.
- **Public API Boundaries**: Modules only interact via each module's `index.js`.
- **Enforcement**: Run `npm run lint:boundaries` to verify dependency boundaries with `dependency-cruiser`.
