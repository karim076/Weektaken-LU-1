# Azure Environment Variables Setup Script
# Replace 'your-app-name' and 'your-resource-group' with your actual values

APP_NAME="your-app-name"
RESOURCE_GROUP="your-resource-group"

# Database Configuration
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings \
  DB_HOST="db-mysql-ams3-46626-do-user-8155278-0.b.db.ondigitalocean.com" \
  DB_USER="2227978" \
  DB_PASSWORD="secret" \
  DB_NAME="2227978" \
  DB_PORT="25060"

# Application Configuration  
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings \
  NODE_ENV="production" \
  PORT="8080"

# Security Configuration
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings \
  JWT_SECRET="dfab3a8a7f008057b573b8e49719c4a7a093e55df5e88bc6620fe93a78794167" \
  JWT_EXPIRES_IN="15m" \
  SESSION_SECRET="your-session-secret-key-change-this-too"
