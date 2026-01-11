# Fix npm Permission Error

## Quick Fix

Run this command in your terminal to fix the npm cache permission issue:

```bash
sudo chown -R $(whoami) ~/.npm
```

Or if that doesn't work, use the specific command from the error:

```bash
sudo chown -R 502:20 "/Users/ent-00210/.npm"
```

## Alternative: Use npm cache clean

If you prefer not to use sudo, you can try:

```bash
npm cache clean --force
```

Then try `npm install` again.

## After Fixing Permissions

Once permissions are fixed, run:

```bash
npm install
```

This will install all Angular 20 dependencies compatible with:
- Angular CLI: 20.0.6
- Node.js: 22.21.1
- npm: 10.9.4

## Verify Installation

After installation, verify everything works:

```bash
ng version
```

You should see:
- Angular CLI: 20.0.6
- Node: 22.21.1
- Package Manager: npm 10.9.4

Then start the dev server:

```bash
ng serve
```

