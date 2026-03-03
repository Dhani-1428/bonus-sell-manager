# Security Group Configuration Required

## ✅ Good News!
The RDS instance is now **publicly accessible**! DNS resolves to public IP: `16.170.197.218`

## ⚠️ Current Issue
Port 3306 connection is timing out, which means the **security group is blocking inbound connections**.

## 🔧 Fix Required: Update Security Group

### Step 1: Find Your Security Group
1. Go to **AWS RDS Console**
2. Select your cluster: `foodsell`
3. Go to **Connectivity & security** tab
4. Note the **VPC security groups** (usually something like `sg-xxxxxxxxx`)

### Step 2: Edit Security Group Rules
1. Click on the security group ID (it's a link)
2. This opens the **EC2 Security Groups** page
3. Select the security group
4. Go to **Inbound rules** tab
5. Click **Edit inbound rules**

### Step 3: Add MySQL/Aurora Rule
Click **Add rule** and configure:

```
Type: MySQL/Aurora
Protocol: TCP
Port range: 3306
Source: My IP (or your specific IP address)
Description: Allow MySQL connections from my IP
```

**OR** for testing (less secure):
```
Type: MySQL/Aurora
Protocol: TCP
Port range: 3306
Source: 0.0.0.0/0 (allows from anywhere - USE ONLY FOR TESTING)
Description: Allow MySQL connections for testing
```

### Step 4: Save Rules
Click **Save rules**

### Step 5: Test Connection
After saving, wait 10-30 seconds for the rules to propagate, then test:

```bash
npx tsx scripts/test-db.ts
```

## 🔍 Find Your IP Address

To find your current IP address:
- Visit: https://whatismyipaddress.com/
- Or run: `curl ifconfig.me` (on Linux/Mac)
- Or run: `nslookup myip.opendns.com resolver1.opendns.com` (on Windows)

## 📋 Alternative: Use AWS Console Test

You can also test the connection from AWS Console:
1. Go to RDS → Your cluster → **Connectivity & security**
2. Click **Connectivity & security** → **Endpoint & port**
3. Try connecting using AWS RDS Query Editor or MySQL Workbench

## ✅ Expected Result

After updating the security group, you should see:
```
✅ Database connection successful!
Database version: [MySQL version]
Current database: mysql
Current user: bfsmanager@[IP]
```

## 🔒 Security Best Practice

**For production**, always:
- Use specific IP addresses instead of `0.0.0.0/0`
- Consider using AWS RDS Proxy
- Use VPN or bastion host for access
- Enable SSL/TLS encryption
- Use strong passwords
- Regularly rotate credentials
