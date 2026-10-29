
# NVIDIA-Nebisus
AI-powered inventory management with sales analytics, smart reorder recommendations, and NVIDIA Nemotron AI assistance.
# STOCK AI — Inventory intelligence

An inventory and sales-intelligence application for retail and wholesale shops. It supports transaction entry and imports, with a transaction layer ready for barcode/RFID adapters.

## Run it

1. Create a virtual environment and install dependencies: `pip install -r requirements.txt`
2. Set `NVIDIA_API_KEY` in `.streamlit/secrets.toml` for local use:

   toml
   NVIDIA_API_KEY = "YOUR_NVIDIA_API_KEY"
   

3. Start: `streamlit run app.py`
4. Select **Load optional sample data** only if you want clearly-labelled synthetic records for onboarding.

Run the unit tests with `pytest -q`. To make a real NVIDIA API request after configuring the key, use PowerShell:

powershell
$env:NVIDIA_RUN_INTEGRATION_TESTS = "1"
pytest -q test_nvidia_ai.py
Remove-Item Env:NVIDIA_RUN_INTEGRATION_TESTS


## What the MVP covers

- Landing page with separate Data Entry and Analysis workspaces.
- CSV/XLSX imports for products, opening balances, purchases, sales, and customers.
- Manual stock-in/out, opening and adjustment entries; SQLite persistence; validation and audit log.
- Custom date range KPIs, sales trend, top/slow products, top customers, current stock, and explainable reorder table.
- NVIDIA Nemotron AI assistant using the NVIDIA API Catalog’s OpenAI-compatible endpoint. It receives the application’s prepared inventory metrics and product/reorder summaries—there is no raw database/SQL access. Numerical answers must come from verified results; recommendations flag insufficient data.

The assistant uses model `nvidia/nemotron-3-super-120b-a12b` with base URL `https://integrate.api.nvidia.com/v1` and the `/chat/completions` API. See NVIDIA's [LLM API reference](https://docs.api.nvidia.com/nim/reference/llm-apis).

## Data expectations

Products need `sku` (and ideally `name`, `category`, `supplier`, `unit_cost`, `reorder_point`). Transaction files need `sku`, `quantity`, optionally `date`, `unit_price`, `customer`, `reference`. Import products before transactions.

## Security and scope

Do not commit `.env`, `.streamlit/secrets.toml`, or `stocksense.db`. `.streamlit/secrets.toml` is excluded by `.gitignore`. Dashboard/reorder calculations work without AI.

For Streamlit Community Cloud, open the app's **Settings → Secrets** and add:

```toml
NVIDIA_API_KEY = "your NVIDIA API key"
```

Keep the key out of source files, commits, logs, and screenshots. If a key has been exposed, revoke it and create a replacement before deploying.

## GitHub and Streamlit deployment

1. Push the application source to a GitHub repository, but do not add `.streamlit/secrets.toml`, `.env`, or database files.
2. In Streamlit Community Cloud, create an app from that repository and select `app.py` as the entry point.
3. Add `NVIDIA_API_KEY` in the deployed app's **Settings → Secrets** using the TOML snippet above, then deploy/reboot the app.

## Future device integration

A barcode scanner can submit its scanned SKU to `add_transaction`; an RFID gateway can do the same after translating tag events to a SKU and transaction type. Neither is required for the MVP.
65b252c (Initial commit: STOCK AI inventory management)
