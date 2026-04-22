# SmartCare App

This folder contains the SmartCare React PWA.

SmartCare is an offline-first symptom-checking app that:

- caches core assets for offline use
- stores the medical knowledge base in IndexedDB
- runs symptom scoring locally in the browser
- saves session history on-device
- includes a base for reconnect sync and KB updates

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
npm run e2e
```

## Main folders

- `src/screens` contains the app screens
- `src/agents` contains local scoring and recommendation logic
- `src/db` contains IndexedDB setup and seeding
- `src/sync` contains reconnect sync and KB update helpers
- `public` contains the manifest, icons, and knowledge base JSON

See the repository root [README.md](</home/niraj/Projects /college projects /SE project /SMARTCARE-AN-offline-First-AI-system/README.md:1>) for the full project overview and Ollama integration guidance.
