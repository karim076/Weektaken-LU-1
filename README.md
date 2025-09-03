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
- [Randvoorwaarden](#-randvoorwaarden (requirements))
- [Non-Functional Requirements](#-Non-FunctionalRequirements)

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

# 📽️ Sakila Applicatie – Epics & User Stories

Dit document bevat de epics, user stories en acceptatiecriteria voor de Node.js/Express applicatie gebaseerd op de **Sakila-database**.  
De applicatie ondersteunt drie perspectieven (viewpoints): **Staff**, **Huurder (klant)** en **Eigenaar (admin)**.  

---

## 👩‍💼 Staff (Medewerker)

### Epic 1: Klantenbeheer
**US1E1 - User Story 1 (Must)**  
Als medewerker wil ik een nieuwe klant kunnen registreren, zodat ik hem of haar kan toevoegen aan het systeem en films kan verhuren.  
**Acceptatiecriteria:**  
- Er is een formulier met verplichte velden: naam, adres, e-mail, telefoonnummer.  
- Wanneer verplichte velden ontbreken, verschijnt een foutmelding.  
- Na succesvolle invoer verschijnt de klant in het klantenoverzicht.  

** US2E1 - User Story 2 (Must)**  
Als medewerker wil ik klantgegevens kunnen inzien, zodat ik snel toegang heb tot relevante informatie bij vragen of transacties.  
**Acceptatiecriteria:**  
- Er is een klantenoverzicht met basisgegevens (naam, e-mail, status).  
- Ik kan op een klant klikken om details te zien.  
- De data komt rechtstreeks uit de database.  

** US3E1 - User Story 3 (Should)**  
Als medewerker wil ik klantgegevens kunnen bewerken, zodat ik fouten kan corrigeren of updates kan verwerken.  
**Acceptatiecriteria:**  
- Er is een bewerk-knop bij elke klant.  
- Wijzigingen worden gecontroleerd op geldige invoer.  
- De wijziging is direct zichtbaar in het overzicht.  

** US4E1 - User Story 4 (Could)**  
Als medewerker wil ik een klant kunnen verwijderen, zodat oude of inactieve klanten niet in de database blijven staan.  
**Acceptatiecriteria:**  
- Er is een delete-knop.  
- Er verschijnt een bevestigingspopup.  
- Na verwijderen wordt de klant niet meer in het overzicht getoond.  

---

### Epic 2: Verhuurbeheer
** US1E2 - User Story 1 (Must)**  
Als medewerker wil ik een film aan een klant kunnen verhuren, zodat de transactie geregistreerd wordt in het systeem.  
**Acceptatiecriteria:**  
- Ik kan een klant selecteren.  
- Ik kan een beschikbare film selecteren.  
- De verhuur wordt opgeslagen met datum en medewerker.  

** US2E2 - User Story 2 (Should)**  
Als medewerker wil ik een lopende huur kunnen beëindigen, zodat de film terug beschikbaar is voor verhuur.  
**Acceptatiecriteria:**  
- Bij elke lopende huur is een "retourneer"-knop beschikbaar.  
- Na klikken wordt de huurstatus aangepast naar "afgesloten".  
- De film verschijnt opnieuw in de lijst met beschikbare films.  

---

## 🎬 Huurder (Klant)

### Epic 3: Films ontdekken
** US1E3 - User Story 1 (Must)**  
Als huurder wil ik een overzicht van beschikbare films kunnen bekijken, zodat ik weet welke films ik kan huren.  
**Acceptatiecriteria:**  
- Films worden getoond in een lijst of tabel met titel, genre en speelduur.  
- Alleen beschikbare films worden getoond.  
- Data wordt direct uit de database geladen.  

** US2E3 - User Story 2 (Should)**  
Als huurder wil ik films kunnen zoeken of filteren, zodat ik sneller de juiste film vind.  
**Acceptatiecriteria:**  
- Er is een zoekveld (minimaal op titel).  
- Resultaten worden gefilterd zodra ik zoek.  
- Filters zoals genre of jaar zijn optioneel beschikbaar.  

---

### Epic 4: Mijn verhuurgeschiedenis
** US1E4 - User Story 1 (Must)**  
Als huurder wil ik mijn huurgeschiedenis kunnen inzien, zodat ik overzicht heb van de films die ik eerder heb gehuurd.  
**Acceptatiecriteria:**  
- Er is een overzicht van mijn persoonlijke gehuurde films.  
- Per film staat huur- en retourdatum vermeld.  
- Alleen mijn eigen transacties worden getoond.  

** US2E4 - User Story 2 (Could)**  
Als huurder wil ik favoriete films kunnen opslaan, zodat ik ze later eenvoudig kan terugvinden.  
**Acceptatiecriteria:**  
- Er is een "favoriet"-knop bij films.  
- Favorieten worden opgeslagen in mijn profiel.  
- Ik kan mijn favorietenlijst apart bekijken.  

---

## 🏢 Eigenaar (Admin)

### Epic 5: Medewerkersbeheer
** US1E5 - User Story 1 (Must)**  
Als eigenaar wil ik nieuwe medewerkers kunnen toevoegen, zodat zij klanten kunnen helpen en films kunnen verhuren.  
**Acceptatiecriteria:**  
- Er is een formulier voor medewerkergegevens (naam, gebruikersnaam, filiaal).  
- Alle verplichte velden zijn gevalideerd.  
- De medewerker verschijnt na opslaan in het overzicht.  

** US2E5 - User Story 2 (Must)**  
Als eigenaar wil ik een overzicht van alle medewerkers kunnen bekijken, zodat ik inzicht heb in wie er werkzaam zijn.  
**Acceptatiecriteria:**  
- Er is een tabel met alle medewerkers.  
- Per medewerker zijn naam, filiaal en status zichtbaar.  
- De data komt uit de database.  

** US3E4 - User Story 3 (Should)**  
Als eigenaar wil ik medewerkers kunnen verwijderen, zodat ik alleen actuele medewerkers in het systeem houd.  
**Acceptatiecriteria:**  
- Bij elke medewerker staat een delete-knop.  
- Er verschijnt een bevestigingspopup.  
- Na verwijderen verdwijnt de medewerker uit het overzicht.  

---

### Epic 6: Filmbeheer
** US1E6 - User Story 1 (Must)**  
Als eigenaar wil ik nieuwe films kunnen toevoegen, zodat de collectie up-to-date blijft.  
**Acceptatiecriteria:**  
- Er is een formulier voor titel, genre, speelduur en taal.  
- Verplichte velden worden gecontroleerd.  
- De film verschijnt na opslaan in het overzicht.  

** US2E6 - User Story 2 (Should)**  
Als eigenaar wil ik bestaande films kunnen bewerken, zodat ik foutieve gegevens kan corrigeren.  
**Acceptatiecriteria:**  
- Bij elke film staat een edit-knop.  
- Wijzigingen worden gecontroleerd en opgeslagen.  
- Het overzicht toont direct de bijgewerkte gegevens.  

** US3E6 - User Story 3 (Could)**  
Als eigenaar wil ik films kunnen verwijderen, zodat oude of irrelevante titels uit de database verdwijnen.  
**Acceptatiecriteria:**  
- Er is een delete-knop per film.  
- Ik krijg een bevestiging voordat de film verdwijnt.  
- De film verdwijnt definitief uit het overzicht.  

---
