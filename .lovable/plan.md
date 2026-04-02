

## The Problem

Your site is a **single-page application (SPA)**. There's only one real file — `index.html` — and React Router handles all the pages client-side. When you visit `afrivogue.com/editorials` directly, Hostinger's server looks for a file or folder called `/editorials` on disk, finds nothing, and returns its own 404 page. Navigation works when clicking links because the browser never actually requests the server — React Router intercepts it.

## The Fix

You need to tell Hostinger to serve `index.html` for **every** URL path. This is done with an `.htaccess` file (Apache) placed in your site's root directory.

### Step 1 — Create `.htaccess` in your `public/` folder

I'll add a file `public/.htaccess` with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This tells Apache: "If the requested file doesn't physically exist, serve `index.html` instead." Vite copies everything in `public/` to the build output, so `.htaccess` will be included when you deploy.

### That's it — one file

After deploying the updated build to Hostinger, all routes (`/editorials`, `/media-kit`, `/shop`, etc.) will load correctly when accessed directly or refreshed.

