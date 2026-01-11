# Fix node_modules Permission Issue

## Problem
The `node_modules` directory is owned by `root` instead of your user, causing permission errors during npm install.

## Solution

Run these commands in your terminal:

```bash
cd "/Users/ent-00210/Desktop/personal pro/Blog-Management-System-java-project/frontend"

# Remove the existing node_modules and lock file
sudo rm -rf node_modules package-lock.json

# Fix ownership of the entire frontend directory
sudo chown -R $(whoami) .

# Now install dependencies (without sudo!)
npm install
```

## Important Notes

1. **Never use `sudo npm install`** - This causes permission issues by creating files owned by root
2. Always run `npm install` as your regular user
3. If you see permission errors, fix ownership first, then install

## After Fixing

Once permissions are fixed, you should be able to run:

```bash
npm install
ng serve
```

The installation should complete without permission errors.

