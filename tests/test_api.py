from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_portfolio_has_materials_and_exposures():
    payload = client.get("/api/portfolio").json()
    assert len(payload["materials"]) >= 7
    assert len(payload["exposures"]) >= 7


def test_scenario_returns_financial_outputs():
    response = client.post("/api/scenario", json={"country": "China", "supply_loss_pct": 70, "delay_days": 60})
    assert response.status_code == 200
    payload = response.json()
    assert payload["revenue_at_risk_usd"] > 0
    assert payload["mitigation"]
