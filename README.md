# Care Circle

Starter project for a Family Health Agent prototype.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app` — dashboard routes and app shell
- `src/components` — reusable visual components
- `src/lib` — shared types and rail contract
- `src/rails` — independent Gnani, Pine Labs, and Delhivery integration areas
- `src/data` — future local demo data

This foundation intentionally has no backend service, database, agent logic, or live rail integrations.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
