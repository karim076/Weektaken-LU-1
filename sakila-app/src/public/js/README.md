# Dashboard JavaScript Modules

Dit document beschrijft de gerefactorde JavaScript modules voor het dashboard systeem.

## Module Overzicht

### 1. `toast-notifications.js`
**Doel**: Toast notificatie systeem voor gebruikersfeedback
**Functies**:
- `showToast(type, title, message)` - Hoofdfunctie voor toast weergave
- `createToastContainer()` - Maakt toast container aan
- `showSuccessToast(message)` - Utility voor success berichten
- `showErrorToast(message)` - Utility voor error berichten
- `showWarningToast(message)` - Utility voor warning berichten
- `showInfoToast(message)` - Utility voor info berichten

**Gebruik**:
```javascript
showToast('success', 'Gelukt!', 'Actie succesvol uitgevoerd');
showErrorToast('Er is een fout opgetreden');
```

### 2. `dashboard-navigation.js`
**Doel**: Navigatie tussen dashboard secties en URL hash routing
**Functies**:
- Sectie navigatie (dashboard, rentals, profile)
- URL hash management
- Browser back/forward button support
- Auto-loading van content per sectie

**Features**:
- Deep linking via URL hash (#rentals, #profile)
- Lazy loading van sectie content
- Active state management voor navigatie

### 3. `rental-manager.js`
**Doel**: Verhuur data loading en rendering
**Functies**:
- `loadRentalsContent()` - Laadt verhuur data van server
- `renderRentalsContent(rentals, stats, container)` - Rendert verhuur overzicht
- `generateRentalCard(rental)` - Genereert individuele verhuur kaart
- `generateRentalActions(rental, filmTitle, totalAmount)` - Actie dropdown menu
- `generatePendingAlert(rentalId, totalAmount)` - Betaling alert
- `getStatusBadge(status)` - Status badge HTML
- `reloadRentalsContent()` - Utility voor herlaad functionaliteit

**Status Types**:
- `pending` - Te betalen (geel)
- `paid` - Betaald (groen)
- `rented` - Actief gehuurd (blauw)
- `returned` - Voltooid (info)

### 4. `rental-actions.js`
**Doel**: Verhuur acties (betalen, annuleren, inleveren, verlengen)
**Functies**:
- `payRental(rentalId, amount)` - Betaal verhuur
- `cancelRental(rentalId, filmTitle)` - Annuleer verhuur
- `returnRental(rentalId, filmTitle)` - Lever verhuur in
- `extendRental(rentalId, filmTitle)` - Verleng verhuur

**Features**:
- Bevestigingsdialogen voor alle acties
- Automatische content refresh na actie
- Error handling met toast notificaties

### 5. `profile-manager.js`
**Doel**: Gebruikersprofiel beheer
**Functies**:
- `loadProfileContent()` - Laadt profiel data van server
- `renderProfileContent(customer, container)` - Rendert profiel formulier
- `updateProfile()` - Update profiel informatie
- `changePassword()` - Wijzig wachtwoord

**Formulier Validatie**:
- Verplichte velden: gebruikersnaam, voornaam, achternaam, email
- Email format validatie
- Wachtwoord minimaal 6 tekens
- Wachtwoord bevestiging match

## Afhankelijkheden

### Loading Volgorde (belangrijk):
1. `toast-notifications.js` - Eerst geladen (andere modules gebruiken dit)
2. `rental-manager.js` - Rental rendering functies
3. `rental-actions.js` - Rental acties (gebruikt rental-manager functies)
4. `profile-manager.js` - Profiel functies (gebruikt toast notifications)
5. `dashboard-navigation.js` - Laatst geladen (orchestreert alles)

### Externe Afhankelijkheden:
- Bootstrap 5.3.0 (voor modals, dropdowns, toast styling)
- Bootstrap Icons (bi-* classes)

## API Endpoints

### Rental Endpoints:
- `GET /customer/rentals-data` - Haal verhuur data op
- `POST /customer/rentals/{id}/pay` - Betaal verhuur
- `DELETE /customer/rentals/{id}/cancel` - Annuleer verhuur
- `POST /customer/rentals/{id}/return` - Lever verhuur in
- `POST /customer/rentals/{id}/extend` - Verleng verhuur

### Profile Endpoints:
- `GET /customer/profile-data` - Haal profiel data op
- `POST /customer/profile-update` - Update profiel
- `POST /customer/change-password` - Wijzig wachtwoord

## CSS Klassen Gebruikt

### Dashboard Specifiek:
- `.sidebar`, `.nav-item-dashboard`
- `.content-section`
- `.user-profile-section`
- `.quick-action-btn`
- `.tips-section`, `.tip-item`
- `.welcome-date`

### Rental Specifiek:
- `.rental-table`, `.rental-item`
- `.rental-card`, `.rental-card-header`
- `.rentals-stats-row`
- `.rental-status`, `.rental-date`, `.rental-amount`
- `.stat-card`

### Loading States:
- `.loading-spinner-container`
- `.loading-spinner`

## Error Handling

Alle modules implementeren consistente error handling:
1. Try-catch blocks voor API calls
2. Toast notificaties voor gebruikersfeedback
3. Fallback content bij load failures
4. Console logging voor debugging

## Performance Optimalisaties

1. **Lazy Loading**: Content wordt alleen geladen wanneer nodig
2. **Caching**: Geladen content wordt gecached via dataset attributen
3. **Event Delegation**: Efficiënte event handling
4. **Minimal DOM Manipulation**: Bulk HTML updates via innerHTML

## Browser Compatibiliteit

- Modern browsers (ES6+ support vereist)
- Bootstrap 5.3.0 compatibiliteit

## Debugging

Alle modules loggen naar console met duidelijke prefixes:
- Navigation: "Navigation clicked:", "Showing section:"
- Rentals: "Loading rentals content...", "Rental data:"
- Profile: "Loading profile content...", "Profile data received:"

## Toekomstige Uitbreidingen

Modules zijn ontworpen voor eenvoudige uitbreiding:
1. Nieuwe rental statussen toevoegen in `getStatusBadge()`
2. Extra profiel velden in `renderProfileContent()`
3. Nieuwe dashboard secties in navigatie
4. Additional toast types in notification system
