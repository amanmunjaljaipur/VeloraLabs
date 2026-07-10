import type { StudioFileMap } from "@/lib/app-studio/types";

/** Base Vite + React + Tailwind sandbox files for Sandpack. */
export function createBaseScaffold(appTitle = "My App"): StudioFileMap {
  return {
    "/package.json": JSON.stringify(
      {
        name: "studio-app",
        private: true,
        version: "0.0.1",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.454.0",
          clsx: "^2.1.1",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.1",
          vite: "^5.4.0",
          typescript: "^5.5.0",
        },
      },
      null,
      2
    ),
    "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "/vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    "/src/main.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    "/src/styles.css": `* { box-sizing: border-box; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
`,
    "/src/App.tsx": `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Ready to build</h1>
        <p className="text-slate-600">
          Describe your product in the chat. I will generate a full React app here with live preview.
        </p>
      </div>
    </div>
  );
}
`,
  };
}

export function listFilePaths(files: StudioFileMap): string[] {
  return Object.keys(files).sort();
}
