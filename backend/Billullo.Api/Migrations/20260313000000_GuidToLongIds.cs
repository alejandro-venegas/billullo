using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Billullo.Api.Migrations
{
    /// <inheritdoc />
    public partial class GuidToLongIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ────────────────────────────────────────────────────────────
            // Step 1: Drop FK constraints that reference uuid PK columns
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules" DROP CONSTRAINT "FK_CategoryRules_Categories_CategoryId";
                ALTER TABLE "Transactions" DROP CONSTRAINT "FK_Transactions_Categories_CategoryId";
                ALTER TABLE "EmailParsingRules" DROP CONSTRAINT "FK_EmailParsingRules_Categories_CategoryId";
            """);

            // ────────────────────────────────────────────────────────────
            // Step 2: Drop indexes on FK columns (will be recreated)
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_CategoryRules_CategoryId";
                DROP INDEX IF EXISTS "IX_Transactions_CategoryId";
                DROP INDEX IF EXISTS "IX_EmailParsingRules_CategoryId";
            """);

            // ────────────────────────────────────────────────────────────
            // Step 3: Convert Categories (referenced table — must go first)
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "Categories" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
            """);

            // Build a uuid→bigint mapping, then convert FK columns in child tables
            migrationBuilder.Sql("""
                UPDATE "CategoryRules" cr
                   SET "CategoryId" = NULL
                 WHERE NOT EXISTS (SELECT 1 FROM "Categories" c WHERE c."Id" = cr."CategoryId");

                ALTER TABLE "CategoryRules" ADD COLUMN "NewCategoryId" bigint;
                UPDATE "CategoryRules" cr
                   SET "NewCategoryId" = c."NewId"
                  FROM "Categories" c
                 WHERE cr."CategoryId" = c."Id";
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Transactions" ADD COLUMN "NewCategoryId" bigint;
                UPDATE "Transactions" t
                   SET "NewCategoryId" = c."NewId"
                  FROM "Categories" c
                 WHERE t."CategoryId" = c."Id";
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "EmailParsingRules" ADD COLUMN "NewCategoryId" bigint;
                UPDATE "EmailParsingRules" epr
                   SET "NewCategoryId" = c."NewId"
                  FROM "Categories" c
                 WHERE epr."CategoryId" = c."Id";
            """);

            // Drop old PK, old Id, rename NewId → Id, add new PK
            migrationBuilder.Sql("""
                ALTER TABLE "Categories" DROP CONSTRAINT "PK_Categories";
                ALTER TABLE "Categories" DROP COLUMN "Id";
                ALTER TABLE "Categories" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "Categories" ADD CONSTRAINT "PK_Categories" PRIMARY KEY ("Id");
            """);

            // Drop old FK columns, rename new ones
            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules" DROP COLUMN "CategoryId";
                ALTER TABLE "CategoryRules" RENAME COLUMN "NewCategoryId" TO "CategoryId";

                ALTER TABLE "Transactions" DROP COLUMN "CategoryId";
                ALTER TABLE "Transactions" RENAME COLUMN "NewCategoryId" TO "CategoryId";

                ALTER TABLE "EmailParsingRules" DROP COLUMN "CategoryId";
                ALTER TABLE "EmailParsingRules" RENAME COLUMN "NewCategoryId" TO "CategoryId";
            """);

            // ────────────────────────────────────────────────────────────
            // Step 4: Convert CategoryRules.Id
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules" DROP CONSTRAINT "PK_CategoryRules";
                ALTER TABLE "CategoryRules" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
                ALTER TABLE "CategoryRules" DROP COLUMN "Id";
                ALTER TABLE "CategoryRules" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "CategoryRules" ADD CONSTRAINT "PK_CategoryRules" PRIMARY KEY ("Id");
            """);

            // ────────────────────────────────────────────────────────────
            // Step 5: Convert Transactions.Id
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "Transactions" DROP CONSTRAINT "PK_Transactions";
                ALTER TABLE "Transactions" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
                ALTER TABLE "Transactions" DROP COLUMN "Id";
                ALTER TABLE "Transactions" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "Transactions" ADD CONSTRAINT "PK_Transactions" PRIMARY KEY ("Id");
            """);

            // ────────────────────────────────────────────────────────────
            // Step 6: Convert EmailParsingRules.Id
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "EmailParsingRules" DROP CONSTRAINT "PK_EmailParsingRules";
                ALTER TABLE "EmailParsingRules" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
                ALTER TABLE "EmailParsingRules" DROP COLUMN "Id";
                ALTER TABLE "EmailParsingRules" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "EmailParsingRules" ADD CONSTRAINT "PK_EmailParsingRules" PRIMARY KEY ("Id");
            """);

            // ────────────────────────────────────────────────────────────
            // Step 7: Convert EmailConfigs.Id
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "EmailConfigs" DROP CONSTRAINT "PK_EmailConfigs";
                ALTER TABLE "EmailConfigs" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
                ALTER TABLE "EmailConfigs" DROP COLUMN "Id";
                ALTER TABLE "EmailConfigs" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "EmailConfigs" ADD CONSTRAINT "PK_EmailConfigs" PRIMARY KEY ("Id");
            """);

            // ────────────────────────────────────────────────────────────
            // Step 8: Convert RefreshTokens.Id
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "RefreshTokens" DROP CONSTRAINT "PK_RefreshTokens";
                ALTER TABLE "RefreshTokens" ADD COLUMN "NewId" bigint GENERATED ALWAYS AS IDENTITY;
                ALTER TABLE "RefreshTokens" DROP COLUMN "Id";
                ALTER TABLE "RefreshTokens" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "RefreshTokens" ADD CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id");
            """);

            // ────────────────────────────────────────────────────────────
            // Step 9: Recreate FK constraints and indexes
            // ────────────────────────────────────────────────────────────
            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules"
                    ADD CONSTRAINT "FK_CategoryRules_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id")
                    ON DELETE CASCADE;

                ALTER TABLE "Transactions"
                    ADD CONSTRAINT "FK_Transactions_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id")
                    ON DELETE SET NULL;

                ALTER TABLE "EmailParsingRules"
                    ADD CONSTRAINT "FK_EmailParsingRules_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id")
                    ON DELETE SET NULL;

                CREATE INDEX "IX_CategoryRules_CategoryId" ON "CategoryRules" ("CategoryId");
                CREATE INDEX "IX_Transactions_CategoryId" ON "Transactions" ("CategoryId");
                CREATE INDEX "IX_EmailParsingRules_CategoryId" ON "EmailParsingRules" ("CategoryId");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverting uuid→bigint is lossy — original UUIDs cannot be recovered.
            // This Down() converts bigint back to uuid with fresh random values.

            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules" DROP CONSTRAINT "FK_CategoryRules_Categories_CategoryId";
                ALTER TABLE "Transactions" DROP CONSTRAINT "FK_Transactions_Categories_CategoryId";
                ALTER TABLE "EmailParsingRules" DROP CONSTRAINT "FK_EmailParsingRules_Categories_CategoryId";

                DROP INDEX IF EXISTS "IX_CategoryRules_CategoryId";
                DROP INDEX IF EXISTS "IX_Transactions_CategoryId";
                DROP INDEX IF EXISTS "IX_EmailParsingRules_CategoryId";
            """);

            // Categories
            migrationBuilder.Sql("""
                ALTER TABLE "Categories" ADD COLUMN "NewId" uuid DEFAULT gen_random_uuid();
                UPDATE "Categories" SET "NewId" = gen_random_uuid();

                ALTER TABLE "CategoryRules" ADD COLUMN "NewCategoryId" uuid;
                UPDATE "CategoryRules" cr SET "NewCategoryId" = c."NewId" FROM "Categories" c WHERE cr."CategoryId" = c."Id";

                ALTER TABLE "Transactions" ADD COLUMN "NewCategoryId" uuid;
                UPDATE "Transactions" t SET "NewCategoryId" = c."NewId" FROM "Categories" c WHERE t."CategoryId" = c."Id";

                ALTER TABLE "EmailParsingRules" ADD COLUMN "NewCategoryId" uuid;
                UPDATE "EmailParsingRules" epr SET "NewCategoryId" = c."NewId" FROM "Categories" c WHERE epr."CategoryId" = c."Id";

                ALTER TABLE "Categories" DROP CONSTRAINT "PK_Categories";
                ALTER TABLE "Categories" DROP COLUMN "Id";
                ALTER TABLE "Categories" RENAME COLUMN "NewId" TO "Id";
                ALTER TABLE "Categories" ALTER COLUMN "Id" SET NOT NULL;
                ALTER TABLE "Categories" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
                ALTER TABLE "Categories" ADD CONSTRAINT "PK_Categories" PRIMARY KEY ("Id");

                ALTER TABLE "CategoryRules" DROP COLUMN "CategoryId";
                ALTER TABLE "CategoryRules" RENAME COLUMN "NewCategoryId" TO "CategoryId";
                ALTER TABLE "CategoryRules" ALTER COLUMN "CategoryId" SET NOT NULL;

                ALTER TABLE "Transactions" DROP COLUMN "CategoryId";
                ALTER TABLE "Transactions" RENAME COLUMN "NewCategoryId" TO "CategoryId";

                ALTER TABLE "EmailParsingRules" DROP COLUMN "CategoryId";
                ALTER TABLE "EmailParsingRules" RENAME COLUMN "NewCategoryId" TO "CategoryId";
            """);

            // Independent tables
            var tables = new[] { "CategoryRules", "Transactions", "EmailParsingRules", "EmailConfigs", "RefreshTokens" };
            foreach (var table in tables)
            {
                migrationBuilder.Sql($"""
                    ALTER TABLE "{table}" DROP CONSTRAINT "PK_{table}";
                    ALTER TABLE "{table}" ADD COLUMN "NewId" uuid DEFAULT gen_random_uuid();
                    UPDATE "{table}" SET "NewId" = gen_random_uuid();
                    ALTER TABLE "{table}" DROP COLUMN "Id";
                    ALTER TABLE "{table}" RENAME COLUMN "NewId" TO "Id";
                    ALTER TABLE "{table}" ALTER COLUMN "Id" SET NOT NULL;
                    ALTER TABLE "{table}" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
                    ALTER TABLE "{table}" ADD CONSTRAINT "PK_{table}" PRIMARY KEY ("Id");
                """);
            }

            migrationBuilder.Sql("""
                ALTER TABLE "CategoryRules"
                    ADD CONSTRAINT "FK_CategoryRules_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id") ON DELETE CASCADE;
                ALTER TABLE "Transactions"
                    ADD CONSTRAINT "FK_Transactions_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id") ON DELETE SET NULL;
                ALTER TABLE "EmailParsingRules"
                    ADD CONSTRAINT "FK_EmailParsingRules_Categories_CategoryId"
                    FOREIGN KEY ("CategoryId") REFERENCES "Categories"("Id") ON DELETE SET NULL;

                CREATE INDEX "IX_CategoryRules_CategoryId" ON "CategoryRules" ("CategoryId");
                CREATE INDEX "IX_Transactions_CategoryId" ON "Transactions" ("CategoryId");
                CREATE INDEX "IX_EmailParsingRules_CategoryId" ON "EmailParsingRules" ("CategoryId");
            """);
        }
    }
}
