Deployment & Security checklist

1) Local development (never commit .env)

- Copy `.env.example` to `.env` and fill values:

  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your_anon_key_here

- Do NOT commit `.env`. It's in `.gitignore`.
- Generate `env.js` before testing locally:
  - On Windows (PowerShell):
    ```powershell
    $env:SUPABASE_URL='https://your-project.supabase.co'
    $env:SUPABASE_ANON_KEY='your_anon_key_here'
    ./build.ps1
    ```
  - On macOS/Linux (bash):
    ```bash
    export SUPABASE_URL='https://your-project.supabase.co'
    export SUPABASE_ANON_KEY='your_anon_key_here'
    ./build.sh
    ```

2) CI / Netlify / Vercel

- Add environment variables in your hosting settings (Site settings → Build & deploy → Environment variables):
  - SUPABASE_URL
  - SUPABASE_ANON_KEY

- Configure your build command to run the build script (if needed). The repository already contains `build.sh` and `build.ps1`.

3) If a secret was committed accidentally

- Immediately rotate the key in the Supabase dashboard (Settings → API → Keys).
- Remove the file from the index and push the removal (see `remove-secrets.ps1`):
  - `./remove-secrets.ps1`

- If the key was pushed to GitHub, the only safe option is to purge it from history and rotate the key:
  - Use `purge-history.ps1` (PowerShell) or `purge-history.sh` (Git Bash) to remove `.env` and `env.js` from all commits.
  - After purging, force-push the cleaned history and ask collaborators to re-clone.

4) Security best practices

- Never include service_role or other admin keys in client-side code.
- Use server-side functions (serverless) for privileged actions.
- Consider adding a pre-commit hook (husky / pre-commit) to prevent committing secrets.
- Optionally enable GitHub secret scanning on the repository.

5) Verification

- After cleaning and pushing, run a search for keys in the working tree:
  - `git grep -n "SUPABASE_ANON_KEY\|SUPABASE_URL\|eyJ"`
- Use a secret scanner (gitleaks) to be sure:
  - `gitleaks detect --source . --report-path gitleaks-report.json`

If you want, I can also add a `pre-commit` hook template to help block future accidental commits of secrets.
