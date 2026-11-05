import asyncio

from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, Field, StrictInt

app = FastAPI()
app.state.active = 0


# 输入模型会在路由执行前验证 JSON。StrictInt 不把字符串 "8" 转成整数。
class ReadingIn(BaseModel):
    value: StrictInt = Field(ge=0)
    delay_ms: StrictInt = Field(default=0, ge=0, le=1000)


class ReadingOut(BaseModel):
    value: int
    source: str


async def process_reading(data: ReadingIn) -> int:
    app.state.active += 1

    try:
        # await 让当前协程等待，事件循环可以处理其他工作。
        await asyncio.sleep(data.delay_ms / 1000)
        return data.value * 2
    finally:
        # 无论正常返回、异常还是取消，都释放本任务的活动计数。
        app.state.active -= 1


@app.post("/readings", response_model=ReadingOut)
async def read_reading(data: ReadingIn):
    try:
        async with asyncio.timeout(0.02):
            doubled_value = await process_reading(data)

        return {"value": doubled_value, "source": "local"}
    except TimeoutError:
        raise HTTPException(status_code=504, detail="DEADLINE_EXCEEDED")


async def verify_routes():
    # ASGITransport 在进程内调用 app，不会启动 TCP 监听端口。
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://classroom") as client:
        valid_response = await client.post("/readings", json={"value": 8})
        assert valid_response.status_code == 200
        assert valid_response.json()["value"] == 16

        string_response = await client.post("/readings", json={"value": "8"})
        assert string_response.status_code == 422

        negative_response = await client.post("/readings", json={"value": -1})
        assert negative_response.status_code == 422

        slow_response = await client.post(
            "/readings",
            json={"value": 8, "delay_ms": 200},
        )
        assert slow_response.status_code == 504
        assert app.state.active == 0

    print("ASGI: valid=200; string=422; negative=422; deadline=504")
    print("active=0; no model calls; not a public deployment test")


# 被 ASGI 服务器导入时只创建 app；直接运行文件时才执行课堂验证。
if __name__ == "__main__":
    asyncio.run(verify_routes())
