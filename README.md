# 🎬 Sakila App

Een Node.js + Express applicatie die verbinding maakt met de [Sakila MySQL database](https://dev.mysql.com/doc/sakila/en/) en gegevens overzichtelijk weergeeft in de browser met behulp van **Bootstrap** en **EJS**.

## 📌 Inhoud
- [Overzicht](#-overzicht)
- [Benodigdheden](#-benodigdheden)
- [Installatie](#-installatie)
- [Projectstructuur](#-projectstructuur)
- [Gebruik](#-gebruik)
- [Functionaliteiten](#-functionaliteiten)
- [Screenshots](#-screenshots)
- [Toekomstige uitbreidingen](#-toekomstige-uitbreidingen)

---

## 🚀 Overzicht
De applicatie demonstreert hoe je een Node.js-project opzet, koppelt met MySQL en data uit de **Sakila-database** toont in de browser.  
Voor deze weektaak ligt de focus op:
1. Basis projectstructuur met **Node.js**, **Express** en **Bootstrap**.
2. Succesvolle verbinding met de **Sakila database**.
3. Ophalen en weergeven van een dataset (customers) in een overzichtelijke tabel (met limit 50).

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
```
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'jouw-wachtwoord',
  database: 'sakila'
});
```
4. **Start de applicatie**
Voor development (met automatische reload):
```npm run dev```
Voor normaal gebruik:
```npm start```
Open in de browser
👉 http://localhost:3000
