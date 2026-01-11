# Blog Management System - Angular Frontend

This is the Angular frontend application for the Blog Management System. The backend is built with Java Spring Boot and is located in the `../java` directory.

## Features

- **Home Page**: Display blog posts in a grid layout with pagination, sidebar with popular posts, recent comments, and tags
- **Create Post**: Rich text editor with image upload, tags, and categories
- **Profile Page**: User profile with stats and recent activity timeline
- **Profile Edit**: Edit user profile information and account settings

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Angular CLI (v16 or higher)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Install Angular CLI globally (if not already installed):
```bash
npm install -g @angular/cli@16
```

## Development

1. Start the development server:
```bash
ng serve
```

2. The application will be available at `http://localhost:4200`

3. Make sure your Java backend is running on `http://localhost:8080`

## Build

To build the application for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/              # Home page component
│   │   │   ├── create-post/        # Create post component
│   │   │   ├── profile/            # Profile view component
│   │   │   └── profile-edit/       # Profile edit component
│   │   ├── shared/
│   │   │   └── header/             # Header navigation component
│   │   ├── services/
│   │   │   ├── post.service.ts     # Post API service
│   │   │   └── user.service.ts     # User API service
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── styles.css                  # Global styles
│   └── index.html
├── angular.json
├── package.json
└── tsconfig.json
```

## API Configuration

The frontend is configured to communicate with the Java backend at `http://localhost:8080`. 

API endpoints:
- Posts: `/api/posts`
- Users: `/api/users`

You can modify the API URL in the service files if your backend runs on a different port or host.

## Components

### Home Component
- Displays blog posts in a responsive grid
- Sidebar with popular posts, recent comments, and tags
- Pagination controls

### Create Post Component
- Image upload with drag-and-drop support
- Rich text editor toolbar
- Tags and category selection
- Publish and save draft functionality

### Profile Component
- User profile information
- Statistics (posts, comments, followers)
- Recent activity timeline

### Profile Edit Component
- Edit profile information
- Account settings
- Profile picture upload

## Styling

The application uses a modern, clean design with:
- Dark blue gradient header
- Card-based layouts
- Responsive grid system
- Smooth transitions and hover effects

Global styles are defined in `src/styles.css`. Component-specific styles are in each component's `.css` file.

## Development Notes

- The application includes mock data for development when the backend is not available
- CORS must be enabled on the Java backend to allow requests from `http://localhost:4200`
- Image uploads use FormData to send files to the backend

## Troubleshooting

1. **CORS Errors**: Make sure your Java backend has CORS enabled for `http://localhost:4200`

2. **API Connection Errors**: Verify that:
   - The Java backend is running on port 8080
   - The API endpoints match the backend controller routes

3. **Build Errors**: Make sure all dependencies are installed:
   ```bash
   npm install
   ```

## License

This project is part of the Blog Management System.

