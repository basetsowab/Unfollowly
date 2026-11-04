# Unfollowly

Compare two Instagram follower exports privately, in your browser. Follower lists are never uploaded to a server.

You can also connect an Instagram Business or Creator account through Meta's official API to see live follower, following and post counts.

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
