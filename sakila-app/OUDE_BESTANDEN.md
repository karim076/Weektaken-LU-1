# VEROUDERD: Dit bestand is vervangen door src/config/database.js

Het oude db.js bestand is vervangen door de nieuwe gestructureerde database configuratie in `src/config/database.js` die:

- Connection pooling gebruikt
- Betere error handling heeft  
- Graceful shutdown ondersteunt
- Singleton pattern implementeert

Gebruik nu: `const databaseConfig = require('./src/config/database');`
