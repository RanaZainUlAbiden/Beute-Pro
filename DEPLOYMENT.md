# Railway deployment

Project: **Beute-Pro**. Both application services follow the GitHub repository's
`main` branch and deploy automatically after pushes.

| Service | Source / root | Start | Health check |
| --- | --- | --- | --- |
| frontend | GitHub, `/Website-Angular` | Dockerfile: `node serve.mjs` | `/healthz` |
| backend | GitHub, `/beute-pro-backend` | Dockerfile: `npm start` | `/api/health` |
| Postgres | Railway PostgreSQL template with persistent volume | template default | database connection |

The frontend serves Angular's prerendered storefront and client-rendered admin
routes. Its `/api` proxy connects to the backend over Railway private networking.
Only the frontend needs a public HTTP domain.

## Custom domains

- Storefront: `https://www.beutepro.com`
- API: `https://api.beutepro.com` (health: `/api/health`)
- `https://beutepro.com` redirects permanently to the matching path at `www`.

DNS is managed in cPanel using `ns1` through `ns4.private-nameserver.net`.
The frontend `www` CNAME targets `4lt1ne50.up.railway.app`; the `api` CNAME
targets `36tkgwyb.up.railway.app`. Both have the ownership TXT record provided
by Railway at `_railway-verify.<subdomain>`.

This DNS provider does not offer apex ALIAS/CNAME flattening. The apex A record
therefore points to the existing cPanel host (`193.108.130.14`), which performs
a path-preserving 301 redirect to `https://www.beutepro.com/`. Keep that hosting
and its root-domain TLS certificate active, or migrate the DNS to a provider
supporting apex aliases before retiring the hosting. Do not pin a Railway IP in
an apex A record. Email MX and other service records remain with their provider.

Browser API traffic still uses the frontend's `/api` private-network proxy.

## Environment variables

Frontend:

```text
NODE_ENV=production
PORT=4000
BACKEND_INTERNAL_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:5000
```

Backend:

```text
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://www.beutepro.com
BACKEND_URL=https://api.beutepro.com
JWT_SECRET=<random secret stored only in Railway>
SESSION_SECRET=<different random secret stored only in Railway>
JWT_EXPIRES_IN=7d
```

Set the backend's **Pre-deploy command** to `npm run deploy:prepare`. It applies
only unapplied `*.up.sql` migrations under a database advisory lock and seeds the
catalog only when the products table is empty. Existing product edits and stock
are preserved across redeployments.

Optional integrations:

- Google sign-in requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, plus
  `https://api.beutepro.com/api/auth/google/callback` in that Google OAuth
  client's authorized redirect URIs.
- Email requires `EMAIL_ENABLED=true` and SMTP settings from `.env.example` / the
  email service. Without them, order storage still works but email is disabled.

Docker contexts exclude local environment files and dependencies. Do not commit
secrets. Production API URLs are relative, so changing the frontend domain does
not require rebuilding its JavaScript; update the backend URL variables and the
Google callback registration when changing domains.
