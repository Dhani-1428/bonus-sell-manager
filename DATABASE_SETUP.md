# Database Setup Guide

This application uses MySQL database hosted on AWS RDS. Follow these steps to set up the database connection.

## 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Database Configuration
DB_HOST=foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=foodsell_manager
DB_USER=bfsmanager
DB_PASSWORD=Dhani1428
DB_SSL=true

# Optional: SSL Certificate Path (if using certificate file)
# DB_SSL_CERT_PATH=/certs/global-bundle.pem
```

## 2. Database Connection

The database connection is configured in `lib/db.ts` and uses a connection pool for efficient database access.

### Connection Details:
- **Host**: `foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com`
- **Port**: `3306`
- **Database**: `foodsell_manager`
- **User**: `bfsmanager`
- **SSL**: Enabled (with `rejectUnauthorized: false` for development)

## 3. Database Schema

The database schema is automatically initialized when you call `initializeSchema()` from `lib/db-schema.ts`.

### Tables Created:
- **users**: User accounts and subscription information
- **menu_items**: Menu items for each user
- **orders**: Order records
- **restaurant_settings**: Restaurant information (name, address, contact)

## 4. Testing Database Connection

You can test the database connection by calling:

```bash
# Via API endpoint
curl http://localhost:3000/api/db/test

# Or in your code
import { testConnection } from '@/lib/db';
const isConnected = await testConnection();
```

## 5. Using the Database

### Basic Query Example:

```typescript
import { query, queryOne } from '@/lib/db';

// Get all users
const users = await query('SELECT * FROM users');

// Get single user
const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);

// Insert data
await query(
  'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
  [userId, name, email]
);
```

### Transaction Example:

```typescript
import { transaction } from '@/lib/db';

await transaction(async (connection) => {
  await connection.execute('INSERT INTO users ...');
  await connection.execute('INSERT INTO menu_items ...');
  // Both queries will be committed together or rolled back on error
});
```

## 6. SSL Certificate (Optional)

If you have an SSL certificate file (`global-bundle.pem`), you can:

1. Place it in a secure location (e.g., `/certs/global-bundle.pem`)
2. Set `DB_SSL_CERT_PATH=/certs/global-bundle.pem` in your environment variables
3. The connection will automatically use the certificate

## 7. Production Deployment

For production deployment (e.g., Vercel):

1. Add all database environment variables to your hosting platform
2. Ensure SSL is properly configured
3. Consider using environment-specific database credentials
4. Set up connection pooling limits based on your hosting platform

## 8. Database Functions Available

- `getPool()`: Get the database connection pool
- `query<T>(sql, params)`: Execute a query and return results
- `queryOne<T>(sql, params)`: Execute a query and return the first result
- `transaction(callback)`: Execute queries within a transaction
- `testConnection()`: Test the database connection
- `closePool()`: Close all database connections

## 9. Migration from localStorage

The application currently uses localStorage for data storage. To migrate to the database:

1. Initialize the database schema
2. Create migration scripts to move data from localStorage to database
3. Update `lib/store.ts` to use database queries instead of localStorage
4. Test thoroughly before deploying
