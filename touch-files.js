const fs = require("fs");
const path = require("path");

// Create the missing manifest file
const manifestDir = path.join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "(unauthenticated)"
);
const manifestFile = path.join(
  manifestDir,
  "page_client-reference-manifest.js"
);

try {
  // Create directory if it doesn't exist
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
    console.log(`Created directory: ${manifestDir}`);
  }

  // Create empty file if it doesn't exist
  if (!fs.existsSync(manifestFile)) {
    fs.writeFileSync(manifestFile, "// Auto-generated empty manifest file");
    console.log(`Created file: ${manifestFile}`);
  }

  console.log("Successfully created missing manifest files");
} catch (error) {
  console.error("Error creating manifest files:", error);
}
