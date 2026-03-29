# Blog Management System

A full-stack blog management system built with **Spring Boot** (Java) and **Angular**. This application provides a complete platform for users to create, manage, and interact with blog posts, including features like comments, likes, user profiles, and file uploads.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Documentation](#documentation)

## ✨ Features

### User Management
- User registration and authentication
- User profile management with bio, social links, and profile images
- Profile editing with image upload support

### Blog Post Management
- Create, read, update, and delete blog posts
- Rich text content with categories and tags
- Image, video, and PDF file upload support
- Popular posts ranking based on likes and comments

### Social Features
- Like/unlike posts
- Comment on posts
- View popular posts
- Recent comments sidebar
- Tag-based content discovery

### Frontend Features
- Responsive design with modern UI
- Authentication guards for protected routes
- Pagination for blog posts
- Real-time interactions (likes, comments)
- Image upload with drag-and-drop support

## 🛠 Tech Stack

### Backend
- **Java 17**
- **Spring Boot 3.1.1**
- **Spring Data JPA / Hibernate**
- **MySQL** database
- **Maven** for dependency management
- **Lombok** for reducing boilerplate code

### Frontend
- **Angular 20**
- **TypeScript 5.8**
- **RxJS** for reactive programming
- **Angular Router** for navigation
- **Angular Forms** (Reactive Forms)

## 📁 Project Structure

```
Blog-Management-System-java-project/
├── Backend/                          # Spring Boot multi-module project
│   ├── Blog_mng_app/                # Main application entry point
│   │   └── java/com/bolg/
│   │       └── BlogApplication.java
│   ├── Blog_mng_api/                # REST Controllers layer
│   │   └── java/com/blog/
│   │       ├── controller/          # API endpoints
│   │       ├── config/              # Configuration (CORS, interceptors)
│   │       └── annotation/          # Custom annotations
│   ├── Blog_mng_sevice/             # Business logic layer
│   │   └── java/com/blog/
│   │       ├── model/               # Entity models (User, Post, Comment, Like)
│   │       ├── repository/          # JPA repositories
│   │       └── service/impl/        # Service implementations
│   ├── database_schema.sql          # Database schema DDL
│   ├── application.properties       # Application configuration
│   ├── pom.xml                      # Parent POM
│   └── README.md                    # Backend documentation
│
├── frontend/                         # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/          # Feature components
│   │   │   │   ├── home/           # Home page with posts grid
│   │   │   │   ├── create-post/    # Create/edit posts
│   │   │   │   ├── post-detail/    # Individual post view
│   │   │   │   ├── profile/        # User profile view
│   │   │   │   ├── profile-edit/   # Edit profile
│   │   │   │   ├── login/          # Login page
│   │   │   │   └── register/       # Registration page
│   │   │   ├── services/           # API services
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── post.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── shared/
│   │   │   │   └── header/         # Navigation header
│   │   │   ├── auth.guard.ts       # Route protection
│   │   │   ├── auth.interceptor.ts # HTTP interceptor
│   │   │   └── app-routing.module.ts
│   │   └── assets/                  # Static assets
│   ├── package.json
│   ├── angular.json
│   └── README.md                    # Frontend documentation
│
└── README.md                         # This file
```

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Java Development Kit (JDK) 17** or higher
- **Maven 3.6+**
- **Node.js 16+** and **npm 8+**
- **Angular CLI 16+** (or use npx)
- **MySQL 8.0+** database server
- **Git** (for cloning the repository)

## 🚀 Getting Started

### Database Setup

1. **Start MySQL server** on your local machine

2. **Create the database** by running the SQL script:
   ```bash
   mysql -u root -p < Backend/database_schema.sql
   ```
   
   Or manually create the database and run the SQL commands from `Backend/database_schema.sql`

3. **Update database credentials** in `Backend/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/blog_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

### Backend Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Build the project**:
   ```bash
   mvn clean install
   ```

3. **Run the Spring Boot application**:
   ```bash
   cd Blog_mng_app
   mvn spring-boot:run
   ```

   The backend API will be available at `http://localhost:8080`

   > **Note**: Make sure MySQL is running and the database `blog_db` exists before starting the backend.

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   ng serve
   # or
   npm start
   ```

   The frontend application will be available at `http://localhost:4200`

   > **Note**: Ensure the backend is running on port 8080 for the frontend to work properly.

## 📚 API Documentation

### Base URL
```
http://localhost:8080
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

#### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/{id}` - Get specific post
- `GET /api/posts/popular` - Get popular posts
- `POST /api/posts` - Create a new post (multipart/form-data)

#### Comments
- `GET /api/posts/{postId}/comments` - Get comments for a post
- `POST /api/posts/{postId}/comments` - Add a comment

#### Likes
- `POST /api/posts/{postId}/like` - Toggle like/unlike a post

#### Users
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `PUT /api/users/{id}/profile-image` - Upload profile image
- `PUT /api/users/{id}/background-image` - Upload background image

#### File Serving
- `GET /uploads/{filename}` - Serve uploaded files

For detailed API documentation, see:
- [Backend API Guide](./Backend/UI_HANDOFF.md) - Comprehensive API reference for UI developers
- [Backend README](./Backend/README.md) - Backend-specific documentation

## 🏗 Architecture

### Backend Architecture (Multi-Module Maven Project)

The backend follows a **layered architecture** with clear separation of concerns:

1. **Blog_mng_app** - Application entry point and configuration
2. **Blog_mng_api** - REST API layer (controllers, request handling)
3. **Blog_mng_sevice** - Business logic layer (services, repositories, entities)

### Frontend Architecture

The frontend follows **Angular best practices**:

- **Component-based architecture** - Feature modules and reusable components
- **Service layer** - Centralized API communication
- **Route guards** - Authentication protection for routes
- **HTTP interceptors** - Request/response handling

### Database Schema

The system uses the following main entities:

- **Users** - User accounts with profile information
- **Posts** - Blog posts with content, images, categories, and tags
- **Comments** - Comments on posts
- **Likes** - Like relationships between users and posts

See `Backend/database_schema.sql` for complete schema definition.

## 💻 Development

### Backend Development

- **Port**: 8080
- **Database**: MySQL (`blog_db`)
- **Auto-reload**: Use Spring Boot DevTools or IDE hot reload
- **Logging**: SQL queries are logged (set `spring.jpa.show-sql=false` in production)

### Frontend Development

- **Port**: 4200
- **Proxy**: Configured in `proxy.conf.json` for API calls
- **Hot reload**: Enabled by default with `ng serve`

### CORS Configuration

CORS is enabled on the backend for all origins (`*`). In production, configure specific allowed origins.

### File Uploads

- **Maximum file size**: 10MB
- **Supported formats**: Images, videos, PDFs
- **Storage**: Local file system (`Backend/uploads/`)
- **URL pattern**: `/uploads/{filename}`

## 📖 Documentation

### Detailed Documentation

- **[Backend README](./Backend/README.md)** - Backend setup, architecture, and API details
- **[Backend docs index](./Backend/docs/README.md)** - Index of explanation-only Markdown (like READMEs per module)
- **[blog-api explanations](./Backend/Blog_mng_api/README.md)** - File-by-file notes for the API module
- **[blog-service explanations](./Backend/Blog_mng_sevice/README.md)** - File-by-file notes for the service module
- **[blog-app explanations](./Backend/Blog_mng_app/README.md)** - Spring Boot entry module
- **[Frontend README](./frontend/README.md)** - Frontend setup, components, and styling guide
- **[Frontend docs overview](./frontend/docs/README.md)** - High-level frontend folder explanations
- **[Backend API Guide](./Backend/UI_HANDOFF.md)** - Complete API reference for frontend developers

### Database Schema

The complete database schema with DDL statements is available in:
- `Backend/database_schema.sql` - SQL script to create all tables

## 🔒 Security Notes

- Passwords are hashed before storage
- Authentication is required for protected routes (frontend guards)
- CORS is configured but should be restricted in production
- File upload validation should be enhanced for production use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

See [LICENSE](./Backend/LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `application.properties`
   - Ensure `blog_db` database exists

2. **CORS Errors**
   - Verify backend CORS configuration
   - Check that backend is running on port 8080

3. **Port Already in Use**
   - Backend: Change `server.port` in `application.properties`
   - Frontend: Use `ng serve --port <port-number>`

4. **Build Errors**
   - Backend: Run `mvn clean install` from the Backend directory
   - Frontend: Delete `node_modules` and run `npm install` again

For more troubleshooting tips, refer to the [Frontend README](./frontend/README.md#troubleshooting).

---

**Happy Blogging! 📝✨**
