# Quick Setup Guide

## Prerequisites
- Node.js v16+ and npm installed
- Java backend running on port 8080

## Installation Steps

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   ng serve
   ```
   Or with npm:
   ```bash
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:4200`

## Backend Configuration

Make sure your Java Spring Boot backend:
- Is running on `http://localhost:8080`
- Has CORS enabled for `http://localhost:4200`
- Has the following endpoints:
  - `GET /api/posts/all` - Get all posts
  - `POST /api/posts/create` - Create a new post
  - `GET /api/users/current` - Get current user
  - `PUT /api/users/{id}` - Update user

## Troubleshooting

### CORS Issues
If you encounter CORS errors, add this to your Java backend `@CrossOrigin` annotation:
```java
@CrossOrigin(origins = "http://localhost:4200")
```

### Port Already in Use
If port 4200 is already in use, you can specify a different port:
```bash
ng serve --port 4201
```

### Module Not Found Errors
If you see module not found errors, make sure you've run:
```bash
npm install
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/        # Page components
│   │   ├── shared/            # Shared components (header)
│   │   ├── services/          # API services
│   │   └── app.module.ts      # Main module
│   └── styles.css             # Global styles
├── angular.json               # Angular configuration
├── package.json               # Dependencies
└── proxy.conf.json            # API proxy config
```

## Next Steps

1. Install dependencies: `npm install`
2. Start backend: Run your Java Spring Boot application
3. Start frontend: `ng serve`
4. Open browser: `http://localhost:4200`

