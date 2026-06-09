<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" />
  <img src="https://img.shields.io/badge/SignalR-WebSockets-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" />
</p>

# ✈️ TravelLink

**A full-stack, enterprise-grade travel companion platform** built from scratch with ASP.NET Core and React. TravelLink lets friend groups collaboratively plan trips, split expenses, generate AI-powered itineraries, and share live GPS locations — all from a single, beautifully designed mobile-first interface.

---

## 🌟 Features

### 🗺️ Trip & Group Management
- Create travel groups and invite friends
- Plan trips with destinations, dates, and budgets
- Role-based group management (Admin / Member)
- Activity logging for all group actions
- Group cover images via Cloudinary upload

### 💰 Expense Tracking & Splitting
- Add expenses and split them across group members
- **Equal split** or **custom amount** distribution
- Per-user debt tracking with "Who Owes Whom" breakdowns
- Mark individual splits as **Settled**
- 1-on-1 expense views between any two friends
- Group-level and global expense dashboards

### 🤖 AI-Powered Itinerary Generation
- Powered by **Google Gemini API**
- Input trip details: destination, budget, interests, group size, transport preferences
- Generates structured day-by-day itineraries with:
  - Morning / Afternoon / Evening activities
  - Estimated costs per person
  - Restaurant and hotel recommendations
- Community **Place Suggestions** with voting system
- Rate-limited to prevent API abuse (1 generation / 15 min)

### 📍 Real-Time Live Location Sharing
- **SignalR WebSocket** powered GPS tracking
- Group sessions and private 1-on-1 sessions
- Optimized marker rendering using a custom `LocationEventEmitter` pattern (zero unnecessary React re-renders)
- Adaptive GPS polling: faster updates when driving, slower when stationary
- Battery-conscious background throttling
- Interactive **Leaflet** map with custom avatar markers

### 👥 Social & Friends System
- Search users by name or email
- Send / Accept / Decline friend requests
- View mutual friends and navigate to profiles
- Quick-access to shared expenses from friend cards

### 👤 User Profiles
- Upload profile pictures (Cloudinary)
- View personal trip history and group memberships
- Quick-link to shared expenses with friends

### 🔔 Real-Time Notifications
- SignalR-powered live notification bell
- Group invites, friend requests, expense updates
- Unread count badge with mark-as-read support

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (React)                    │
│  Vite · TypeScript · React Router · Leaflet · Sonner │
│  PWA Service Worker · Axios + JWT Interceptor        │
├──────────────────────┬──────────────────────────────┤
│     REST API (HTTPS) │  WebSocket (SignalR)          │
├──────────────────────┴──────────────────────────────┤
│                 SERVER (ASP.NET Core 8)              │
│  Controllers · Services · DTOs · Middleware          │
│  JWT Auth · Rate Limiting · Response Compression     │
│  Global Exception Handling · CORS Policy             │
├─────────────────────────────────────────────────────┤
│              DATA & EXTERNAL SERVICES                │
│  SQL Server (EF Core) · Cloudinary (Images)          │
│  Google Gemini API (AI) · SMTP (Email/OTP)           │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions
- **Service Layer Pattern**: All business logic lives in injectable `IService` / `Service` classes, keeping controllers thin.
- **Global Exception Middleware**: Catches all unhandled crashes and returns clean JSON — no stack traces leak to clients.
- **Optimized Real-Time**: Live location uses a pub/sub event emitter so only the specific map marker re-renders, not the entire React tree.
- **Cloudinary URL Transforms**: A centralized `getOptimizedImageUrl` utility injects `f_auto`, `q_auto`, and size cropping into every image URL, reducing bandwidth by up to 80%.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks-based architecture |
| **TypeScript 6** | Type-safe development |
| **Vite 8** | Lightning-fast dev server and build tool |
| **React Router 7** | Client-side routing with protected routes |
| **Axios** | HTTP client with JWT refresh-token interceptor |
| **Leaflet + React-Leaflet** | Interactive maps for live location |
| **SignalR Client** | Real-time WebSocket communication |
| **Lucide React** | Modern icon library |
| **Sonner** | Toast notification system |
| **vite-plugin-pwa** | Progressive Web App support |

### Backend
| Technology | Purpose |
|---|---|
| **ASP.NET Core 8** | Web API framework |
| **Entity Framework Core 8** | ORM with Code-First migrations |
| **SQL Server** | Relational database |
| **SignalR** | Real-time WebSocket hub |
| **JWT Bearer Auth** | Stateless authentication with refresh tokens |
| **BCrypt.NET** | Secure password hashing |
| **CloudinaryDotNet** | Image upload and transformation |
| **Google Gemini API** | AI itinerary generation |
| **Rate Limiting** | Built-in ASP.NET middleware |
| **Swagger / OpenAPI** | API documentation |

---

## 🚀 Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (LocalDB or full instance)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com/) API key (for Gemini)

### 1. Clone the Repository
```bash
git clone https://github.com/PriyamAryan21/Travel-Link-dotNet-React.git
cd Travel-Link-dotNet-React
```

### 2. Backend Setup
```bash
cd Server/Server

# Configure your secrets in appsettings.json or via environment variables:
# - ConnectionStrings:DefaultConnection
# - Jwt:Key, Jwt:Issuer, Jwt:Audience
# - Cloudinary:CloudName, Cloudinary:ApiKey, Cloudinary:ApiSecret
# - Gemini:ApiKey

# Apply database migrations
dotnet ef database update

# Run the server
dotnet run
```
The API will start on `https://localhost:7150` by default.

### 3. Frontend Setup
```bash
cd Client

# Install dependencies
npm install

# Start the dev server
npm run dev
```
The app will open at `https://localhost:5173`. The Vite proxy automatically forwards `/api` and `/hubs` requests to the backend.

### 4. Environment Variables (Production)
For deployment, set the following environment variables instead of hardcoding secrets:

| Variable | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `Jwt__Key` | JWT signing secret (min 32 chars) |
| `Jwt__Issuer` | JWT issuer URL |
| `Jwt__Audience` | JWT audience URL |
| `Cloudinary__CloudName` | Cloudinary cloud name |
| `Cloudinary__ApiKey` | Cloudinary API key |
| `Cloudinary__ApiSecret` | Cloudinary API secret |
| `Gemini__ApiKey` | Google Gemini API key |
| `Cors__AllowedOrigins__0` | Allowed frontend origin URL |

---

## 📁 Project Structure

```
TravelLink/
├── Client/                          # React Frontend
│   ├── public/                      # Static assets & PWA icons
│   ├── src/
│   │   ├── components/              # Shared UI (AppLayout, Modals, ProtectedRoute)
│   │   ├── context/                 # React Contexts (Auth, Theme, Notifications)
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/                #   Login & Registration
│   │   │   ├── dashboard/           #   Main dashboard
│   │   │   ├── expenses/            #   Expense management (Group, User, Detail)
│   │   │   ├── friends/             #   Friend system
│   │   │   ├── groups/              #   Group management
│   │   │   ├── itinerary/           #   AI itinerary system
│   │   │   ├── location/            #   Live GPS tracking
│   │   │   ├── profile/             #   User profiles
│   │   │   └── trips/               #   Trip planning
│   │   ├── services/                # API service layer (Axios wrappers)
│   │   ├── types/                   # TypeScript type definitions
│   │   └── utils/                   # Utilities (image optimization)
│   └── vite.config.ts               # Vite + PWA + SSL config
│
├── Server/
│   └── Server/
│       ├── Controllers/             # API endpoints (8 controllers)
│       ├── Data/                    # EF Core DbContext & migrations
│       ├── DTOs/                    # Data Transfer Objects
│       ├── Hubs/                    # SignalR real-time hub
│       ├── Middlewares/             # Global exception handling
│       ├── Models/Entities/         # Database entity models (15 entities)
│       ├── Services/                # Business logic layer (8 service pairs)
│       └── Program.cs              # App configuration & middleware pipeline
│
└── Documents/                       # Architecture docs & progress notes
```

---

## 🔒 Security Measures

- **JWT Authentication** with automatic refresh-token rotation
- **BCrypt** password hashing (never stores plaintext)
- **CORS** locked to specific frontend origins (no wildcards)
- **Rate Limiting** on authentication endpoints (10 req / 5 min per IP)
- **Rate Limiting** on AI generation (1 req / 15 min per user)
- **Global Exception Middleware** prevents stack trace leaks
- **Authorization checks** on all sensitive endpoints (group membership, expense ownership)
- **Secrets via Environment Variables** — never committed to source control

---

## ⚡ Performance Optimizations

- **Cloudinary Image Transforms**: Auto-format (`f_auto`), auto-quality (`q_auto`), and exact-size cropping reduce image payloads by up to 80%
- **Lazy Loading**: All images use `loading="lazy"` to defer off-screen assets
- **Response Compression**: Brotli/Gzip compression on all API responses
- **SQL Indexing**: Non-clustered indexes on `Email`, `Date`, `StartDate`, `CreatedAt`, and `Status` columns
- **Optimized WebSocket Updates**: Custom event emitter pattern avoids full React tree re-renders during live location tracking
- **Adaptive GPS Polling**: Driving mode (3s), walking (10s), stationary (30s), backgrounded (60s)
- **PWA Service Worker**: Caches static assets for instant repeat loads
- **Production Bundle**: ~198KB gzipped (React + Leaflet + SignalR)

---

## 📱 Progressive Web App

TravelLink is a fully installable PWA. When visiting the hosted app:
1. Click the **Install** icon in your browser's address bar
2. The app installs to your home screen with a native app-like experience
3. Static assets are cached by the service worker for faster loading
4. An **Offline Overlay** gracefully informs users when connectivity drops

---

## 🗄️ Database Schema

The application uses **15 entity models** managed through EF Core Code-First migrations:

| Entity | Description |
|---|---|
| `User` | Authentication, profile, and relationships |
| `Group` | Travel groups with cover images |
| `GroupMember` | Many-to-many user ↔ group with roles |
| `Trip` | Travel plans linked to groups |
| `Expense` | Shared costs with payer tracking |
| `ExpenseSplit` | Individual debt records per expense |
| `FriendRequest` | Pending / Accepted / Rejected states |
| `ItineraryRequest` | AI generation parameters |
| `GeneratedItinerary` | Stored AI results |
| `ItineraryDay` | Day-level itinerary breakdown |
| `ItineraryItem` | Individual activities with cost estimates |
| `PlaceSuggestion` | Community-submitted destinations |
| `SuggestionVote` | Voting on place suggestions |
| `ActivityLog` | Audit trail for group actions |
| `Notification` | Real-time user notifications |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/PriyamAryan21">Priyam Aryan</a>
</p>
