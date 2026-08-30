# Blog Management System — Technical & UI Documentation Guide

## Executive Summary & System Architecture

The **Blog Management System** (branded as **"Feel Free"**) is an enterprise-grade, multi-featured social blogging, real-time messaging, map-based proximity discovery, and avatar interaction web application. Built with a modern decoupled client-server architecture, the platform combines standard social networking (blogging, comments, likes, follower graphs, profile management) with novel real-time features like anonymous random chat, street-level map navigation, avatar customization, and proximity-based user interaction.

### Core Technology Stack

- **Frontend Framework**: **Angular 20** Single Page Application (TypeScript 5.8, RxJS 7.8, HTML5, Vanilla CSS / Component-Scoped CSS).
- **Frontend Architecture**: Standalone Component Bootstrap (`AppComponent`), Reactive Forms Validation, RxJS Async Event Streams, Custom HTTP Interceptors (`auth.interceptor.ts`), Route Guards (`auth.guard.ts`), and Leaflet 1.9 Mapping Engine.
- **Backend API & Microservices**: **Spring Boot 3 / Java**, RESTful API controllers, Spring Data JPA, Hibernate ORM, MySQL Relational Database.
- **Real-Time & Messaging Layer**: WebSocket STOMP protocol, Kafka Event Broker (`chat.message.delivered` topics) for async messaging fan-out, and Multipart file processing for high-capacity media uploads.
- **Security & Authentication**: JWT Token Auth, Spring Security, BCrypt Password Encoding, Face Connection / Biometric Access, and Social Provider Handshakes.

---

## Key Feature Spotlight: Authentication & Logic Page (`logic page .png`)

### Definition & Functional Purpose ("Em Chestam Ani")

The **Logic / Authentication Page** (`logic page .png`) serves as the primary gateway and security entrance of the Blog Management System. It handles identity verification, user authentication, session initiation, and access control before granting users entry into protected application zones such as `/home`, `/profile`, `/random-chat`, and map features.

### UI & Layout Structure

1. **Brand Hero Section**: Left panel presenting the brand identity ("Feel Free"), motivational tagline ("See everyday moments from your close friends"), and interactive preview tiles illustrating the key platform sub-systems (Anonymous Chat, Mr. Map Zone, Street Level navigation, and User Screen interaction).
2. **Authentication Card**: Right panel housing the standard credential login form (`Mobile number, username or email` and `Password`), high-visibility `Log in` action button, OR divider, `Log in with Facebook / Face Connection` button, `Forgot password?` link, and `Sign up / Create account` trigger box.
3. **Footer Bar**: Navigation links for platform policies, location settings, language selector, and copyright statement.

### Angular Frontend Technical Implementation

- **Component**: `LoginComponent` ([`login.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/login/login.component.ts), [`login.component.html`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/login/login.component.html)).
- **Form Handling**: Utilizes Angular `ReactiveFormsModule` with `FormBuilder` to construct `loginForm`. Enforces `Validators.required` and `Validators.email`.
- **Authentication Service**: Injects `AuthService` ([`auth.service.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/services/auth.service.ts)) which dispatches a `POST /api/auth/login` request to the backend. Upon successful response, the JWT token and user profile object are cached in local browser storage, updating the authentication state observable and executing Angular `Router.navigate(['/home'])`.
- **Route Protection**: Integrated with `authGuard` ([`auth.guard.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/auth.guard.ts)) to block unauthorized access to protected routes and redirect authenticated users automatically to `/home`.

---

## Advanced Authentication Workflows

### 1. Face Connection & Direct Account Creation / Login

- **Concept & Definition**: The Face Connection feature provides passwordless, direct access authentication and accelerated account creation by linking a user's biometric facial profile or OAuth identity directly to their Blog Management account.
- **Workflow & Execution**:
  1. User clicks `Log in with Facebook / Face Connection` on the login screen.
  2. The Angular application invokes the camera API (`navigator.mediaDevices.getUserMedia`) or triggers the OAuth provider workflow.
  3. The extracted face embedding or provider authorization token is validated via backend endpoint `POST /api/auth/face-login` or social handshake.
  4. If registered, the system logs the user in instantly without requiring password input.
  5. If new, the system routes the user to `RegisterComponent` ([`register.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/register/register.component.ts)), pre-populating verified credentials and focusing missing location/gender fields for instant account creation.

### 2. Forgot Password & New Password Management

- **Concept & Definition**: A secure password recovery pipeline that enables users who lost their credentials to safely generate a new password and regain access to their account.
- **Workflow & Execution**:
  1. The user clicks `Forgot password?` on `logic page .png`.
  2. The Angular frontend navigates to the recovery view, prompting the user for their registered email or mobile number.
  3. Clicking `Submit` dispatches `POST /api/auth/forgot-password`.
  4. The Spring Boot backend verifies user existence in MySQL, generates a cryptographically secure, time-bound reset token (e.g., valid for 15 minutes), and delivers a reset link via email/SMS.
  5. The user opens the reset link containing the token parameter. The frontend renders the password reset component with inputs for `New Password` and `Confirm New Password`.
  6. Submitting the new password triggers `POST /api/auth/reset-password`. The backend verifies token validity, hashes the new password with BCrypt (`BCryptPasswordEncoder`), updates the user entity in MySQL, invalidates the token, and redirects the user back to the login page with a success toast notification.

---

## Detailed Technical Knowledge Base: Screenshot Analysis

Below is the exhaustive, image-by-image technical breakdown for every screenshot in the project documentation directory. Each section represents a key visual component and interface module of the application.

---

### `logic page .png`

**Technical Analysis & Architecture**:
`logic page .png` is the primary authentication screen and entry gate for the application. Built with Angular 20 (`LoginComponent`), it encapsulates form validation, JWT session handling, social auth triggers, and forgot password navigation. The UI utilizes CSS Flexbox/Grid for a responsive split layout: the left side displays feature preview cards and marketing hero copy, while the right side renders a high-contrast dark theme form box. On submission, `LoginComponent` calls `AuthService.login()`, sending a payload (`email`, `password`) to backend `POST /api/auth/login`. Upon 200 OK verification, the server returns a user payload containing JWT token details. `AuthService` persists the token and user state, while `auth.interceptor.ts` attaches `Authorization: Bearer <token>` to all subsequent HTTP requests. Error states (such as 401 Unauthorized) trigger reactive error messaging within the template without page reloads.

---

### `create account page.png`

**Technical Analysis & Architecture**:
`create account page.png` depicts the user registration interface managed by `RegisterComponent` ([`register.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/register/register.component.ts)). This component manages a multi-field Reactive Form including `fullName`, `email`, `password`, `confirmPassword`, `gender`, `phoneNumber`, `country`, `state`, and `town`. It features cascaded dropdown logic using RxJS subscription observers on country and state control changes (`onCountryChange` and `onStateChange`), dynamically filtering valid states and towns from `LOCATION_DATA`. Custom cross-field validation (`passwordMatchValidator`) ensures `password` and `confirmPassword` match prior to form submission. Clicking `Register` dispatches `POST /api/auth/register`. The Spring Boot controller `AuthController` validates unique constraints on email and username against MySQL database tables. Upon successful user creation, BCrypt hashes the password, persists the `User` entity, and redirects the user into the main application feed (`/home`).

---

### `home page.png`

**Technical Analysis & Architecture**:
`home page.png` represents the central feed and dashboard layout executed by `HomeComponent` ([`home.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/home/home.component.ts)). The layout is organized into a top navigation bar (Header component), a main content timeline grid, and right-hand sidebars for user suggestions, popular posts, and active tags. `HomeComponent` lifecycle hooks (`ngOnInit`) execute `PostService.getPosts()`, fetching an array of post objects from Spring Boot REST endpoint `GET /api/posts`. Posts are rendered dynamically using Angular `*ngFor` directives. Embedded media (images, videos, PDFs stored under `/uploads/`) are resolved dynamically via base static endpoints. The page handles lazy loading, infinite scroll pagination, and quick access navigation to post creation (`/create`), user profiles (`/profile`), and messaging.

---

### `post in home page witj likes and commets.png`

**Technical Analysis & Architecture**:
This screenshot details an expanded blog post card within the main feed showing social interaction elements: like counters, comment threads, and user avatar headers. Clicking the like icon calls `PostService.toggleLike(postId, userId)`, which fires `POST /api/posts/{postId}/like?userId={id}`. The backend toggles the user's ID in the post's like repository and returns an updated count asynchronously, updating the UI heart icon state immediately. The comment section presents an input field bound via Angular Reactive or Template-driven forms. Submitting a comment dispatches `POST /api/posts/{postId}/comments?userId={id}` with the raw text payload. The Spring Boot backend creates a new `Comment` entity mapped to `Post` and `User` relational foreign keys in MySQL and returns the persisted comment object, which is appended to the local RxJS post comments array.

---

### `popular post which was most liked post by users.png`

**Technical Analysis & Architecture**:
This component view highlights the "Popular Posts" widget situated on the home page sidebar or dedicated trending tab. Driven by `PostService.getPopularPosts()`, it queries backend endpoint `GET /api/posts/popular`. In the Spring Boot backend (`PostRepository`), an optimized SQL query executes a join between `posts`, `likes`, and `comments`, ordering results by calculated engagement score `(COUNT(likes.id) * 2 + COUNT(comments.id)) DESC`. The top-ranked posts are returned as DTOs containing title snippets, thumbnail image URLs, author details, and total like counts. Angular renders these cards with hover animations, enabling users to jump directly to high-performing content (`/post/:id`).

---

### `post and bloging section.png`

**Technical Analysis & Architecture**:
`post and bloging section.png` shows the post creation and editing interface managed by `CreatePostComponent` ([`create-post/create-post.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/create-post/create-post.component.ts)). The UI contains fields for post title, rich body text/content, category selection, tag tags input, and file attachment dropzone (supporting JPEG, PNG, MP4, PDF). Upon submission, the frontend constructs a `FormData` object containing a JSON blob for post details (`title`, `content`, `category`, `tags`) and a binary `file` payload. The request is sent via `POST /api/posts` with header `Content-Type: multipart/form-data`. The Spring Boot `PostController` intercepts the upload using `MultipartFile`, stores the file to disk in `/uploads/`, assigns the generated file URL to `mediaUrl`, and persists the `Post` record in MySQL.

---

### `post with data.png`

**Technical Analysis & Architecture**:
`post with data.png` displays the full single-post view component (`PostDetailComponent`). Accessed via route `/post/:id`, the component reads the `id` route parameter using `ActivatedRoute` and invokes `PostService.getPostById(id)` hitting `GET /api/posts/{id}`. This screen renders complete post typography, high-resolution media galleries, author metadata (avatar, full name, post date), full comment list, and social sharing options. An RxJS subject stream manages real-time updates when new comments are added or likes are toggled, preventing total component re-renders and guaranteeing seamless performance.

---

### `profile section in home page.png`

**Technical Analysis & Architecture**:
`profile section in home page.png` illustrates the compact user profile summary widget rendered within the left or top navigation drawer of `HomeComponent`. It pulls user session data directly from `AuthService.currentUserValue`, rendering the user's profile image avatar, display name, username handle, and quick links to profile edit (`/profile/edit`), followers list, and logout. This component acts as a lightweight subscriber to the application's global user state, automatically updating if the user changes their avatar or bio in another tab or view.

---

### `profile page.png`

**Technical Analysis & Architecture**:
`profile page.png` displays the user's dedicated personal dashboard rendered by `ProfileComponent` ([`profile/profile.component.ts`](file:///Users/ent-00210/Desktop/work/personal/Blog-Management-System-java-project/frontend/src/app/components/profile/profile.component.ts)). The view includes a header cover photo, circular profile image, bio, location details, social media links (Twitter/LinkedIn), follower/following count badges, and tabbed feeds of the user's authored posts. The component executes parallel HTTP calls using RxJS `forkJoin`: `UserService.getProfile(userId)`, `FollowersAndFollowingService.getCounts(userId)`, and `PostService.getUserPosts(userId)`. This aggregate data model hydrates the profile template efficiently in a single rendering cycle.

---

### `profile edit.png`

**Technical Analysis & Architecture**:
`profile edit.png` shows the account editing screen (`ProfileEditComponent`). It provides form controls for updating personal information (`fullName`, `bio`, `phoneNumber`, social media URLs) as well as file upload controls for profile picture and background cover image. Changing text details triggers `PUT /api/users/{id}` with a JSON payload. Uploading images dispatches dedicated multipart HTTP requests: `PUT /api/users/{id}/profile-image` or `PUT /api/users/{id}/background-image`. The backend processes the incoming file, saves it to `/uploads/`, updates the user record's `profileImageUrl` or `backgroundImageUrl` column, and returns the updated `User` object to synchronize local storage and component state.

---

### `seeing other user profile.png`

**Technical Analysis & Architecture**:
`seeing other user profile.png` displays the public profile view (`UserProfileComponent`) when viewing another member's page (`/user/:id`). The component fetches target user data via `GET /api/users/{id}` and checks the relationship status between the logged-in user and target user via `GET /api/followersAndFollowing/check?userId={currentId}&targetUserId={targetId}`. The UI dynamically renders a `Follow` or `Unfollow` button based on the returned boolean `isFollowing`. Clicking `Follow` triggers `POST /api/followersAndFollowing/follow`, updating follower count numbers reactively and allowing instant initiation of direct messaging via `ChatLaunchService`.

---

### `quick search for users.png`

**Technical Analysis & Architecture**:
`quick search for users.png` demonstrates the instant user search overlay bar. As the user types into the search input in the header navbar, an RxJS `FormGroup` or `Subject` pipeline applies operator chains: `debounceTime(300)`, `distinctUntilChanged()`, and `switchMap(query => UserService.searchUsers(query))`. The request calls backend endpoint `GET /api/users/search?q={query}`. The Spring Boot backend executes a SQL `LIKE %query%` lookup across username and full name columns. Results are returned as a light array of user cards rendered in an overlay dropdown list for instant navigation to any user profile.

---

### `user suggestions.png`

**Technical Analysis & Architecture**:
`user suggestions.png` shows the recommended contacts and user discovery widget situated on the home page. Driven by `UserService.getSuggestedUsers()`, the backend runs a graph analysis query identifying users who share mutual followers, common tags, or close location parameters (matching town/state). The component displays avatar tiles with quick `Follow` toggle buttons, allowing users to build their social network effortlessly directly from the main feed interface.

---

### `messages section.png`

**Technical Analysis & Architecture**:
`messages section.png` displays the Direct Messaging (DM) inbox drawer and conversation list (`chat-panel` / `ChatService`). Accessing this section queries backend endpoint `GET /api/chat/conversations?userId={id}`. The backend aggregates conversation threads, returning an array of `ConversationSummary` objects containing target user profiles, timestamped latest message text (`lastMessage`), and unread message badges (`unreadCount`). The UI renders threads ordered by most recent activity, with unread conversations highlighted visually in bold typography.

---

### `chat section with response.png`

**Technical Analysis & Architecture**:
`chat section with response.png` depicts an active user-to-user chat conversation window. Opening a conversation triggers `GET /api/chat/messages?userId={currentId}&otherUserId={targetId}` to pull historical message history (sorted oldest to newest). The user types a message and clicks send, dispatching `POST /api/chat/messages` with payload `{ senderId, receiverId, content }`. Concurrently, backend persistence in MySQL triggers a Kafka event to topic `chat.message.delivered`. If WebSocket STOMP is connected, the receiver gets the message pushed in real time without refreshing. Opening the thread automatically dispatches `POST /api/chat/read` to clear unread badges.

---

### `notification section.png`

**Technical Analysis & Architecture**:
`notification section.png` illustrates the user activity and alerts panel (`NotificationService`). The component connects to backend endpoint `GET /api/notifications?userId={id}` to display alerts for new likes, comments on authored posts, new followers, direct messages, and system announcements. Unread notifications display distinct badge colors. Clicking a notification marks it as read via `PUT /api/notifications/{id}/read` and routes the user directly to the relevant entity (e.g., target post detail or profile).

---

### `tages with is using this application to easy to find posts.png`

**Technical Analysis & Architecture**:
This screenshot showcases the application's tag cloud and categorization system. Tags extracted from posts (e.g., `#java`, `#angular`, `#spring`, `#tech`) are indexed by the backend. Clicking a tag badge navigates to `/posts/tag/:tagName`, triggering `PostService.getPostsByTag(tagName)` via `GET /api/posts/tag/{tagName}`. The frontend filters the feed timeline dynamically to show only posts matching the selected tag, enhancing content discoverability.

---

### `account settings.png`

**Technical Analysis & Architecture**:
`account settings.png` displays the user configuration dashboard. It contains tabbed controls for security settings, password updates, notification preferences, privacy visibility, and account deletion options. Updating security settings invokes Spring Boot endpoints enforcing current password validation before executing changes, ensuring user account safety.

---

### `random chat section.png`

**Technical Analysis & Architecture**:
`random chat section.png` shows the landing page for the Anonymous Random Chat feature (`RandomChatComponent`). The interface presents matchmaking preferences (e.g., location proximity, interest tags, gender filters) and a prominent `Start Matchmaking` action button. Clicking match dispatches an anonymous queue request to backend `AnonymousChatService` via WebSocket or HTTP poll.

---

### `random chat inside ui.png`

**Technical Analysis & Architecture**:
`random chat inside ui.png` presents the active anonymous chat session interface. Once two anonymous users are matched by the backend queue system, a unique session token is generated. Messages are exchanged securely over WebSocket STOMP (`/app/random-chat/{sessionId}`) without revealing user identities or actual usernames. The UI includes options to send text, share media, or disconnect and request a new stranger match instantly.

---

### `rendom chats.png`

**Technical Analysis & Architecture**:
`rendom chats.png` depicts an alternative expanded view of the anonymous random chat dashboard, showing active room counts, online user metrics, and past session summaries. Built with Angular reactive streams, it dynamically reflects server load and available chatters in real time.

---

### `lets play with stangers.png`

**Technical Analysis & Architecture**:
`lets play with stangers.png` displays the gamified interactive lounge ("Let's Play with Strangers") rendered by `StrangersGameComponent`. This feature combines social interaction with mini-games and avatar roleplay. Users select game modes, view active lobbies, and join multiplayer sessions powered by WebSocket event broadcasting.

---

### `play with stangers caracter creation.png`

**Technical Analysis & Architecture**:
`play with stangers caracter creation.png` shows the character creation setup screen for avatar-based stranger interactions. Users customize 2D/3D visual attributes (hair, outfit, skin tone, accessories) and character handles. The resulting avatar configuration JSON object is saved to the user's session profile state to represent them in street map navigation and avatar lounges.

---

### `chat with stanger Avatar complete details for map story.png`

**Technical Analysis & Architecture**:
This view displays detailed avatar profile cards integrated into the map story feature. Clicking an avatar on the interactive map opens a modal presenting the character's backstory, map check-in history, active status, and request buttons to initiate chat or reveal true profile identities.

---

### `chat with stanger Avatar with complete map with avatar.png`

**Technical Analysis & Architecture**:
`chat with stanger Avatar with complete map with avatar.png` illustrates the integrated Leaflet JS map interface overlaid with user avatars. The Angular component initializes a Leaflet map instance (`L.map('map')`), loading street tiles and dynamically rendering custom Leaflet markers (`L.marker`) shaped as user avatar icons based on coordinate data (`latitude`, `longitude`) fetched from backend map APIs.

---

### `chat with stanger carater creation with detail.png`

**Technical Analysis & Architecture**:
This screenshot details advanced avatar attribute configuration options, including personality traits, status messages, and proximity visibility toggles. Changes are bound bi-directionally to the Angular component state and synchronized with the backend user avatar repository.

---

### `chat with stanger inside view.png`

**Technical Analysis & Architecture**:
`chat with stanger inside view.png` shows an in-game or in-room avatar conversation interface where avatar sprites are rendered on a shared background canvas or interactive street grid, allowing real-time chat bubbles to appear directly above the avatars as users type.

---

### `chat with stanger map adopt a home.png`

**Technical Analysis & Architecture**:
This screen presents the "Adopt a Home" map feature, where users can pin a virtual virtual residence or hangout spot on the world map. Clicking a location on the Leaflet map triggers a coordinate picker, saving home location markers (`lat`, `lng`, `homeName`) to backend spatial data repositories.

---

### `chat with stanger map user deatils .png`

**Technical Analysis & Architecture**:
This screenshot displays the detail popover card that appears when selecting a stranger's pin on the map. It shows geographic distance (calculated via Haversine formula on backend or frontend), mutual interests, and interaction triggers ("Send Ping", "View Avatar", "Request Identity Reveal").

---

### `chat with stanger random meet with avatar.png`

**Technical Analysis & Architecture**:
`chat with stanger random meet with avatar.png` illustrates a randomized avatar meeting encounter. The system pairs two geographically or interest-matched avatars into a private meeting space with animated avatar interactions and prompt starters.

---

### `map finder chat experence.png`

**Technical Analysis & Architecture**:
This view demonstrates the integrated map-and-chat split screen ("Map Finder Chat Experience"). The left side presents real-time Leaflet map navigation, while the right side renders an active chat thread, allowing users to discuss location coordinates and meetup points seamlessly without leaving the map context.

---

### `map finder chat notification if user present.png`

**Technical Analysis & Architecture**:
`map finder chat notification if user present.png` depicts proximity presence alerts. When another user or friend enters the user's defined map radius (e.g., within 1 km), a real-time toast notification is triggered via WebSocket presence handlers, displaying an avatar alert banner.

---

### `map finder chat.png`

**Technical Analysis & Architecture**:
This screenshot shows the compact messaging overlay used directly over the map finder viewport, enabling lightweight pop-up conversations while navigating spatial maps.

---

### `map finder inside map.png`

**Technical Analysis & Architecture**:
`map finder inside map.png` presents the full-screen interactive Leaflet map view (`MapZoneComponent`). Features include custom tile layers, zoom controls, location search geocoding, user pin clusters, and zone boundaries for localized group discussions.

---

### `map finder my street view people.png`

**Technical Analysis & Architecture**:
`map finder my street view people.png` illustrates the street-level view mode. It translates map GPS coordinates into a street simulation grid, showing nearby users walking along virtual streets as avatars with real-time position updates.

---

### ` map finder navigate me & my location and street view.png`

**Technical Analysis & Architecture**:
This screenshot shows the GPS location navigation feature. Utilizing the HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`), the Angular application captures the user's current GPS coordinates, centers the Leaflet map viewport, and displays street view directions to selected destinations or user locations.

---

### `Map finder after accept the revel request.png`

**Technical Analysis & Architecture**:
`Map finder after accept the revel request.png` depicts the UI state after two anonymous map users mutually accept an "Identity Reveal Request". The interface transitions from anonymous avatar handles to real user profile data, unlocking direct social links, full usernames, and standard DM capabilities.

---

### `request to other user to revel.png`

**Technical Analysis & Architecture**:
`request to other user to revel.png` displays the modal dialog for sending an identity reveal request. Clicking "Request Reveal" dispatches `POST /api/map/reveal-request` to the target user. The target receives an interactive notification prompt with "Accept" and "Decline" actions to control privacy exposure.

---

## Technical Summary Matrix

| Feature Module | Primary Angular Component | Primary Spring Boot Controller / API | Key Database Tables / Artifacts | Real-time / Protocol |
|---|---|---|---|---|
| **Authentication & Face Login** | `LoginComponent` | `AuthController` (`/api/auth/*`) | `users`, `jwt_tokens` | HTTP REST, OAuth, Camera WebRTC |
| **Registration & Cascaded Location** | `RegisterComponent` | `AuthController` (`/api/auth/register`) | `users`, `location_data` | HTTP REST |
| **Blogging Feed & Popular Posts** | `HomeComponent` | `PostController` (`/api/posts/*`) | `posts`, `categories`, `tags` | HTTP REST |
| **Likes & Comments** | `PostDetailComponent` | `PostController` (`/api/posts/{id}/*`) | `likes`, `comments` | HTTP REST / RxJS Observables |
| **Media Uploads** | `CreatePostComponent` | `PostController` (`/api/posts`) | `/uploads/` file system | HTTP Multipart (`FormData`) |
| **Profile & Image Management** | `ProfileComponent`, `ProfileEditComponent` | `UserController` (`/api/users/*`) | `users` (`profile_image_url`) | HTTP Multipart |
| **Follower Social Graph** | `UserProfileComponent` | `FollowersAndFollowingController` | `followers_following` | HTTP REST |
| **Direct Messaging (DMs)** | `ChatPanelComponent` | `ChatController` (`/api/chat/*`) | `chat_messages` | Kafka, WebSocket STOMP |
| **Anonymous Random Chat** | `RandomChatComponent` | `AnonymousChatController` | `chat_sessions` | WebSocket STOMP |
| **Map Finder & Street Navigation** | `MapZoneComponent` | `MapController` (`/api/map/*`) | `user_locations`, `spatial_pins` | Leaflet JS, HTML5 Geolocation |
