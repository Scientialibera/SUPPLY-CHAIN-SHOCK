# Supply Chain Shock

Supply Chain Shock is an executive supply-chain exposure and scenario-analysis POC focused on critical minerals and primary materials.

The application combines a global supplier-risk command center, material dependency analysis and a financial shock simulator. It is designed to demonstrate how enterprise procurement, trade, inventory and supplier data can be integrated into a single decision-support layer.

## Product surfaces

### Command Center

- Global supplier and trade-corridor map
- Country concentration hotspots
- Material-level exposure scoring
- Executive portfolio risk indicators
- Ranked vulnerabilities

### Critical Materials

The sample portfolio includes copper, lithium, nickel, aluminum, steel, graphite and rare earths. Each material shows annual spend, largest source-country share, inventory buffer and substitution pressure.

### Scenario Lab

Users can apply a supply shock by country or material and change:

- supply-loss percentage
- disruption duration
- FX movement
- material/country scope

The scenario engine estimates revenue at risk, incremental replacement cost, days to operational impact and recommended mitigation actions.

## Model boundary

The bundled portfolio is synthetic and exists to demonstrate product behavior. Scenario outputs are deterministic decision-support estimates, not market forecasts or statements about a real company.

The architecture is intended to be replaced with enterprise ERP/procurement data or public trade statistics in a production implementation.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000`.

## Tests

```bash
pytest -q
python scripts/check_no_emoji.py
```

## Repository policy

There is no CI/CD configuration in this repository. Tests and policy checks run only when invoked locally.
