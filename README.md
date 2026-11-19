# Family Archive

Interactive photographic family tree, cultural heritage explorer, and live historical archive website (`family-archive`) built with **Next.js 16 (App Router)**, **Tailwind CSS 4**, **shadcn/ui**, **React Flow**, **Google Cloud Firestore**, and **Cloudinary**.

Currently featuring the **Jacob Lang & Maria Tampemawa Family** collection ([brouwertree.com/langgene.html](https://www.brouwertree.com/langgene.html) & `langgene3.html`).

## Key Features

- **Interactive Photographic Family Tree** (`@xyflow/react` + `@dagrejs/dagre`):
  - Pan, zoom, minimap, Vertical/Horizontal layout toggle, branch filtering (`II-a Hendrik`, `II-b Joseph`, `II-c Carolina/Parera`, `II-d Elisabeth/Kuitert`), generation depth filter, search-to-focus, and direct ancestral/descendant **Lineage Tracing**.
  - Click any ancestor card to open their archival dossier, browse spouses/children/sources, edit details, add descendants, or upload custom portrait photos.
- **Heritage & Live Public Data APIs (Interactive shadcn Data Tables)**:
  - **Surname Heritage Matrix**: Live enrichment via **Nationalize.io API** + **OpenArchives.nl** record counts + **Wikipedia REST API**, cached in the database, with CSV export.
  - **Live Dutch & Indies Civil Archives**: Real-time search against **OpenArchives.nl API v1.0** (`api.openarch.nl`) with direct links to original civil certificates.
  - **Ancestral Homelands Atlas**: Live **Wikipedia REST API v1** geography and historical context for Manado, Minahasa, Tondano, Kema, Groningen, Blitar, and the Indo-European diaspora.
  - **BrouwerTree Primary Sources Index**: Filterable table of VOC voyages (1723/1778), _Almanak van Nederlandsch-Indië_ entries, gravestones, shipping lists (_MS Sibajak_), war graves, and naturalization records.
- **Complete Members Directory Table & Photo Archive Timeline**:
  - Searchable, sortable directory of all family members with CSV export, portrait cabinet, historical plates, and 1723–1962 timeline.
- **Free Database Architecture**:
  - Runs immediately with zero config on **local SQLite / LibSQL** (`./data/lang-heritage.db`).
  - Drop in Google Firebase keys in `.env.local` (see `.env.example`) to switch seamlessly to **Google Firebase Firestore (Free Spark Tier)**, or add `TURSO_DATABASE_URL` for **Turso Cloud SQLite**.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:9090](http://localhost:9090).
