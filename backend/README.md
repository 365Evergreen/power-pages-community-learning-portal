# Backend scaffold for Dataverse integration

This folder contains a minimal Node/Express backend scaffold that demonstrates how to call the Dataverse Web API using client credentials (MSAL).

Quick start

1. Copy `.env.example` to `.env` and fill in Azure + Dataverse values.
2. From this folder run:

```powershell
cd backend
npm install
npm start
```

Routes

- `GET /api/workshops` — sample endpoint that queries the `ppdev_communityworkshop` table.
