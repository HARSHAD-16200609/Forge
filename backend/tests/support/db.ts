import { prisma } from "../../src/config/prisma";

function assertTestDb(): void {
  const dbName = process.env.DATABASE_URL?.split("/").pop()?.split("?")[0];
  if (process.env.NODE_ENV !== "test" || !dbName?.startsWith("Forge_test")) {
    throw new Error(
      `resetDb refused: expected NODE_ENV=test and a DATABASE_URL pointing at the Forge_test database, got DATABASE_URL db "${dbName}". This prevents wiping dev/prod data.`
    );
  }
}

export async function resetDb(): Promise<void> {
  assertTestDb();
  const tables = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

  const tableNames = tables
    .map((t) => t.tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"${name}"`)
    .join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`
  );
}

export { prisma };