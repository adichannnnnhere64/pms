# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Laravel application code (controllers, models, policies, jobs).
- `routes/` defines HTTP routes; `resources/` contains frontend React/Inertia pages, components, and assets.
- `config/` stores framework and package configuration.
- `database/` includes migrations, seeders, and the default `database.sqlite`.
- `tests/` is split into `tests/Feature` and `tests/Unit`.
- `public/` is the web root; Vite builds are emitted here.

## Build, Test, and Development Commands
- `composer install` installs PHP dependencies.
- `npm install` installs frontend dependencies.
- `php artisan migrate` runs database migrations (SQLite by default).
- `composer run dev` starts the full dev stack (Laravel server, queue listener, logs, Vite).
- `npm run dev` runs Vite only for frontend changes.
- `npm run build` produces a production frontend build.
- `php artisan test` or `./vendor/bin/pest` runs the test suite.

## Coding Style & Naming Conventions
- PHP follows PSR-12 with 4-space indentation; use `laravel/pint` for formatting.
- Frontend code is formatted with Prettier and linted with ESLint; run `npm run format` and `npm run lint`.
- Classes use StudlyCase, methods/variables use camelCase, and tests use `*Test.php` naming.

## Testing Guidelines
- Tests are written with Pest (`pestphp/pest`) and organized under `tests/Feature` and `tests/Unit`.
- Prefer descriptive test names that read as behavior (e.g., `it_allows_admin_to_update_workflows`).
- No explicit coverage threshold is configured; focus on critical paths and regressions.

## Commit & Pull Request Guidelines
- Git history shows short, imperative messages (e.g., "add dashboard"); keep commits concise and scoped.
- PRs should include a clear description, linked issues (if any), and UI screenshots for frontend changes.
- Call out migrations, config changes, or background job impacts in the PR body.

## Environment & Configuration Notes
- Copy `.env.example` to `.env` and set app keys as needed (`php artisan key:generate`).
- Queue runs in the dev stack; ensure jobs are idempotent and safe for retries.
