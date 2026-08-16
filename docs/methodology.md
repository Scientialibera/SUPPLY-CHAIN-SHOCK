# Methodology

## Exposure score

The screening score combines source-country concentration, inventory pressure, substitution difficulty and material spend scale. It is intentionally interpretable and does not claim to predict a real disruption.

## Scenario engine

For affected country/material records, the model calculates the share of supply lost, compares disruption duration against inventory days, applies substitution relief and estimates the dependent revenue exposed after inventory is exhausted. Replacement-cost pressure includes a substitutability premium and a configurable FX factor.

## Mitigation

Mitigation actions are prioritized heuristically to demonstrate the decision workflow. A production implementation should estimate alternative supplier capacity, qualification lead time, logistics constraints, contract terms and cost-to-switch using enterprise data.
