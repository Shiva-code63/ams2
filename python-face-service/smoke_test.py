from app import app


def main() -> None:
    paths = {(getattr(r, "path", None), tuple(getattr(r, "methods", []) or [])) for r in app.router.routes}
    assert any(p == "/health" for (p, _) in paths), "Missing /health route"
    assert any(p == "/register-face" for (p, _) in paths), "Missing /register-face route"
    assert any(p == "/verify-face" for (p, _) in paths), "Missing /verify-face route"
    print("smoke ok (routes present)")


if __name__ == "__main__":
    main()
