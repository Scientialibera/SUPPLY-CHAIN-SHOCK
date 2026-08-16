# Architecture

```text
Enterprise procurement / ERP / trade datasets
                    |
                    v
          Normalized exposure model
                    |
        +-----------+-----------+
        |                       |
        v                       v
Exposure scoring         Shock simulation
        |                       |
        +-----------+-----------+
                    |
                    v
             FastAPI service
                    |
                    v
        Executive web console
```

The first release ships with a synthetic portfolio so the application can run without credentials or private enterprise data. The domain model is separated from the frontend so public trade data or ERP connectors can replace the sample source without rewriting the UI.
