import asyncio
from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, Field, StrictInt

app = FastAPI()
app.state.active = 0

class ReadingIn(BaseModel):
    value: StrictInt = Field(ge=0)
    delay_ms: StrictInt = Field(default=0, ge=0, le=1000)

class ReadingOut(BaseModel):
    value: int
    source: str

async def process(data: ReadingIn) -> int:
    app.state.active += 1
    try:
        await asyncio.sleep(data.delay_ms / 1000)
        return data.value * 2
    finally:
        app.state.active -= 1

@app.post("/readings", response_model=ReadingOut)
async def read(data: ReadingIn):
    try:
        async with asyncio.timeout(0.02):
            value = await process(data)
        return {"value": value, "source": "local"}
    except TimeoutError:
        raise HTTPException(status_code=504, detail="DEADLINE_EXCEEDED")

async def verify():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://classroom") as client:
        ok = await client.post("/readings", json={"value": 8})
        assert ok.status_code == 200 and ok.json()["value"] == 16
        assert (await client.post("/readings", json={"value": "8"})).status_code == 422
        assert (await client.post("/readings", json={"value": -1})).status_code == 422
        timeout = await client.post("/readings", json={"value": 8, "delay_ms": 200})
        assert timeout.status_code == 504
        assert app.state.active == 0
    print("ASGI: valid=200; string=422; negative=422; deadline=504")
    print("active=0; no model calls; not a public deployment test")

if __name__ == "__main__":
    asyncio.run(verify())
