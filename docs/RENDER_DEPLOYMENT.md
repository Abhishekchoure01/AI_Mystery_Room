# Deploy AI Mystery Room on Render

This project is configured as one Render Node web service. Express serves both the API and the built React client on the same origin. MongoDB Atlas and Gemini remain external services.

## Before deploying

- Push the project to a Git provider connected to Render. This workspace has a local Git repository, but no Git remote is configured yet.
- Keep `.env` out of Git. The repository `.gitignore` already excludes it.
- Keep the Atlas IP access list restricted. After creating the Render service, open its **Connect → Outbound** details and add the listed Render outbound ranges to Atlas **Security → Network Access**. Avoid leaving `0.0.0.0/0` enabled.
- Have the Atlas connection URI and Gemini API key ready. Enter them as Render secrets when prompted; do not put their values in `render.yaml`.

## Create the Render service

1. In Render, choose **New → Blueprint** and connect the Git repository containing this project.
2. Select the branch to deploy. Render reads `render.yaml` at the repository root.
3. When prompted, provide `MONGODB_URI` and `GEMINI_API_KEY`. Use the Atlas URI for this deployment and the Gemini key used by the local app.
4. Create the Blueprint and wait for the build and deploy to finish.

The Blueprint uses `npm ci && npm run build`, then `npm start`. Its health check is `/api/v1/health`; a healthy response is `{ "status": "ok", "database": "connected" }`.

## After deployment

- Open the service's `onrender.com` URL and confirm the landing page loads.
- Check `<service-url>/api/v1/health` for database readiness.
- Try the demo case, then generate a case to verify Gemini credentials and quotas.

The Blueprint uses Render's free web-service plan. Free web services can spin down after 15 minutes of inactivity, so the first request after idle can take longer to start. Render's web-service request timeout supports the app's five-minute Gemini limit.
