# Deployment boundary

Cadence must have its own database URL, Square token-encryption key, Square
application credentials, callback URL, deployment history, and rollback target.
It must not fall back to Sentinel or legacy shared credentials in an independent
runtime.

Before promotion:

1. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` on the exact commit.
2. Configure only the Cadence variables listed in `.env.example` through the deployment provider.
3. Confirm the Square callback matches the Cadence environment and application.
4. Run database migrations with a tested backup and compatible rollback reader.
5. Record the exact deployment and prior Cadence rollback target.

The mutation integration test requires a disposable loopback PostgreSQL database
named `cadence_build` or `sentinel_build`, `SPLIT_ISOLATION_DATABASE_URL`, and a
matching `SPLIT_ISOLATION_CONFIRM_DATABASE`. It uses transactional DDL and
refuses a database that already has `public.square_connections`.
