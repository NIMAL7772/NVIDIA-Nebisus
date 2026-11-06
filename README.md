# STOCK AI V2

STOCK AI V2 is an AI-powered inventory management platform for tracking products, suppliers, purchase orders, goods received, and sales. Its dashboard and analytics views turn recorded inventory and sales data into operational insights and reorder recommendations.

## Technology stack

| Area | Technologies |
| --- | --- |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| AI | NVIDIA Nemotron, accessed through NVIDIA's OpenAI-compatible API |

## Features

- **Dashboard and analytics:** View inventory totals, low-stock and out-of-stock counts, sales trends, top products, and related business metrics.
- **Inventory management:** Create, view, update, and delete products. Product data includes stock levels, reorder settings, lead time, and target stock days.
- **Supplier management:** Create, view, update, and delete suppliers. Suppliers that are still linked to products or purchase orders cannot be deleted.
- **Purchase orders and goods receiving:** Create and track purchase orders, change their status, and receive goods. Receiving updates the corresponding product stock and supports partial receipts.
- **Sales management:** Record completed sales, prevent sales that exceed available stock, and update stock levels automatically.
- **AI inventory intelligence:** Calculate demand, stock-risk, pending-order, and reorder information from recorded data, then use NVIDIA Nemotron to answer inventory questions with that context.

## Project structure

```text
STOCK AI NVIDIA/
├── backend/
│   ├── .env.example          # Safe configuration template
│   ├── requirements.txt
│   └── app/
│       ├── core/             # Configuration and SQLite database setup
│       ├── models/           # SQLAlchemy models
│       ├── routes/           # FastAPI endpoints
│       ├── schemas/          # Request and response schemas
│       ├── services/         # NVIDIA Nemotron integration
│       └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Windows setup

### 1. Configure and start the backend

From PowerShell at the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

If PowerShell prevents the virtual environment activation script from running, activate it for the current process with:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

The API starts at [http://127.0.0.1:8000](http://127.0.0.1:8000). FastAPI's interactive Swagger documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Configure the backend environment

`backend/.env.example` is a safe template. Copy it to `backend/.env` and set values appropriate for your environment:

```dotenv
APP_NAME=STOCK AI API
APP_VERSION=2.0.0
DEBUG=True

NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
```

Never commit `backend/.env` or a real NVIDIA API key. The application requires the API key only when requesting NVIDIA Nemotron insights; inventory, supplier, purchase-order, and sales data remain local.

### 3. Install and start the frontend

Open a second PowerShell window at the project root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend starts at [http://localhost:5173](http://localhost:5173). It uses `http://127.0.0.1:8000` as its default API base URL. To use a different backend address, set `VITE_API_BASE_URL` in a local `frontend/.env` file; do not commit that file.

## Local database and generated files

On startup, the backend creates its SQLite database at `backend/stocksai_v2.db` and creates the application tables if they do not already exist. This database is local application data and is intentionally excluded from Git; do not commit it.

The repository also excludes local environment files, Python virtual environments, frontend dependencies, and frontend build output. Keep credentials and generated files out of commits.

## Verify a production frontend build

```powershell
cd frontend
npm run build
```

This creates local frontend build output under `frontend/dist`, which is ignored by Git.
