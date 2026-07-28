# AWS Deployment Guide (Amplify + Lambda)

This project was migrated off Vercel. The new setup:

| Component | Where it runs | How it deploys |
|-----------|---------------|----------------|
| Frontend (React/Vite) | **AWS Amplify Hosting** | Auto-deploys on every push to `main` (once GitHub is connected) |
| Backend (Express) | **A single AWS Lambda** behind an HTTP API Gateway | `sam deploy` (all endpoints go through one function) |
| Database | Aiven MySQL (unchanged) | — |

The Express app is unchanged — `backend/lambda.js` wraps it with `serverless-http`,
and API Gateway forwards **every** path/method to that one Lambda (`/{proxy+}`),
exactly like Vercel's catch-all rewrite did.

---

## 1. Backend → Lambda (single function)

### Prerequisites (one-time)
```bash
brew install aws-sam-cli        # SAM CLI is not yet installed
sam --version                   # confirm it works
```
AWS CLI is already installed and authenticated with an IAM user that has Lambda deploy permissions.

### Deploy
From the `backend/` folder:
```bash
cd backend
npm install                     # pulls in serverless-http + regenerates Prisma engines
sam build                       # bundles the app + node_modules (incl. Prisma engine)
sam deploy --guided             # first time only; saves answers to samconfig.toml
```

During `sam deploy --guided` you'll be asked for the **parameters** (secrets). Provide
the same values that are in `backend/.env` today:

- `DatabaseUrl` – your Aiven MySQL connection string
- `JwtSecret`, `CsrfSecret`
- `RedisUrl` (leave blank if you're not using Redis on AWS yet)
- `CloudinaryCloudName`, `CloudinaryApiKey`, `CloudinaryApiSecret`
- `GeminiApiKey`, `GmailUser`, `GmailAppPassword`, `SentryDsn`
- `JaasAppId`, `JaasApiKeyId`, `JaasPrivateKey`
- `AllowedOrigins` – **set this after step 2** to your Amplify URL

> Answer **"ApiFunction may not have authorization defined, Is this okay?"** with **`y`**
> — auth is handled inside Express (JWT), not at the gateway.

After deploy, SAM prints an **`ApiUrl`** output, e.g.
`https://abc123.execute-api.us-east-1.amazonaws.com`
Your API base URL is that **+ `/api`**.

### Redeploying later
```bash
cd backend && sam build && sam deploy     # uses saved samconfig.toml
```

> **Note:** the backend does *not* auto-deploy from GitHub — Lambda is deployed with
> `sam deploy`. Only the frontend (Amplify) auto-deploys on push. If you want the
> backend to auto-deploy too, add a GitHub Actions workflow that runs `sam deploy`
> (can be added later).

---

## 2. Frontend → Amplify (auto-deploy on push)

`amplify.yml` (repo root) and `frontend/customHttp.yml` are already committed, so
Amplify will detect the build settings automatically. You just need to connect the repo.

### Connect GitHub (one-time, in the console)
1. Open **AWS Console → AWS Amplify → Create new app → Host web app**.
2. Choose **GitHub**, authorize (one-time OAuth), pick repo **`omkar-hadole/ZenovaX`**, branch **`main`**.
3. Amplify auto-detects the monorepo (`appRoot: frontend`) from `amplify.yml`.
4. Under **Environment variables**, add:
   - `VITE_API_URL` = the API Gateway URL from step 1, **with `/api`** appended
     (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com/api`)
5. **Save and deploy.**

From then on, **every `git push` to `main` triggers an Amplify build + deploy.**

### SPA routing (important)
React Router needs deep links (e.g. `/dashboard`) to serve `index.html`. Add this
rewrite in **Amplify → App settings → Rewrites and redirects**:

| Source address | Target address | Type |
|----------------|----------------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | `200 (Rewrite)` |

(Paste the source string exactly — it's the standard Amplify SPA rule.)

---

## 3. Wire the two together (CORS)

Once you know the Amplify URL (e.g. `https://main.d1234abcd.amplifyapp.com`):

1. Redeploy the backend with that URL in `AllowedOrigins`:
   ```bash
   cd backend && sam deploy --parameter-overrides AllowedOrigins=https://main.d1234abcd.amplifyapp.com
   ```
   (or edit the value in `samconfig.toml` and run `sam deploy`).

Cookies already use `SameSite=None; Secure` in production, so cross-domain auth
between the Amplify frontend and the API Gateway backend works over HTTPS.

---

## Known limitation — background job worker

The BullMQ queue **worker** (`startQueueWorker`) only runs as a long-lived process
and does **not** run inside Lambda (same as on Vercel). Options:
- If `REDIS_URL` is left **blank**, the app falls back to running jobs inline (fine for low volume).
- If you need real background processing, run the worker separately (e.g. a small
  ECS/Fargate task or EC2 instance) pointed at the same Redis.

---

## What changed in the code

- `backend/lambda.js` – **new** Lambda handler (wraps Express via `serverless-http`).
- `backend/template.yaml` – **new** AWS SAM template (single Lambda + HTTP API).
- `backend/package.json` – added `serverless-http`.
- `backend/prisma/schema.prisma` – added Lambda Prisma engine binary targets.
- `backend/server.js` – CORS origins now also read from `ALLOWED_ORIGINS` env var.
- `amplify.yml` – **new** Amplify monorepo build spec (frontend).
- `frontend/customHttp.yml` – **new** cache headers for static assets.

The old `vercel.json` files are left in place as a fallback and can be deleted later.
