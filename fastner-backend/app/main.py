from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import admin_router as users_admin_router
from app.auth.router import router as auth_router
from app.cart.router import router as cart_router
from app.catalog.router import admin_router as catalog_admin_router
from app.catalog.router import public_router as catalog_public_router
from app.industries.router import admin_router as industries_admin_router
from app.industries.router import public_router as industries_public_router

app = FastAPI(title="Fastner API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_admin_router)
app.include_router(cart_router)
app.include_router(catalog_admin_router)
app.include_router(catalog_public_router)
app.include_router(industries_admin_router)
app.include_router(industries_public_router)


@app.get("/")
def root():
    return {"message": "Fastner API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
