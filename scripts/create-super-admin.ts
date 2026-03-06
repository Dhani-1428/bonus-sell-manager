/**
 * Script to create the first super admin
 * Run with: pnpm tsx scripts/create-super-admin.ts
 */

import { createSuperAdmin } from '../lib/admin-auth';
import { closePool } from '../lib/db';

async function main() {
  console.log('Creating super admin...\n');
  
  // Get credentials from environment or prompt
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@bonusfoodsellmanager.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  
  try {
    const admin = await createSuperAdmin(name, email, password);
    console.log('\n✅ Super admin created successfully!');
    console.log('\nCredentials:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ${admin.id}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
  } catch (error: any) {
    console.error('\n❌ Failed to create super admin:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\nSuper admin with this email already exists.');
      console.log('To create a new one, use a different email.');
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

main().catch(console.error);
