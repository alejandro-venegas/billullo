const { generateApi } = require("swagger-typescript-api");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.resolve(__dirname, "../src/api");

// Exports from http-client.ts that exist at runtime (enum / class).
// Everything else exported from http-client is a type or interface.
const HTTP_CLIENT_VALUE_EXPORTS = new Set(["ContentType", "HttpClient"]);

generateApi({
  input: path.resolve(__dirname, "../../backend/Billullo.Api/swagger.json"),
  output: OUTPUT_DIR,
  modular: true,
  httpClientType: "fetch",
  moduleNameIndex: 1,
  unwrapResponseData: true,
})
  .then(() => {
    // Post-process: fix imports for verbatimModuleSyntax compatibility.
    // - data-contracts exports only interfaces/types → use `import type`
    // - http-client exports a mix → add inline `type` keyword to type-only imports
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".ts"));
    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file);
      let content = fs.readFileSync(filePath, "utf-8");

      // All data-contracts imports are types
      content = content.replace(
        /^(import\s+)\{([^}]+)\}(\s+from\s+["']\.\/data-contracts["'])/gm,
        "$1type {$2}$3",
      );

      // http-client imports: add inline `type` to non-value exports
      content = content.replace(
        /^(import\s+)\{([^}]+)\}(\s+from\s+["']\.\/http-client["'])/gm,
        (match, pre, names, post) => {
          const fixed = names
            .split(",")
            .map((n) => {
              const trimmed = n.trim();
              if (!trimmed) return n;
              if (HTTP_CLIENT_VALUE_EXPORTS.has(trimmed)) return n;
              return n.replace(trimmed, `type ${trimmed}`);
            })
            .join(",");
          return `${pre}{${fixed}}${post}`;
        },
      );

      fs.writeFileSync(filePath, content);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
