# 🎬 Sakila App

Een Node.js + Express applicatie die verbinding maakt met de [Sakila MySQL database](https://dev.mysql.com/doc/sakila/en/) en een complete film verhuur systeem biedt met **Bootstrap** styling en **EJS** server-side rendering.

## Inhoud
- [Overzicht](#-overzicht)
- [Functionaliteiten](#-functionaliteiten)
- [User Stories](#-user-stories)
- [Benodigdheden](#-benodigdheden)
- [Installatie](#-installatie)
- [Projectstructuur](#-projectstructuur)
- [Routes](#-routes)
- [Screenshots](#-screenshots)
- [Randvoorwaarden](#-randvoorwaarden)
- [Non-Functional Requirements](#-non-functional-requirements)

---

## Overzicht

De Sakila App is een volledig functioneel film verhuur systeem met twee hoofdperspectieven:
- **Klanten (Customers)**: Kunnen films bekijken, huren, en hun verhuurgeschiedenis beheren
- **Staff (Medewerkers)**: Kunnen klanten beheren, verhuurprocessen afhandelen, en rapportages bekijken

De applicatie gebruikt een **callback-only architecture** (geen async/await), volgt **MVC-patronen** en implementeert een **gelaagde architectuur** met strikte scheiding tussen Controllers, Services en DAOs.

---

## Functionaliteiten

### Voor Klanten
- **Film Catalogus**: Bladeren door beschikbare films met paginering
- **Film Details**: Gedetailleerde filmview met beschikbaarheid per winkel
- **Film Zoeken**: Zoeken op titel en filteren op categorie
- **Film Huren**: Direct huren vanuit filmdetails
- **Persoonlijk Dashboard**: Overzicht van actieve en afgelopen huren
- **Profiel Beheer**: Persoonlijke gegevens aanpassen
- **Verhuurgeschiedenis**: Volledige historie van gehuurde films
- **Gebruikersregistratie**: Account aanmaken met validatie

### Voor Staff
- **Staff Dashboard**: Overzicht van verhuurstatistieken
- **Klantbeheer**: CRUD operaties voor klanten
- **Klant Zoeken**: Uitgebreid zoeken in klantendatabase
- **Verhuur Management**: Films uitlenen en retourneren
- **Klant Details**: Gedetailleerde klantinformatie en verhuurgeschiedenis
- **Rapportages**: Overzicht van actieve en achterstallige verhuren

### Algemene Features
- **Authenticatie & Autorisatie**: JWT-based met role-based access
- **Responsive Design**: Optimaal voor desktop, tablet en mobiel
- **Bootstrap UI**: Moderne, gebruiksvriendelijke interface
- **Error Handling**: Comprehensive error management
- **Database Connectie**: MySQL connection pooling

---
## User Stories

De applicatie ondersteunt twee hoofdperspectieven: **Klanten** en **Staff**. Hieronder staan de daadwerkelijk geïmplementeerde user stories.

### Klanten (Customer Perspective)

#### Epic 1: Films Ontdekken
**US1.1 - Films Bekijken (Must)**  
Als klant wil ik een overzicht van beschikbare films kunnen bekijken, zodat ik weet welke films ik kan huren.  
**Acceptatiecriteria:**  
- Films worden getoond in een responsive grid met titel, categorie, rating en beschikbaarheid
- Paginering voor eenvoudige navigatie door grote collecties
- Alleen beschikbare films worden prominent getoond
- Data wordt real-time uit de database geladen

**US1.2 - Film Details (Must)**  
Als klant wil ik gedetailleerde informatie over een film kunnen bekijken, zodat ik een geïnformeerde keuze kan maken.  
**Acceptatiecriteria:**  
- Volledige filmdetails inclusief beschrijving, cast, speelduur en rating
- Beschikbaarheid per winkel met real-time voorraadinfo
- Direct huur-knop per winkel locatie
- Responsive design voor alle apparaten

**US1.3 - Films Zoeken (Should)**  
Als klant wil ik films kunnen zoeken en filteren, zodat ik sneller de juiste film vind.  
**Acceptatiecriteria:**  
- Zoeken op filmtitel met real-time resultaten
- Filteren op categorie/genre
- Combinatie van zoeken en filteren mogelijk
- Snelle, responsive zoekresultaten

**US1.4 - Film Huren (Must)**  
Als klant wil ik een film direct kunnen huren, zodat ik deze kan bekijken.  
**Acceptatiecriteria:**  
- Direct huren vanuit filmdetail pagina
- Keuze uit beschikbare winkellocaties
- Bevestiging van succesvolle huur
- Automatische toevoeging aan persoonlijke verhuurgeschiedenis

#### Epic 2: Persoonlijk Account Beheer
**US2.1 - Account Registratie (Must)**  
Als nieuwe klant wil ik een account kunnen aanmaken, zodat ik films kan huren.  
**Acceptatiecriteria:**  
- Registratieformulier met validatie van verplichte velden
- Email verificatie en unieke gebruikersnaam controle
- Automatische koppeling aan stad/adres database
- Directe doorverwijzing naar dashboard na registratie

**US2.2 - Persoonlijk Dashboard (Must)**  
Als klant wil ik een persoonlijk dashboard hebben, zodat ik mijn verhuuractiviteit kan overzien.  
**Acceptatiecriteria:**  
- Overzicht van actieve verhuren met vervaldatums
- Snelle toegang tot populaire films
- Verhuurgeschiedenis met filter opties
- Responsive design voor alle apparaten

**US2.3 - Profiel Beheer (Should)**  
Als klant wil ik mijn profielgegevens kunnen aanpassen, zodat mijn account up-to-date blijft.  
**Acceptatiecriteria:**  
- Bewerken van persoonlijke gegevens (naam, email, adres)
- Wachtwoord wijzigen met validatie
- Real-time validatie van invoervelden
- Bevestiging van wijzigingen

**US2.4 - Verhuurgeschiedenis (Must)**  
Als klant wil ik mijn complete verhuurgeschiedenis kunnen inzien, zodat ik kan zien welke films ik eerder heb gehuurd.  
**Acceptatiecriteria:**  
- Chronologisch overzicht van alle verhuren
- Details per verhuur: film, datum, kosten, status
- Filter op status (actief/geretourneerd)
- Export functionaliteit voor persoonlijke administratie

### Staff (Medewerker Perspective)

#### Epic 3: Klantenbeheer
**US3.1 - Klanten Overzicht (Must)**  
Als medewerker wil ik een overzicht van alle klanten kunnen bekijken, zodat ik snel klantinformatie kan vinden.  
**Acceptatiecriteria:**  
- Tabel met klantbasisgegevens (naam, email, status, registratiedatum)
- Paginering voor grote klantenaantallen
- Sortering op verschillende velden
- Direct toegang tot klantdetails

**US3.2 - Klant Zoeken (Must)**  
Als medewerker wil ik klanten kunnen zoeken, zodat ik snel de juiste klant kan vinden.  
**Acceptatiecriteria:**  
- Zoeken op naam, email of klant-ID
- Real-time zoekresultaten tijdens typen
- Geavanceerde filters (status, registratiedatum)
- Snelle toegang tot gevonden klantprofielen

**US3.3 - Klant Details (Must)**  
Als medewerker wil ik gedetailleerde klantinformatie kunnen bekijken, zodat ik klanten optimaal kan helpen.  
**Acceptatiecriteria:**  
- Volledig klantprofiel met contactgegevens
- Complete verhuurgeschiedenis van de klant
- Huidige status en openstaande verhuren
- Snelle acties: nieuwe verhuur, profiel bewerken

**US3.4 - Klant Aanmaken (Should)**  
Als medewerker wil ik nieuwe klanten kunnen registreren, zodat zij gebruik kunnen maken van onze diensten.  
**Acceptatiecriteria:**  
- Uitgebreid registratieformulier met validatie
- Koppeling aan bestaande adres/stad database
- Automatische generatie van klant-ID
- Direct beschikbaar voor verhuurprocessen

**US3.5 - Klant Bewerken (Should)**  
Als medewerker wil ik klantgegevens kunnen bewerken, zodat ik correcties en updates kan doorvoeren.  
**Acceptatiecriteria:**  
- Bewerken van alle klantgegevens
- Validatie van wijzigingen
- Audit trail van wijzigingen
- Bevestiging van updates

#### Epic 4: Verhuur Management
**US4.1 - Staff Dashboard (Must)**  
Als medewerker wil ik een dashboard met verhuuroverzicht, zodat ik de huidige situatie kan monitoren.  
**Acceptatiecriteria:**  
- Overzicht van actieve verhuren
- Achterstallige verhuren met alerts
- Statistieken van de dag/week
- Snelle toegang tot belangrijkste functies

**US4.2 - Verhuur Afhandeling (Must)**  
Als medewerker wil ik verhuren kunnen afhandelen, zodat klanten films kunnen huren en retourneren.  
**Acceptatiecriteria:**  
- Nieuwe verhuur aanmaken voor klant
- Film retourneer proces
- Status updates van verhuren
- Automatische kostencalculatie

**US4.3 - Klant Verhuurgeschiedenis (Should)**  
Als medewerker wil ik de verhuurgeschiedenis van een klant kunnen bekijken, zodat ik gerichte service kan bieden.  
**Acceptatiecriteria:**  
- Complete verhuurhistorie per klant
- Filter op periode en status
- Details van elke individuele verhuur
- Export mogelijkheden voor rapportage

---

## Benodigdheden

- **[Node.js](https://nodejs.org/)** v18 of hoger
- **[MySQL](https://dev.mysql.com/downloads/mysql/)** v8.0 of hoger
- **Sakila Database** (meegeleverd in `/Database/sakila.sql`)
- **Git** voor version control
- Code editor zoals **[VS Code](https://code.visualstudio.com/)**

---

## Installatie

### 1. Project Setup
```bash
# Clone het project
git clone https://github.com/karim076/Weektaken-LU-1.git
cd Weektaak-1/sakila-app

# Installeer dependencies
npm install
```

### 2. Database Setup
```sql
-- Importeer de Sakila database in MySQL
-- Bestand: Database/sakila.sql
mysql -u root -p < Database/sakila.sql
```

### 3. Environment Configuratie
Maak een `.env` bestand in de root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=jouw-mysql-wachtwoord
DB_NAME=sakila
DB_PORT=3306

# Application Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=jouw-geheime-jwt-sleutel
JWT_EXPIRES_IN=24h
```

### 4. Start de Applicatie
```bash
# Development mode (met auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Open in Browser
🌐 **http://localhost:3000**

### 6. Test Accounts
De applicatie bevat vooraf geconfigureerde test accounts:
- **Staff**: `staff2` / `admin123`

---

## Projectstructuur

```
sakila-app/
├── 📁 src/
│   ├── 📁 config/          # Database configuratie
│   ├── 📁 controllers/     # Request handlers (MVC)
│   │   ├── AuthController.js
│   │   ├── CustomerController.js
│   │   ├── FilmController.js
│   │   ├── HomeController.js
│   │   └── StaffController.js
│   ├── 📁 dao/            # Data Access Objects
│   │   ├── BaseDAO.js
│   │   ├── CustomerDAO.js
│   │   ├── FilmDAO.js
│   │   ├── RentalDAO.js
│   │   └── UserDAO.js
│   ├── 📁 services/       # Logic Layer
│   │   ├── AuthService.js
│   │   ├── CustomerService.js
│   │   ├── FilmService.js
│   │   └── RentalService.js
│   ├── 📁 routes/         # Express routing
│   │   ├── customer.js
│   │   ├── films.js
│   │   └── staff.js
│   ├── 📁 middleware/     # Custom middleware
│   │   ├── auth.js        # Authentication & authorization
│   │   └── error.js       # Error handling
│   ├── 📁 views/          # EJS templates
│   │   ├── 📁 customer/   # Customer views
│   │   ├── 📁 staff/      # Staff views
│   │   ├── 📁 partials/   # Reusable components
│   │   ├── dashboard.ejs
│   │   ├── films.ejs
│   │   ├── home.ejs
│   │   └── login.ejs
│   ├── 📁 public/         # Static assets
│   │   ├── 📁 css/        # Stylesheets
│   │   ├── 📁 js/         # Client-side JavaScript
│   │   └── 📁 images/     # Images
│   └── 📁 utils/          # Utility functions
├── 📁 Database/           # Database files
│   └── sakila.sql
├── 📁 Images/            # README screenshots
├── app.js                # Main application entry
├── package.json          # NPM configuration
└── README.md            # Project documentation
```

---

## Routes

### Public Routes
- `GET /` - Homepage met populaire films
- `GET /films` - Film catalogus met zoek/filter
- `GET /films/:id` - Film details
- `GET /login` - Login pagina
- `GET /register` - Registratie pagina

### Customer Routes (Authenticatie vereist)
- `GET /dashboard` - Persoonlijk dashboard
- `POST /films/:id/rent` - Film huren
- `PUT /customer/profile` - Profiel bijwerken
- `GET /customer/rentals` - Verhuurgeschiedenis

### Staff Routes (Staff authenticatie vereist)
- `GET /staff/dashboard` - Staff dashboard
- `GET /staff/customers` - Klantenbeheer
- `POST /staff/customers` - Nieuwe klant aanmaken
- `GET /staff/customers/:id` - Klant details
- `PUT /staff/customers/:id` - Klant bewerken
- `POST /staff/rental-management/checkout` - Verhuur verwerken
- `POST /staff/rental-management/checkin` - Retour verwerken

### API Endpoints
- `GET /api/cities` - Steden voor formulieren
- `GET /customer/rentals-data` - Persoonlijke verhuurdata
- `GET /customer/profile-data` - Profiel data

---

##  Screenshots

### Homepage
![Homepage](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/homepage.png?raw=true)
### Filmspage
![Filmspage](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Films-pagina?raw=true)

### Klanten
#### Klanten Dashboard Overzicht
![Klanten Dashboard](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Klanten-Dashboard-Overzicht.png?raw=true)

#### Klanten Dashboard Profiel
![Klanten Dashboard Profiel](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Klanten-Profile-Dashboard.png?raw=true)

#### Klanten Verhuur Overzicht
![Klanten Verhuur Overzicht](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Snelle-verhuur-dashboard.png?raw=true)

### Staff
#### Staff Dashboard Overzicht
![Staff Dashboard](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Staff-dashboard.png?raw=true)

### Staff Klanten Beheer  
![Klanten](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Klanten.png?raw=true)

#### Staff Snelle verhuur
![Snelle verhuur](https://github.com/karim076/Weektaken-LU-1/blob/main/Images/Snelle-verhuur-dashboard.png?raw=true)
---

## Randvoorwaarden

**RV-01: JavaScript en MySQL gebruiken**  
*Beschrijving: Geen TypeScript, geen SqlServer*  
**Status: Voldaan** - Pure JavaScript met MySQL/Sakila database

**RV-02: Server-side rendering**  
*Beschrijving: Webapplicatie rendert pages server-side, geen clientside frontend*  
**Status: Voldaan** - EJS templates met server-side rendering

**RV-03: Bewezen CSS framework gebruiken**  
*Beschrijving: Bootstrap of vergelijkbaar voor layout en styling*  
**Status: Voldaan** - Bootstrap 5.3.0 met custom CSS

**RV-04: Open source technologieën**  
*Beschrijving: Waar mogelijk open source gebruiken*  
**Status: Voldaan** - Node.js, Express, MySQL, Bootstrap (alle open source)

**RV-05: Geen Object Relational Mapper**  
*Beschrijving: SQL queries uitgeschreven en uitgevoerd via npm package*  
**Status: Voldaan** - Raw SQL queries via mysql2 package

**RV-06: Alleen callbackfuncties gebruiken**  
*Beschrijving: Geen async/await of Promises; volledig callback-based*  
**Status: Voldaan** - Complete callback architecture, geen async/await patterns

---

## Non-Functional Requirements

**NF-01: Modulariteit (Layered Architecture)**  
*Beschrijving: Gelaagde architectuur; routes communiceren via services/DAOs*  
**Status: Voldaan**
- Controllers → Services → DAOs → Database
- Strikte scheiding van verantwoordelijkheden
- Geen database logica in views of controllers

**NF-02: Onderhoudbaarheid (DRY Principle)**  
*Beschrijving: Geen duplicatie van code, herbruikbare modules*  
**Status: Voldaan**
- BaseDAO voor gemeenschappelijke database operaties
- Herbruikbare middleware (auth, error handling)
- Modulaire service en controller structuur

**NF-03: Gebruiksvriendelijkheid**  
*Beschrijving: Logische toegang tot functionaliteit*  
**Status: Voldaan**
- Intuïtieve navigatie met responsive navbar
- Overzichtelijke dashboards per gebruikerstype
- Duidelijke error messages en success feedback
- Mobile-first responsive design

**NF-04: Beveiliging**  
*Beschrijving: Veilige authenticatie en autorisatie*  
**Status: Voldaan**
- JWT-based authentication
- Role-based access control (Customer/Staff)
- Wachtwoord hashing met bcrypt
- Input validatie en SQL injection preventie

**NF-05: Performance**  
*Beschrijving: Efficiënte database operaties*  
**Status: Voldaan**
- Database connection pooling
- Paginering voor grote datasets
- Optimized SQL queries
- Callback-based asynchrone operaties

---

## Testing

### Manual Testing
- **Functionaliteit**: Alle user stories getest en werkend
- **Responsive Design**: Getest op verschillende schermformaten
- **Cross-browser**: Chrome, Firefox, Safari compatibility
- **Error Handling**: Graceful degradation bij fouten

### Database Testing
- **Connectie**: Stabiele database verbinding
- **CRUD Operaties**: Alle database operaties functioneel
- **Data Integriteit**: Referentiële integriteit behouden

---

## Deployment

### Development
```bash
npm run dev  # Nodemon met auto-reload
```

### Production
```bash
npm start    # Standard Node.js server
```

### Environment Variables
Zie `.env.example` voor complete configuratie.

---
## Team

**Ontwikkelaar**: Karim  
**Project**: Weektaak-1 - Sakila App  
**Periode**: 2025  
**Repository**: [Weektaken-LU-1](https://github.com/karim076/Weektaken-LU-1)

---

