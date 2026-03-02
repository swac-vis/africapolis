# Deploy to GitHub

From the project root, run these commands in order:

```bash
# From project root
# 1. Initialize repo (skip if already done)
git init

# 2. Stage files (.gitignore excludes node_modules, .env, dist, etc.)
git add .
git status   # Confirm .env and node_modules are not listed

# 3. First commit
git commit -m "Initial commit: Africapolis site + GitHub Pages deploy"

# 4. Add remote
git remote add origin https://github.com/swac-vis/africapolis.git

# 5. Push to main
git branch -M main
git push -u origin main
```

If prompted to sign in, complete the GitHub authentication in your browser.

After a successful push:

- Open https://github.com/swac-vis/africapolis to see the code.
- Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
- Wait for the “Deploy to GitHub Pages” workflow to finish in **Actions**. The site will be at: https://swac-vis.github.io/africapolis/
