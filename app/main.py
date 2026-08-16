from __future__ import annotations

from pathlib import Path
import json

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from domain.scenario import Exposure, Scenario, score_exposure, simulate

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "sample" / "portfolio.json").read_text(encoding="utf-8"))

app = FastAPI(title="Supply Chain Shock", version="0.1.0")


def exposures() -> list[Exposure]:
    return [Exposure(**row) for row in DATA["exposures"]]


class ScenarioRequest(BaseModel):
    country: str | None = None
    material: str | None = None
    supply_loss_pct: float = Field(50.0, ge=0, le=100)
    delay_days: float = Field(30.0, ge=0, le=365)
    fx_move_pct: float = Field(0.0, ge=-50, le=100)
    inventory_override_days: float | None = Field(None, ge=0, le=365)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/portfolio")
def portfolio() -> dict:
    scored = []
    for row in DATA["exposures"]:
        exposure = Exposure(**row)
        scored.append({**row, "risk_score": score_exposure(exposure)})
    return {**DATA, "exposures": scored}


@app.post("/api/scenario")
def run_scenario(request: ScenarioRequest) -> dict:
    scenario = Scenario(**request.model_dump())
    result = simulate(exposures(), scenario)
    mitigation_value = result["revenue_at_risk_usd"] * 0.44 + result["incremental_cost_usd"] * 0.32
    result["mitigation"] = [
        {"action": "Qualify alternate suppliers", "estimated_value_usd": round(mitigation_value * 0.42, 2)},
        {"action": "Buy ahead strategic inventory", "estimated_value_usd": round(mitigation_value * 0.31, 2)},
        {"action": "Rebalance production mix", "estimated_value_usd": round(mitigation_value * 0.17, 2)},
        {"action": "Reroute freight corridors", "estimated_value_usd": round(mitigation_value * 0.10, 2)}
    ]
    return result


app.mount("/", StaticFiles(directory=ROOT / "frontend", html=True), name="frontend")
