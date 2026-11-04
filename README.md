# Unfollowly

Compare two Instagram follower exports privately, in your browser, then let **Muse Spark** (Meta Model API) explain what changed.

- **Compare:** see who unfollowed, who's new and who stayed, with search and CSV export. Runs entirely in the browser.
- **AI insights (Muse Spark):** one click sends only the *changed* usernames to Muse Spark, which finds patterns in who left and who joined, flags likely spam or bot accounts, and suggests next steps. Your full follower list never leaves the browser.
- **Instagram account:** connect a Business or Creator account through Meta's Instagram API to see live follower, following and post counts.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Commands

- `npm run dev`: start the dev server (app and API) on port 3000
- `npm run build`: typecheck and build to `dist/`
- `npm start`: serve the built app in production mode
- `npm run typecheck`: typecheck only

## AI insights with Muse Spark

1. Create a key at https://dev.meta.ai → **API keys** (billing or hackathon credits required).
2. Copy `.env.example` to `.env` and set `MODEL_API_KEY`.
3. Restart the server, compare two snapshots (or click **Try live demo**), then click **Analyze with Muse Spark**.

The server calls the Meta Model API Responses endpoint (`https://api.meta.ai/v1/responses`) with model `muse-spark-1.3` (change with `META_MODEL`). The key stays on the server.

## Instagram login (optional)

The app works without this. To turn on "Connect with Instagram":

1. Create an app at https://developers.facebook.com/apps (type **Business**) and add the **Instagram** product.
2. Under **API setup with Instagram login**, copy the Instagram app ID and app secret.
3. In **Set up Instagram business login → Business login settings**, add your redirect URI: `<APP_URL>/auth/instagram/callback`.
4. Copy `.env.example` to `.env` and fill in `APP_URL`, `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`.
5. Restart the server.

Notes:

- Meta requires an **HTTPS** redirect URI. For local testing, run a tunnel (for example `ngrok http 3000`) and use its https URL as `APP_URL`.
- Until Meta approves your app, only accounts added as testers under **App roles** can log in.
- Only **Business** and **Creator** accounts can connect. Personal accounts are not supported by Meta's API.
- Meta's API gives follower **counts** only, not the list of followers. Seeing who unfollowed still requires comparing data exports.
- Access tokens are kept in server memory only and are cleared when the server restarts or the user disconnects.

## How it's built

React + Vite frontend, small Express server, plain CSS.

- `src/App.tsx`: the page and its state (uploads, demo, tabs, search)
- `src/lib/unfollowly/read-file.ts`: reads an uploaded file and picks the right parser
- `src/lib/unfollowly/parse-json.ts`, `parse-text.ts`: pull usernames out of Instagram JSON exports, CSV and TXT
- `src/lib/unfollowly/username.ts`: cleans usernames (strips `@`, profile URLs, casing) and drops invalid ones
- `src/lib/unfollowly/compare.ts`: compares two snapshots into unfollowed / new / still here
- `src/lib/unfollowly/export-csv.ts`: downloads the results as a CSV
- `src/components/unfollowly/`: the stat, upload and Instagram account cards
- `server/index.ts`: serves the app and handles the Instagram login flow
- `server/instagram.ts`: calls to Meta's Instagram API
- `server/insights.ts`: builds the prompt and calls Muse Spark through the Meta Model API
- `src/components/unfollowly/insights-card.tsx`: the "What changed, explained" AI card

## Limitations

- Meta's API only shares follower counts, not follower lists, so finding who unfollowed relies on data exports.
- An account missing from a newer export may have been renamed, deactivated or restricted rather than unfollowing.
- Instagram login tokens are kept in server memory, so users need to reconnect after a server restart.
- AI insights are based on usernames only, so they are educated guesses, and lists over 300 changes are truncated.

## Future improvements

- **Tests:** unit tests for `compare.ts`, the JSON/CSV/TXT parsers and username cleanup.
- **Snapshot history:** optionally save snapshots on the device (with clear consent) to track changes over time instead of two files at a time.
- **Follower count chart:** record the connected account's follower count each visit and show a trend line.
- **Rename detection:** use the export's timestamps and profile links to flag likely renamed accounts instead of counting them as unfollows.
- **Following vs. followers:** compare the "following" export too, to show who you follow that doesn't follow back.
- **Persistent sessions:** store tokens in an encrypted database so logins survive restarts, and refresh long-lived tokens before they expire.
- **Mobile layout and accessibility:** further testing on small screens and with screen readers.
- **Deployment:** a one-click deploy guide (for example Render or Fly.io) with HTTPS for the Instagram login.
