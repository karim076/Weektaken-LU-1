# Database Setup Instructies

## Stap 1: Sakila Database Installeren
1. Download de Sakila sample database van MySQL website
2. Importeer de sakila-schema.sql en sakila-data.sql in DBeaver/MySQL Workbench

## Stap 2: Authentication Tabellen Toevoegen
Voer het volgende SQL script uit in DBeaver:

```sql
-- Voer uit: database/add_owners_and_auth.sql
```

Dit script voegt toe:
- `password` en `username` kolommen aan `customer` en `staff` tabellen
- `owners` tabel voor eigenaren
- `user_sessions` tabel voor sessie management
- `store_staff` tabel voor staff-store assignments
- `user_auth` view voor unified authentication

## Stap 3: Database Configuratie
Update je database credentials in `src/config/database.js`:

```javascript
const config = {
  host: 'localhost',
  user: 'jouw_mysql_user',
  password: 'jouw_mysql_wachtwoord',
  database: 'sakila'
};
```

## Sample Login Credentials
Na het uitvoeren van het SQL script:

**Owners:**
- Username: `owner` / Password: `owner123`
- Username: `jane_owner` / Password: `owner123`

**Staff:**
- Username: `staff1` / Password: `staff123`
- Username: `staff2` / Password: `staff123`

**Customers:**
- Username: `customer1` / Password: `customer123`
- Username: `customer2` / Password: `customer123`
