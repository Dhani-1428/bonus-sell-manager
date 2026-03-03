# Database Connection Test Results

## Test Status: ⚠️ Connection Timeout

The database connection test was executed but encountered a timeout error (`ETIMEDOUT`).

## Connection Details Tested:
- **Host**: `foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com`
- **Port**: `3306`
- **Database**: `mysql`
- **User**: `bfsmanager`
- **SSL**: Enabled

## Error Analysis:
The connection timeout (`ETIMEDOUT`) indicates that the connection attempt could not establish a connection to the RDS instance within the timeout period (10 seconds).

## Possible Causes:

### 1. **RDS Instance Not Publicly Accessible**
- The RDS instance might be in a private subnet
- Check RDS instance settings: **Connectivity & security** → **Publicly accessible** should be `Yes`

### 2. **Security Group Configuration**
- Security group might not allow inbound connections on port 3306
- Your current IP address might not be whitelisted
- **Action**: Check security group inbound rules and add your IP if needed

### 3. **Network/Firewall Issues**
- Local firewall might be blocking outbound connections on port 3306
- Corporate network might have restrictions
- **Action**: Verify outbound connections are allowed

### 4. **RDS Instance Status**
- Instance might be stopped or in maintenance mode
- **Action**: Verify instance status in AWS Console

## How to Fix:

### Step 1: Check RDS Instance Settings
1. Go to AWS RDS Console
2. Select your cluster: `foodsell`
3. Check **Connectivity & security** tab
4. Ensure **Publicly accessible** is set to `Yes`
5. Note the **Endpoint** matches the hostname used

### Step 2: Update Security Group
1. Go to **Security groups** in EC2 Console
2. Find the security group attached to your RDS instance
3. Edit **Inbound rules**
4. Add rule:
   - **Type**: MySQL/Aurora
   - **Port**: 3306
   - **Source**: Your IP address (or `0.0.0.0/0` for testing, but restrict in production)

### Step 3: Test Connection Again
Run the test script:
```bash
npx tsx scripts/test-db.ts
```

Or test via API endpoint (if server is running):
```bash
curl http://localhost:3000/api/db/test
```

## Alternative: Use AWS Systems Manager Session Manager

If the RDS instance is in a private subnet, you can:
1. Connect via AWS Systems Manager Session Manager
2. Use an EC2 instance in the same VPC as a bastion host
3. Use AWS RDS Proxy for connection pooling

## SSL Certificate

If SSL certificate is required:
1. Download the certificate bundle from AWS
2. Place it in a secure location
3. Set `DB_SSL_CERT_PATH` environment variable
4. Update `.env.local`:
   ```env
   DB_SSL_CERT_PATH=/path/to/global-bundle.pem
   ```

## Next Steps:

1. ✅ Database connection code is properly configured
2. ✅ Error handling and timeout settings are in place
3. ⚠️ AWS RDS configuration needs to be verified
4. ⚠️ Security group rules need to be updated
5. ⚠️ Network connectivity needs to be confirmed

Once AWS configuration is fixed, the database connection should work successfully.
