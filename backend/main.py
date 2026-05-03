from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, client_orders, invoice, livreur_orders, manager_orders, notifications
from app.core.database import Base, SessionLocal, engine
from app.utils.seed import seed_admin

# Import all models so Base.metadata.create_all creates every table
from app.models.user import User
from app.models.order import Order
from app.models.notification import Notification


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Livr'O API",
    version="1.0.1",
    description="Système de gestion des livraisons — FastAPI + PostgreSQL",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router,           prefix=PREFIX)
app.include_router(client_orders.router,  prefix=PREFIX)
app.include_router(manager_orders.router, prefix=PREFIX)
app.include_router(livreur_orders.router, prefix=PREFIX)
app.include_router(invoice.router,        prefix=PREFIX)
app.include_router(notifications.router,  prefix=PREFIX)


@app.get("/")
def root():
    return {"status": "ok", "app": "Livr'O API v1.0.1"}
