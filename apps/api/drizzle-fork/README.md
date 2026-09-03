# Fork-only migrations

Schema changes that exist in this fork but not in `usekaneo/kaneo` live here, in
their own migration chain with its own bookkeeping table
(`drizzle.__drizzle_migrations_fork`). `../drizzle/` is upstream's chain and
stays **byte-identical to upstream** — never add, renumber or edit anything in
it, and merges will never conflict there.

Both chains are applied at startup (`src/index.ts`, upstream's first) and by the
integration test harness (`tests/api-integration/helpers/database.ts`).

## Why a separate chain

`drizzle-orm@0.45` decides what to apply from a single high-water mark:

```js
select ... from __drizzle_migrations order by created_at desc limit 1
if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) { apply }
```

`created_at` is the journal's `when`. The recorded hash is never compared, and
filenames and `idx` are ignored. A fork migration living inside upstream's chain
therefore causes two problems: its number collides with upstream's next one,
and — worse — once applied, any upstream migration generated *earlier* than it
falls below the high-water mark and is **skipped silently**, with no error and a
missing table at runtime.

Separate chains give each its own high-water mark, so neither can mask the
other. `schema.ts` is then the only file a merge has to reconcile.

## Layout

| File | Owner | Rewritten? |
| --- | --- | --- |
| `0000_fork_schema.sql` | `db:generate:fork` | Yes, in place |
| `0001_…` and later | hand-written | Never |

`0000_fork_schema.sql` is the *complete* set of schema changes the fork adds on
top of upstream, as one converging migration — not an incremental step. It is
diffed against upstream's current tip, so after merging upstream you just rerun
the generator and it re-converges by itself.

Because it is rewritten in place and replayed, every statement in this folder
must be idempotent. The generator adds `IF NOT EXISTS` guards for it; anything
you hand-write needs its own (guard backfills with `AND col IS NULL`).

A replay appends a fresh row to `__drizzle_migrations_fork` rather than
updating the old one, so that table accumulates a row per application. It is
bookkeeping only — the migrator reads just the newest `created_at`.

## Changing the fork's schema

Edit `src/database/schema.ts`, then:

```bash
pnpm --filter @kaneo/api db:generate:fork
pnpm test:integration          # applies both chains to a fresh database
```

The generator borrows upstream's chain to get its diff — it runs
`drizzle-kit generate`, lifts the SQL out, and restores `../drizzle/` exactly as
it was, even if generate fails. Never commit a generated file in `../drizzle/`.

Data migrations do not belong in the generated file: hand-write them as a new
higher-numbered file here and add a journal entry. The generator only pushes
their `when` forward, keeping the journal strictly increasing — an out-of-order
entry would be skipped outright on a fresh database.

Dropping a fork column is the one case the generator cannot express: upstream's
snapshot never had the column, so no `DROP` is emitted. Remove it from
`schema.ts`, rerun the generator, and hand-write the guarded `DROP COLUMN IF
EXISTS` as a new file.

## Merging upstream

Nothing to do for `../drizzle/` — it fast-forwards. The only conflict left is
`src/database/schema.ts`, an ordinary text merge, since the fork's columns sit
alongside upstream's in the same table definitions. Rerun `db:generate:fork`
afterwards so the fork migration is expressed against the new upstream tip.

Note that plain `pnpm --filter @kaneo/api db:generate` will always report the
fork's columns as pending changes, because upstream's snapshot chain does not
know about them. That is expected. Do not commit what it writes.
