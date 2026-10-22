# Daylight — Smart Study News App

A mobile-friendly study companion built from the supplied Smart Study App project brief and lab test checklist. It lets a learner sign in to a demo account, choose subjects and topics, get short study facts, save feedback, review a streak and set an in-browser study reminder.

## What's included

- `index.html`, `assets/css/`, `assets/js/`: static website and browser-side features
- `server.mjs`: tiny local server so Selenium can visit `/login` and `/subjects`
- `worker/`: Cloudflare Worker that safely calls the Gemini API without exposing its key in the website
- `.github/workflows/pages.yml`: deploys the site to GitHub Pages when changes are pushed to `main`
- `login/index.html`, `subjects/index.html`: direct routes for GitHub Pages and Selenium

## Run locally

Install Node.js 18 or newer, then from this folder run:

```sh
node server.mjs
```

Open [http://localhost:3000/login](http://localhost:3000/login).

Demo login:

- Email: `sneha.minhas@mail.com`
- Password: `Study@123`

The invalid-password and empty-email flows are also handled. User preferences, selected topics, saved bites, feedback, and streak are stored in this browser's local storage. The demo login is for a class project and is not server-side authentication.

## Turn on Gemini

Gemini API usage is free within Google's current free-tier limits for supported models; limits and eligible models can change. This app uses `gemini-2.5-flash-lite` and does not enable Google Search grounding. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then deploy the Worker:

```sh
cd worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

When prompted, paste the API key. Do not put it in `config.js`, HTML, JavaScript, or a public GitHub secret that gets built into the frontend. For the Worker CORS allowlist, edit `worker/wrangler.toml` and replace `https://YOUR_GITHUB_USERNAME.github.io` with your actual GitHub Pages origin (for a project site, it is still the origin, e.g. `https://username.github.io`). Then deploy again. `GEMINI_API_KEY` is stored as a Cloudflare Worker secret.

After deployment, edit `assets/js/config.js` and set `apiBaseUrl` to the Worker URL from Wrangler, for example:

```js
window.APP_CONFIG = { apiBaseUrl: "https://daylight-study-api.your-account.workers.dev" };
```

Commit and push that change. The app uses curated sample facts if the Worker is not configured or Gemini is temporarily unavailable. This keeps the learning screens usable while offline. Google's free tier is subject to request limits and Google may use free-tier inputs and outputs to improve its products; check [Google's current Gemini API pricing and terms](https://ai.google.dev/gemini-api/docs/pricing) before use.

## Publish the website on GitHub Pages

1. Create a GitHub repository for the project.
2. Copy the contents of this folder to the repository root and push them to the `main` branch.
3. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
4. The workflow in `.github/workflows/pages.yml` publishes the site. Its URL appears in the workflow's deployment summary.
5. Configure and deploy the Worker as described above, then set `apiBaseUrl` and push once more.

GitHub Pages hosts the static website; Cloudflare Worker provides the server-side Gemini proxy. Both have free options with usage limits. No API key belongs in this public repository.

## Included Selenium checklist

The supplied script's login and subject-selection element IDs are present. To run the provided tests locally, use the included `test_smart_study_app.py` or update its `BASE_URL` to `http://localhost:3000`, start `node server.mjs`, install Selenium (`python -m pip install selenium`), then run `python test_smart_study_app.py` from the folder containing the test file. The provided script imports Selenium and will launch Chrome itself.

## Current scope

This is a runnable class-project web version. User data stays in the current browser. Reminders work while the app tab is open (and can use browser notifications if permission is granted). Actual push delivery while the site is closed, shared accounts, calendar sync, and a database require additional services and are not represented as active features.

