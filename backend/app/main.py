
from fastapi import FastAPI
from app.core.config import APP_NAME, APP_VERSION
from fastapi.middleware.cors import CORSMiddleware
from app.models.sale import Sale
from app.routes.inventory import router as inventory_router
from app.core.database import Base, engine
from app.models.product import Product
from app.routes.dashboard import router as dashboard_router
from app.routes.sales import router as sales_router
from app.routes.ai import router as ai_router
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.routes.purchase_orders import router as purchase_orders_router
from app.models.supplier import Supplier
from app.routes.suppliers import router as suppliers_router
app = FastAPI(
    title=APP_NAME,
    description="Backend API for STOCK AI",
    version=APP_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register Inventory API
# Register API routes
app.include_router(inventory_router)
app.include_router(dashboard_router)
app.include_router(inventory_router)
app.include_router(sales_router)
app.include_router(ai_router)
app.include_router(purchase_orders_router)
app.include_router(suppliers_router)

@app.get("/")
def home():
    return {
        "message": "STOCK AI Backend is running!",
        "version": APP_VERSION
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
