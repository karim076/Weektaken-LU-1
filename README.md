# 🎬 Sakila App

Een Node.js + Express applicatie die verbinding maakt met de [Sakila MySQL database](https://dev.mysql.com/doc/sakila/en/) en gegevens overzichtelijk weergeeft in de browser met behulp van **Bootstrap** en **EJS**.

## 📌 Inhoud
- [Overzicht](#-overzicht)
- [UserStories](#-userstories)
- [Benodigdheden](#-benodigdheden)
- [Installatie](#-installatie)
- [Projectstructuur](#-projectstructuur)
- [Routes](#-routes)
- [Functionaliteiten](#-functionaliteiten)
- [Screenshots](#-preview)
- [Randvoorwaarden](#-randvoorwaarden(requirements))
- [Non-Functional Requirements](#-non-functionalrequirements)

---

## 🚀 Overzicht
De applicatie demonstreert hoe je een Node.js-project opzet, koppelt met MySQL en data uit de **Sakila-database** toont in de browser.  
Voor deze weektaak ligt de focus op:
1. Basis projectstructuur met **Node.js**, **Express** en **Bootstrap**.
2. Succesvolle verbinding met de **Sakila database**.
3. Ophalen en weergeven van een dataset (customers) in een overzichtelijke tabel (met limit 50).

---
## 📖 UserStories

Voor deze applicatie is het gekozen viewpoint: **Customer**.  
De user stories zijn afgeleid van de requirements en geprioriteerd op must/should/could.

### Requirements & Prioritering
1. **[Must]** Klant kan een overzicht van klanten zien (max 50 rijen).  
2. **[Must]** Klant kan de homepagina bereiken en navigeren via een menu.  
3. **[Should]** Klant kan in de toekomst films en transacties bekijken.  
4. **[Could]** Klant kan zoek- en filterfunctionaliteit gebruiken.  

---

## 🛠 Benodigdheden
- [Node.js](https://nodejs.org/) (v18 of hoger aanbevolen)
- [MySQL](https://dev.mysql.com/downloads/mysql/)
- Sakila database (te importeren in MySQL, bv. via DBeaver)
- Een teksteditor, bv. [VS Code](https://code.visualstudio.com/)

---

## 📥 Installatie

1. **Clone of download dit project**  
   ```bash
   git clone https://github.com/jouw-gebruikersnaam/sakila-app.git
   cd sakila-app
2. **Installeer dependencies**

 ```npm install```

3. **Configureer databaseverbinding**
Pas in db.js je MySQL inloggegevens aan:
```bash
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'jouw-wachtwoord',
  database: 'sakila'
});
```
4. **Start de applicatie**
Voor development (met automatische reload):
```bash
npm run dev
```
Voor normaal gebruik:
```bash
npm start
```
Open in de browser
👉 http://localhost:3000

## Projectstructuur
```
sakila-app/
│── public/           # Bootstrap/CSS/JS bestanden
│── routes/           # Express routes (bv. customers)
│── views/            # EJS-templates
│   ├── home.ejs      # Home pagina
│   └── customers.ejs # Klanten pagina
│── app.js            # Main server bestand
│── db.js             # Databaseconnectie
│── package.json      # NPM configuratie
```
## Routes
- Ga naar / voor de Homepagina.
- Ga naar /customers voor een tabel met 50 klanten uit de Sakila database.

## Functionaliteiten
- Node.js + Express projectstructuur
- Verbinding met MySQL Sakila database
- Routes voor het ophalen van data
- Bootstrap styling + navigatiebalk
- Dynamische views met EJS

## Preview
### Home pagina
![alt text](https://github.com/karim076/Weektaak-1/blob/main/Images/homepage.png?raw=true)
### Klanten pagina
![alt text](https://github.com/karim076/Weektaak-1/blob/main/Images/Klanten.png?raw=true)

## 🛡️ Randvoorwaarden (Requirements)

- **RV-01: JavaScript en MySQL gebruiken**  
  Beschrijving: Geen TypeScript, geen SqlServer  
  Status: Voldaan

- **RV-02: Server-side rendering**  
  Beschrijving: De webapplicatie rendert de pages server-side, geen clientside frontend  
  Status: Voldaan

- **RV-03: Bewezen CSS framework gebruiken**  
  Beschrijving: Bootstrap of vergelijkbaar voor layout en styling  
  Status: Voldaan

- **RV-04: Open source technologieën**  
  Beschrijving: Waar mogelijk open source gebruiken  
  Status: Voldaan

- **RV-05: Geen Object Relational Mapper**  
  Beschrijving: SQL queries worden uitgeschreven en uitgevoerd via een npm package  
  Status: Voldaan

- **RV-06: Alleen callbackfuncties gebruiken**  
  Beschrijving: Geen async/await of Promises; volledig callback-based  
  Status: Voldaan

## ⚙️ Non-Functional Requirements

- **NF-01: Modulariteit**  
  Beschrijving: Gelaagde architectuur; routes communiceren alleen via db.js, views bevatten geen database-logica  
  Status: Voldaan

- **NF-02: Onderhoudbaarheid**  
  Beschrijving: DRY-principe; geen duplicatie van code, herbruikbare logica in aparte modules/functies  
  Status: Voldaan

- **NF-03: Gebruiksvriendelijkheid**  
  Beschrijving: Logische toegang tot functionaliteit; navbar aanwezig, overzichtelijke tabellen, duidelijke startpagina  
  Status: Voldaan
