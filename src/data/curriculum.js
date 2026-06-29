// Seed data for the 3-month frontend -> full-stack plan.
// Each task gets a stable id so completion state survives reloads.
export const HOURS_GOAL = 216

export const seedCurriculum = [
  {
    id: 'm1',
    title: 'Month 1 — Node + Express',
    focus: 'Master the API layer',
    weeks: [
      {
        id: 'm1w1',
        week: 'Week 1',
        topic: 'Node runtime: modules, npm, fs, path, events & buffers, streams, error handling.',
        build: 'A CLI/script using fs + streams (read & transform a file).',
        done: false,
      },
      {
        id: 'm1w2',
        week: 'Week 2',
        topic: 'Express: routing, request/response, middleware, status codes, REST conventions.',
        build: 'Express server with GET/POST routes returning JSON (in-memory data).',
        done: false,
      },
      {
        id: 'm1w3',
        week: 'Week 3',
        topic: 'Full CRUD, route params, query strings, validation (zod), error middleware.',
        build: 'Full CRUD API for one resource + validation.',
        done: false,
      },
      {
        id: 'm1w4',
        week: 'Week 4',
        topic: 'Project structure, controllers/services split, env config, logging, Postman.',
        build: 'Refactor into clean structure; test every endpoint in Postman.',
        done: false,
      },
    ],
  },
  {
    id: 'm2',
    title: 'Month 2 — Databases + Auth',
    focus: 'The real backend gap',
    weeks: [
      {
        id: 'm2w1',
        week: 'Week 1',
        topic: 'SQL fundamentals: tables, types, CRUD, WHERE, ORDER BY, joins, aggregation.',
        build: 'Hand-write SQL queries against a local Postgres DB.',
        done: false,
      },
      {
        id: 'm2w2',
        week: 'Week 2',
        topic: 'Schema design, indexes, transactions; connect Node ↔ Postgres via Prisma.',
        build: 'Migrate the Month-1 API to persist in Postgres via Prisma.',
        done: false,
      },
      {
        id: 'm2w3',
        week: 'Week 3',
        topic: 'Auth: bcrypt password hashing, JWT, protected routes, refresh tokens, roles.',
        build: 'Add signup/login + protect resource routes by user.',
        done: false,
      },
      {
        id: 'm2w4',
        week: 'Week 4',
        topic: 'Relations (one-to-many), ownership, pagination, filtering, error handling.',
        build: 'Multi-table app where each user owns their own records.',
        done: false,
      },
    ],
  },
  {
    id: 'm3',
    title: 'Month 3 — Production + Capstone',
    focus: 'Look like someone who has shipped',
    weeks: [
      {
        id: 'm3w1',
        week: 'Week 1',
        topic: 'Testing: Jest + Supertest, unit vs integration, test DB, basic CI.',
        build: 'Test suite covering main endpoints (happy + error paths).',
        done: false,
      },
      {
        id: 'm3w2',
        week: 'Week 2',
        topic: 'Docker basics, env/secrets, deploy to Railway/Render/Fly.io, prod logging.',
        build: 'App running live on a public URL via Docker.',
        done: false,
      },
      {
        id: 'm3w3',
        week: 'Week 3',
        topic: 'Caching with Redis, rate limiting; Fundamentals of Backend Engineering course.',
        build: 'Add caching/rate-limit; notes from the backend theory course.',
        done: false,
      },
      {
        id: 'm3w4',
        week: 'Week 4',
        topic: 'Capstone polish: README, architecture diagram, connect React frontend, demo.',
        build: 'One portfolio-ready full-stack app: live URL + clean repo.',
        done: false,
      },
    ],
  },
]
