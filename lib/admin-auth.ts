/**
 * Super Admin authentication and authorization utilities
 */

import { getPool } from './db';
import { hashPassword, verifyPassword } from './auth-server';

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin';
  createdAt: string;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn('⚠️  isSuperAdmin called with empty userId');
    return false;
  }

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    try {
      console.log('🔍 isSuperAdmin checking user:', userId.substring(0, 20) + '...');
      const [rows] = await connection.execute(
        'SELECT id, email, role FROM users WHERE id = ?',
        [userId]
      ) as any[];
      
      if (rows.length === 0) {
        console.warn('⚠️  User not found for isSuperAdmin check:', userId.substring(0, 20) + '...');
        return false;
      }
      
      const user = rows[0];
      const isAdmin = user.role === 'super_admin';
      console.log('✅ isSuperAdmin result:', {
        userId: userId.substring(0, 20) + '...',
        email: user.email,
        role: user.role,
        isSuperAdmin: isAdmin
      });
      
      return isAdmin;
    } catch (error: any) {
      // If role column doesn't exist, user is not a super admin
      if (error.message && error.message.includes("Unknown column 'role'")) {
        console.warn('⚠️  Role column not found. Run /api/db/migrate-role to add it.');
        return false;
      }
      console.error('❌ Error in isSuperAdmin query:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error checking super admin status:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Get super admin by email
 */
export async function getSuperAdminByEmail(email: string): Promise<SuperAdmin | null> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, created_at FROM users WHERE email = ? AND role = ?',
        [email.toLowerCase(), 'super_admin']
      ) as any[];
      
      if (rows.length === 0) return null;
      
      return {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: 'super_admin',
        createdAt: rows[0].created_at,
      };
    } catch (error: any) {
      // If role column doesn't exist, no super admins exist yet
      if (error.message && error.message.includes("Unknown column 'role'")) {
        console.warn('⚠️  Role column not found. Run /api/db/migrate-role to add it.');
        return null;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error getting super admin:', error);
    return null;
  } finally {
    connection.release();
  }
}

/**
 * Verify super admin credentials
 */
export async function verifySuperAdmin(
  email: string,
  password: string
): Promise<SuperAdmin | null> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('🔐 Verifying super admin:', email.toLowerCase());
    
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, password, role, created_at FROM users WHERE email = ? AND role = ?',
        [email.toLowerCase(), 'super_admin']
      ) as any[];
      
      console.log('📊 Found super admin records:', rows.length);
      
      if (rows.length === 0) {
        console.log('❌ No super admin found with email:', email);
        return null;
      }
      
      const user = rows[0];
      console.log('✅ Found super admin:', user.email, 'Role:', user.role);
      
      if (!user.password) {
        console.log('❌ Super admin has no password set');
        return null;
      }
      
      const isValid = verifyPassword(password, user.password);
      console.log('🔑 Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
      
      if (!isValid) {
        return null;
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'super_admin',
        createdAt: user.created_at,
      };
    } catch (error: any) {
      // If role column doesn't exist, no super admins exist yet
      if (error.message && error.message.includes("Unknown column 'role'")) {
        console.warn('⚠️  Role column not found. Run /api/db/migrate-role to add it.');
        return null;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error verifying super admin:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return null;
  } finally {
    connection.release();
  }
}

/**
 * Create super admin user
 */
export async function createSuperAdmin(
  name: string,
  email: string,
  password: string
): Promise<SuperAdmin> {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if super admin already exists
    const existing = await getSuperAdminByEmail(email);
    if (existing) {
      throw new Error('Super admin with this email already exists.');
    }
    
    // Generate user ID
    const userId = `super_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = hashPassword(password);
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Insert super admin
    await connection.execute(
      `INSERT INTO users (
        id, 
        name, 
        email, 
        password, 
        created_at, 
        role,
        subscription_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email.toLowerCase(), hashedPassword, createdAt, 'super_admin', 'active']
    );
    
    await connection.commit();
    
    return {
      id: userId,
      name,
      email: email.toLowerCase(),
      role: 'super_admin',
      createdAt,
    };
  } catch (error: any) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get all super admins
 */
export async function getAllSuperAdmins(): Promise<SuperAdmin[]> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
        ['super_admin']
      ) as any[];
      
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: 'super_admin' as const,
        createdAt: row.created_at,
      }));
    } catch (error: any) {
      // If role column doesn't exist, no super admins exist yet
      if (error.message && error.message.includes("Unknown column 'role'")) {
        console.warn('⚠️  Role column not found. Run /api/db/migrate-role to add it.');
        return [];
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error getting super admins:', error);
    return [];
  } finally {
    connection.release();
  }
}
