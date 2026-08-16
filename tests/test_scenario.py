from domain.scenario import Exposure, Scenario, score_exposure, simulate


def exposure(**overrides):
    data = dict(material="Graphite", country="China", share=0.7, annual_spend_usd=50_000_000, inventory_days=20, substitutability=0.1, revenue_dependency_usd=500_000_000)
    data.update(overrides)
    return Exposure(**data)


def test_higher_concentration_has_higher_risk():
    low = score_exposure(exposure(share=0.2))
    high = score_exposure(exposure(share=0.8))
    assert high > low


def test_long_disruption_exposes_revenue_after_inventory_is_used():
    result = simulate([exposure()], Scenario(country="China", supply_loss_pct=60, delay_days=60))
    assert result["revenue_at_risk_usd"] > 0
    assert result["days_to_impact"] == 20


def test_inventory_can_cover_short_disruption():
    result = simulate([exposure(inventory_days=60)], Scenario(country="China", supply_loss_pct=100, delay_days=30))
    assert result["revenue_at_risk_usd"] == 0


def test_substitutability_reduces_revenue_exposure():
    hard = simulate([exposure(substitutability=0.05)], Scenario(supply_loss_pct=70, delay_days=60))
    easy = simulate([exposure(substitutability=0.9)], Scenario(supply_loss_pct=70, delay_days=60))
    assert hard["revenue_at_risk_usd"] > easy["revenue_at_risk_usd"]
