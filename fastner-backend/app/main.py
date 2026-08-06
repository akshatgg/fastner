from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.address.router import router as address_router
from app.core.config import settings
from app.auth.router import admin_router as users_admin_router
from app.payments.router import router as payments_router
from app.auth.router import router as auth_router
from app.cart.router import router as cart_router
from app.catalog.router import admin_router as catalog_admin_router
from app.coupons.router import admin_router as coupons_admin_router
from app.coupons.router import router as coupons_router
from app.catalog.router import public_router as catalog_public_router
from app.core.config import settings
from app.core.logging_config import configure_logging, get_logger
from app.middleware import RequestIDMiddleware
from app.industries.router import admin_router as industries_admin_router
from app.industries.router import public_router as industries_public_router
from app.orders.router import admin_router as orders_admin_router
from app.orders.router import router as orders_router
from app.reviews.router import router as reviews_router
from app.settings.router import admin_router as settings_admin_router
from app.settings.router import public_router as settings_public_router
from app.support.router import admin_router as support_admin_router
from app.support.router import router as support_router

# Configure logging up front so app + uvicorn records share one format: a
# colored human formatter on a local TTY, JSON everywhere else (see
# app/core/logging_config.py).
configure_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle logs, with a one-line summary of which
    config-gated integrations are switched on."""
    logger.info("Starting IBC Fasteners API (env=%s)...", settings.ENVIRONMENT)
    logger.info(
        "Email verification: %s",
        "auto (no emails sent)" if settings.AUTO_VERIFY_EMAIL else "required (SMTP)",
    )
    if not settings.GOOGLE_CLIENT_ID:
        logger.warning("GOOGLE_CLIENT_ID not set — Google sign-in is disabled.")
    if not (settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        logger.warning("Cloudinary server creds not set — signed image ops disabled.")
    logger.info("Application startup complete.")
    yield
    logger.info("Shutting down IBC Fasteners API...")


app = FastAPI(title="Fastner API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Added last → outermost, so every request gets a request_id bound to the
# logging context before any other layer runs.
app.add_middleware(RequestIDMiddleware)

app.include_router(auth_router)
app.include_router(users_admin_router)
app.include_router(cart_router)
app.include_router(address_router)
app.include_router(coupons_router)
app.include_router(coupons_admin_router)
app.include_router(payments_router)
app.include_router(catalog_admin_router)
app.include_router(catalog_public_router)
app.include_router(industries_admin_router)
app.include_router(industries_public_router)
app.include_router(orders_router)
app.include_router(orders_admin_router)
app.include_router(reviews_router)
app.include_router(settings_admin_router)
app.include_router(settings_public_router)
app.include_router(support_router)
app.include_router(support_admin_router)


@app.get("/")
def root():
    return {"message": "Fastner API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
