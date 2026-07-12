import uuid
from http import HTTPStatus

from fastapi import FastAPI
from starlette.requests import Request
from starlette.testclient import TestClient

from middlewares.request_id import RequestIDMiddleware


class TestRequestIDMiddleware:
    def test_adds_x_request_id_header(self) -> None:
        app = FastAPI()

        @app.get("/test")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/test")
        assert "X-Request-ID" in response.headers
        header_val = response.headers["X-Request-ID"]
        assert len(header_val) == 36

    def test_request_id_is_valid_uuid(self) -> None:
        app = FastAPI()

        @app.get("/uuid-test")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/uuid-test")
        request_id = response.headers.get("X-Request-ID", "")
        parsed = uuid.UUID(request_id)
        assert str(parsed) == request_id

    def test_each_request_gets_unique_id(self) -> None:
        app = FastAPI()

        @app.get("/unique")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        r1 = client.get("/unique")
        r2 = client.get("/unique")
        assert r1.headers["X-Request-ID"] != r2.headers["X-Request-ID"]

    def test_sets_request_state_request_id(self) -> None:
        captured: dict[str, str] = {}

        app = FastAPI()

        @app.get("/state-test")
        async def test_route(request: Request) -> dict[str, bool]:
            captured["id"] = request.state.request_id
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/state-test")
        assert captured.get("id") is not None
        assert captured["id"] == response.headers["X-Request-ID"]

    def test_honours_valid_incoming_request_id(self) -> None:
        app = FastAPI()

        @app.get("/incoming")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/incoming", headers={"X-Request-ID": "trace-abc.123_XYZ"})
        assert response.headers["X-Request-ID"] == "trace-abc.123_XYZ"

    def test_rejects_invalid_incoming_request_id(self) -> None:
        app = FastAPI()

        @app.get("/bad-incoming")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/bad-incoming", headers={"X-Request-ID": "bad id with spaces"})
        generated = response.headers["X-Request-ID"]
        assert generated != "bad id with spaces"
        assert str(uuid.UUID(generated)) == generated


class TestRequestIDMiddlewareDispatchError:
    def test_logs_and_reraises_exception(self) -> None:
        app = FastAPI()

        @app.get("/error")
        async def boom() -> dict[str, bool]:
            raise ValueError("test error")

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/error")
        assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
