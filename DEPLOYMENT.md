# Deployment guide

## 1. Push to GitHub
```bash
cd tdc-matchmaker
git remote add origin https://github.com/<your-username>/tdc-matchmaker.git
git push -u origin main
```
Create the empty repo on GitHub first (no README/.gitignore/licence). Never commit `.env.local`; it is already git-ignored.

## 2. Deploy on Vercel (recommended, about 5 minutes)
1. Go to vercel.com, sign in with GitHub, click **Add New → Project**, and import the repo.
2. Framework preset is detected as **Next.js**. Leave build settings as they are.
3. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | output of `openssl rand -base64 48` (required) |
   | `SHOW_DEMO_CREDENTIALS` | `true` (so reviewers see the sample logins) |
   | `OPENAI_API_KEY` | your key (optional, enables AI drafts) |
   | `OPENAI_MODEL` | `gpt-4o-mini` (optional) |
4. Click **Deploy**. The live URL looks like `https://tdc-matchmaker.vercel.app`.
5. If you add or change variables later, redeploy for them to apply.

## 3. Verify the live site
- Open the URL: you should land on the sign-in page.
- Sign in as `priya` / `Welcome@TDC26`, open a client, go to **Matches**, expand **Why this match**, click **Send match**.
- With `OPENAI_API_KEY` set, the draft badge reads "Drafted with AI". Without it, "Template draft".
- Visit `/customers/c_008` while signed in as priya: it should show "couldn't find that page".

## 4. Alternatives
- **Render:** New Web Service, build `npm install && npm run build`, start `npm start`, add the same env vars.
- **Netlify:** supports Next.js through its runtime; same env vars.

## 5. Troubleshooting
| Symptom | Fix |
|---|---|
| Sign-in fails with a server error | `AUTH_SECRET` missing or under 32 characters. Set it and redeploy. |
| Sign-in page shows no sample logins | Set `SHOW_DEMO_CREDENTIALS=true` and redeploy. |
| Drafts say "Template draft" | `OPENAI_API_KEY` missing or invalid. Check the Vercel function logs. |
| Notes or statuses reset on another device | Expected: they are stored in the browser for the demo. |
