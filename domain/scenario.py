from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Exposure:
    material: str
    country: str
    share: float
    annual_spend_usd: float
    inventory_days: float
    substitutability: float
    revenue_dependency_usd: float


@dataclass(frozen=True)
class Scenario:
    country: str | None = None
    material: str | None = None
    supply_loss_pct: float = 50.0
    delay_days: float = 30.0
    fx_move_pct: float = 0.0
    inventory_override_days: float | None = None


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def score_exposure(exposure: Exposure) -> float:
    concentration = _clamp(exposure.share, 0.0, 1.0)
    inventory_pressure = 1.0 - _clamp(exposure.inventory_days / 90.0, 0.0, 1.0)
    substitution_pressure = 1.0 - _clamp(exposure.substitutability, 0.0, 1.0)
    spend_scale = min(1.0, exposure.annual_spend_usd / 100_000_000.0)
    return round(100.0 * (0.42 * concentration + 0.25 * inventory_pressure + 0.23 * substitution_pressure + 0.10 * spend_scale), 1)


def simulate(exposures: Iterable[Exposure], scenario: Scenario) -> dict:
    rows = []
    total_revenue_at_risk = 0.0
    total_incremental_cost = 0.0
    weighted_days_to_impact = 0.0
    weight = 0.0

    for exposure in exposures:
        if scenario.country and scenario.country != exposure.country:
            continue
        if scenario.material and scenario.material != exposure.material:
            continue

        inventory_days = scenario.inventory_override_days if scenario.inventory_override_days is not None else exposure.inventory_days
        affected_share = exposure.share * _clamp(scenario.supply_loss_pct / 100.0, 0.0, 1.0)
        uncovered_delay = max(0.0, scenario.delay_days - inventory_days)
        disruption_fraction = _clamp(uncovered_delay / max(scenario.delay_days, 1.0), 0.0, 1.0)
        substitution_relief = 0.55 * _clamp(exposure.substitutability, 0.0, 1.0)
        effective_fraction = affected_share * disruption_fraction * (1.0 - substitution_relief)

        revenue_at_risk = exposure.revenue_dependency_usd * effective_fraction
        replacement_premium = 0.20 + 0.45 * (1.0 - exposure.substitutability)
        fx_factor = 1.0 + max(-0.5, scenario.fx_move_pct / 100.0)
        incremental_cost = exposure.annual_spend_usd * affected_share * replacement_premium * fx_factor / 12.0

        total_revenue_at_risk += revenue_at_risk
        total_incremental_cost += incremental_cost
        weighted_days_to_impact += min(inventory_days, scenario.delay_days) * max(revenue_at_risk, 1.0)
        weight += max(revenue_at_risk, 1.0)

        rows.append({
            "material": exposure.material,
            "country": exposure.country,
            "affected_share_pct": round(affected_share * 100.0, 1),
            "days_to_impact": round(min(inventory_days, scenario.delay_days), 1),
            "revenue_at_risk_usd": round(revenue_at_risk, 2),
            "incremental_cost_usd": round(incremental_cost, 2),
            "risk_score": score_exposure(exposure),
        })

    rows.sort(key=lambda row: row["revenue_at_risk_usd"], reverse=True)
    return {
        "revenue_at_risk_usd": round(total_revenue_at_risk, 2),
        "incremental_cost_usd": round(total_incremental_cost, 2),
        "days_to_impact": round(weighted_days_to_impact / weight, 1) if weight else 0.0,
        "affected_exposures": len(rows),
        "details": rows,
    }
