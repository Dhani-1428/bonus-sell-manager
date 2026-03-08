/**
 * Server-side authentication utilities
 * Handles password hashing, session management, and user verification
 */

import { getPool, queryOne } from './db'
import crypto from 'crypto'

/**
 * Hash password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const pool = getPool()
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, email, password, created_at, subscription_status, trial_start_date, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    ) as any[]
    return rows.length > 0 ? rows[0] : null
  } catch (error: any) {
    console.error('Error getting user by email:', error)
    if (error.message && error.message.includes("doesn't exist")) {
      console.error(`⚠️  Table doesn't exist. Please initialize database schema at /api/db/init`)
    }
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const pool = getPool()
  const connection = await pool.getConnection()
  try {
    // Try to get user with all columns including trial_expiration_email_sent
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, password, created_at, subscription_status, trial_start_date, trial_expiration_email_sent, role FROM users WHERE id = ?',
        [userId]
      ) as any[]
      return rows.length > 0 ? rows[0] : null
    } catch (error: any) {
      // If column doesn't exist, try without it
      if (error.message && error.message.includes("trial_expiration_email_sent")) {
        console.warn('⚠️  trial_expiration_email_sent column not found, using fallback query. Run /api/db/init to add the column.')
        const [rows] = await connection.execute(
          'SELECT id, name, email, password, created_at, subscription_status, trial_start_date, role FROM users WHERE id = ?',
          [userId]
        ) as any[]
        if (rows.length > 0) {
          // Set default value for missing column
          rows[0].trial_expiration_email_sent = false
          return rows[0]
        }
        return null
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error getting user by ID:', error)
    if (error.message && error.message.includes("doesn't exist")) {
      console.error(`⚠️  Table doesn't exist. Please initialize database schema at /api/db/init`)
    }
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Create a new user
 */
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<{ id: string; name: string; email: string }> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Check if user already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      throw new Error('An account with this email already exists.')
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = hashPassword(password)
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // Insert user
    await connection.execute(
      `INSERT INTO users (
        id, 
        name, 
        email, 
        password, 
        created_at, 
        trial_start_date, 
        subscription_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email.toLowerCase(), hashedPassword, createdAt, createdAt, 'trial']
    )

    // Initialize restaurant settings
    await connection.execute(
      `INSERT INTO restaurant_settings (user_id, name)
       VALUES (?, ?)`,
      [userId, name]
    )

    await connection.commit()

    return {
      id: userId,
      name,
      email: email.toLowerCase(),
    }
  } catch (error: any) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Verify user credentials
 */
export async function verifyUser(
  email: string,
  password: string
): Promise<{ id: string; name: string; email: string; role?: string } | null> {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }

  if (!verifyPassword(password, user.password)) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
  }
}
