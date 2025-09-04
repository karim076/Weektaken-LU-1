# Sakila App - Nieuwe MVC Architectuur

## Project Structuur

```
sakila-app/
├── src/                          # Source directory (NF-01: Layered Architecture)
│   ├── config/                   # Configuration files
│   │   └── database.js           # Database connection config with pooling
│   ├── dao/                      # Data Access Objects (Database Layer)
│   │   ├── BaseDAO.js            # Base DAO met common operations
│   │   ├── UserDAO.js            # User authentication queries
│   │   ├── CustomerDAO.js        # Customer data operations
│   │   ├── FilmDAO.js            # Film data operations
│   │   ├── SessionDAO.js         # Session management
│   │   └── OwnerDAO.js           # Owner/Admin operations
│   ├── services/                 # Business Logic Layer
│   │   ├── AuthService.js        # Authentication business logic
│   │   ├── CustomerService.js    # Customer business logic
│   │   ├── FilmService.js        # Film business logic
│   │   └── OwnerService.js       # Owner/Admin business logic
│   ├── controllers/              # Presentation Layer
│   │   ├── AuthController.js     # Authentication controller
│   │   ├── HomeController.js     # Home page controller
│   │   ├── CustomerController.js # Customer management controller
│   │   ├── FilmController.js     # Film browsing controller
│   │   └── OwnerController.js    # Owner/Admin controller
│   ├── routes/                   # Route definitions
│   │   ├── customers.js          # Customer management routes
│   │   ├── films.js              # Film browsing routes
│   │   └── admin.js              # Admin/Owner routes
│   └── middleware/               # Cross-cutting concerns
│       ├── auth.js               # Authentication middleware
│       └── error.js              # Error handling middleware
├── views/                        # EJS templates
├── public/                       # Static files (CSS, JS, images)
├── database/                     # Database setup scripts
│   └── add_owners_and_auth.sql   # Authentication tables setup
└── app.js                        # Main application (updated voor src structure)
```

## Data Flow

```
Views ↔ Controllers ↔ Services ↔ DAOs ↔ Database
```

### 1. DAO Layer (Data Access Objects)
- **BaseDAO**: Common database operations (CRUD)
- **UserDAO**: User authentication queries
- **CustomerDAO**: Customer data operations met transactions
- **FilmDAO**: Film operations met complex joins
- **SessionDAO**: Session management
- **OwnerDAO**: Staff en store management

### 2. Service Layer (Business Logic)
- **AuthService**: Authentication, password hashing, session management
- **CustomerService**: Customer business rules, pagination, validation
- **FilmService**: Film business logic, rental operations
- **OwnerService**: Admin operations, staff management

### 3. Controller Layer
- Controllers gebruiken services voor business logic
- Geen directe database calls
- Response formatting en error handling

### 4. Configuration
- **database.js**: Connection pooling met graceful shutdown
- Environment-based configuration
- Error handling en reconnection logic

## Belangrijke Features

### Database Management
- Connection pooling voor performance
- Transaction support in DAOs
- Graceful shutdown van connections
- Query error handling en logging

### Authentication Flow
1. User login → AuthController
2. AuthController → AuthService.authenticateUser()
3. AuthService → UserDAO.findByUsernameOrEmail()
4. Password verification met bcrypt
5. Session creation via SessionDAO
6. Response met user data

### Business Logic Separation
- Alle database queries in DAOs
- Business rules in Services
- Controllers alleen voor request/response handling
- Middleware gebruikt Services voor auth

## Migration Status

### ✅ Voltooid
- Database configuration met pooling
- Complete DAO layer met BaseDAO
- Service layer met business logic
- AuthController en AuthMiddleware herzien
- App.js bijgewerkt voor nieuwe structuur

### 🔄 Te Migreren
- CustomerController → CustomerService
- FilmController → FilmService 
- OwnerController → OwnerService
- Routes bijwerken voor nieuwe controllers
- Error handling middleware

## Volgende Stappen

1. **SQL Script Uitvoeren**: Database tabellen en views aanmaken
2. **Controllers Migreren**: Oude controllers naar nieuwe service layer
3. **Routes Bijwerken**: Route definities voor nieuwe controllers
4. **Testing**: Complete flow testen
5. **Error Handling**: Centralized error handling

## Database Dependencies

Voor de applicatie te draaien moet eerst het SQL script uitgevoerd worden:
```sql
-- Voer uit: src/database/add_owners_and_auth.sql
```

Dit creëert:
- Authentication tabellen (owners, user_sessions, store_staff)
- User_auth view voor unified authentication
- Sample data voor testing
- Indexes voor performance
