/**
 * Google OAuth authentication utilities
 * Handles Google user authentication and user creation/retrieval
 */

import { getPool } from './db';
import { hashPassword } from './auth-server';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Find or create user by Google ID
 */
export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string,
  avatar?: string
): Promise<GoogleUser> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // First, try to find user by googleId
    let [rows] = await connection.execute(
      'SELECT id, name, email, avatar FROM users WHERE google_id = ?',
      [googleId]
    ) as any[];

    if (rows.length > 0) {
      // User exists, update avatar if provided
      if (avatar && avatar !== rows[0].avatar) {
        await connection.execute(
          'UPDATE users SET avatar = ? WHERE google_id = ?',
          [avatar, googleId]
        );
        rows[0].avatar = avatar;
      }
      await connection.commit();
      return {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        avatar: rows[0].avatar || avatar,
      };
    }

    // Try to find user by email (in case they signed up with email first)
    [rows] = await connection.execute(
      'SELECT id, name, email, avatar FROM users WHERE email = ?',
      [email.toLowerCase()]
    ) as any[];

    if (rows.length > 0) {
      // User exists with email, link Google account
      await connection.execute(
        'UPDATE users SET google_id = ?, avatar = ? WHERE email = ?',
        [googleId, avatar || rows[0].avatar, email.toLowerCase()]
      );
      await connection.commit();
      return {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        avatar: avatar || rows[0].avatar,
      };
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await connection.execute(
      `INSERT INTO users (
        id, 
        name, 
        email, 
        google_id,
        avatar,
        created_at, 
        trial_start_date, 
        subscription_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email.toLowerCase(),
        googleId,
        avatar || null,
        createdAt,
        createdAt,
        'trial',
      ]
    );

    // Initialize restaurant settings
    await connection.execute(
      `INSERT INTO restaurant_settings (user_id, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = ?`,
      [userId, name, name]
    );

    await connection.commit();

    return {
      id: userId,
      name,
      email: email.toLowerCase(),
      avatar: avatar || undefined,
    };
  } catch (error: any) {
    await connection.rollback();
    console.error('Error in findOrCreateGoogleUser:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string): Promise<GoogleUser | null> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(
      'SELECT id, name, email, avatar FROM users WHERE google_id = ?',
      [googleId]
    ) as any[];

    if (rows.length === 0) {
      return null;
    }

    return {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      avatar: rows[0].avatar || undefined,
    };
  } catch (error: any) {
    console.error('Error getting user by Google ID:', error);
    throw error;
  } finally {
    connection.release();
  }
}
