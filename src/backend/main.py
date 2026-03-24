import uvicorn
from fastapi import FastAPI

from api import router as api_router
from core.config import settings

app = FastAPI()

app.include_router(api_router)


@app.get("/api/hehehehe")
async def ping():
    return {"status": "pong"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.run.host,
        port=settings.run.port,
    )
