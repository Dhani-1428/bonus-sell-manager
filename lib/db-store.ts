/**
 * Database store functions - replaces localStorage with MySQL database
 * All user data (menu items, orders, restaurant settings) is stored in database
 */

import { getPool, query, queryOne } from './db'
import type { MenuItem, Order, RestaurantSettings } from './types'

// Menu Items
export async function getMenuItems(userId: string): Promise<MenuItem[]> {
  try {
    const items = await query<{
      id: string
      name: string
      price: number
      category: string
      extras: string | null
      created_at: Date
    }>(
      `SELECT id, name, price, category, extras, created_at 
       FROM menu_items 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    )

    return items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      extras: item.extras ? JSON.parse(item.extras) : undefined,
      createdAt: item.created_at.toISOString(),
    }))
  } catch (error) {
    console.error('Error getting menu items:', error)
    return []
  }
}

export async function saveMenuItems(userId: string, items: MenuItem[]): Promise<void> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Delete existing items
    await connection.execute('DELETE FROM menu_items WHERE user_id = ?', [userId])

    // Insert all items
    for (const item of items) {
      await connection.execute(
        `INSERT INTO menu_items (id, user_id, name, price, category, extras, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          userId,
          item.name,
          item.price,
          item.category,
          item.extras ? JSON.stringify(item.extras) : null,
          item.createdAt ? new Date(item.createdAt) : new Date(),
        ]
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    console.error('Error saving menu items:', error)
    throw error
  } finally {
    connection.release()
  }
}

export async function addMenuItem(userId: string, item: Omit<MenuItem, 'id' | 'createdAt'>): Promise<MenuItem> {
  const id = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const createdAt = new Date().toISOString()

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    console.log(`[db-store] Inserting menu item for user ${userId}:`, { id, name: item.name, price: item.price })
    await connection.execute(
      `INSERT INTO menu_items (id, user_id, name, price, category, extras, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        item.name,
        item.price,
        item.category,
        item.extras ? JSON.stringify(item.extras) : null,
        createdAt,
      ]
    )
    console.log(`[db-store] Menu item inserted successfully: ${id}`)

    return {
      ...item,
      id,
      createdAt,
    }
  } catch (error: any) {
    console.error('❌ Error adding menu item:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId,
      itemId: id,
    })
    
    // Check for foreign key constraint error
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint')) {
      console.error(`⚠️ Foreign key constraint failed. User ${userId} might not exist in users table.`)
      throw new Error(`User not found. Please log in again.`)
    }
    
    throw error
  } finally {
    connection.release()
  }
}

export async function updateMenuItem(
  userId: string,
  id: string,
  data: Partial<MenuItem>
): Promise<MenuItem | null> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.price !== undefined) {
      updates.push('price = ?')
      values.push(data.price)
    }
    if (data.category !== undefined) {
      updates.push('category = ?')
      values.push(data.category)
    }
    if (data.extras !== undefined) {
      updates.push('extras = ?')
      values.push(data.extras ? JSON.stringify(data.extras) : null)
    }

    if (updates.length === 0) {
      // Return existing item
      const item = await queryOne<{
        id: string
        name: string
        price: number
        category: string
        extras: string | null
        created_at: Date
      }>(
        `SELECT id, name, price, category, extras, created_at 
         FROM menu_items 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      )

      if (!item) return null

      return {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        extras: item.extras ? JSON.parse(item.extras) : undefined,
        createdAt: item.created_at.toISOString(),
      }
    }

    values.push(id, userId)
    await connection.execute(
      `UPDATE menu_items 
       SET ${updates.join(', ')} 
       WHERE id = ? AND user_id = ?`,
      values
    )

    // Return updated item
    const updated = await queryOne<{
      id: string
      name: string
      price: number
      category: string
      extras: string | null
      created_at: Date
    }>(
      `SELECT id, name, price, category, extras, created_at 
       FROM menu_items 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    )

    if (!updated) return null

    return {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      category: updated.category,
      extras: updated.extras ? JSON.parse(updated.extras) : undefined,
      createdAt: updated.created_at.toISOString(),
    }
  } catch (error) {
    console.error('Error updating menu item:', error)
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteMenuItem(userId: string, id: string): Promise<boolean> {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const [result] = await connection.execute(
        'DELETE FROM menu_items WHERE id = ? AND user_id = ?',
        [id, userId]
      ) as any[]

      return result.affectedRows > 0
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return false
  }
}

// Orders
export async function getOrders(userId: string): Promise<Order[]> {
  try {
    const orders = await query<{
      id: string
      order_number: string
      date: Date
      items: string
      total_amount: number
      discount_amount: number
      final_amount: number
      payment_method: string
      created_at: Date
    }>(
      `SELECT id, order_number, date, items, total_amount, discount_amount, 
              final_amount, payment_method, created_at 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY date DESC, created_at DESC`,
      [userId]
    )

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      date: order.date.toISOString(),
      items: JSON.parse(order.items),
      totalAmount: order.total_amount,
      discountAmount: order.discount_amount,
      finalAmount: order.final_amount,
      paymentMethod: order.payment_method,
      createdAt: order.created_at.toISOString(),
    }))
  } catch (error) {
    console.error('Error getting orders:', error)
    return []
  }
}

export async function saveOrders(userId: string, orders: Order[]): Promise<void> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Delete existing orders
    await connection.execute('DELETE FROM orders WHERE user_id = ?', [userId])

    // Insert all orders
    for (const order of orders) {
      await connection.execute(
        `INSERT INTO orders (
          id, user_id, order_number, date, items, total_amount, 
          discount_amount, final_amount, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          userId,
          order.orderNumber,
          new Date(order.date),
          JSON.stringify(order.items),
          order.totalAmount,
          order.discountAmount,
          order.finalAmount,
          order.paymentMethod,
          order.createdAt ? new Date(order.createdAt) : new Date(),
        ]
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    console.error('Error saving orders:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function getNextOrderNumber(userId: string): Promise<string> {
  try {
    const result = await queryOne<{ max_order: number }>(
      `SELECT COALESCE(MAX(CAST(order_number AS UNSIGNED)), 0) as max_order 
       FROM orders 
       WHERE user_id = ?`,
      [userId]
    )

    const maxOrder = result?.max_order || 0
    return String(maxOrder + 1).padStart(4, '0')
  } catch (error) {
    console.error('Error getting next order number:', error)
    return '0001'
  }
}

export async function addOrder(userId: string, order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> {
  const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const orderNumber = await getNextOrderNumber(userId)
  const createdAt = new Date().toISOString()

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    console.log(`[db-store] Inserting order for user ${userId}:`, { id, orderNumber, itemCount: order.items.length })
    await connection.execute(
      `INSERT INTO orders (
        id, user_id, order_number, date, items, total_amount, 
        discount_amount, final_amount, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        orderNumber,
        new Date(order.date),
        JSON.stringify(order.items),
        order.totalAmount,
        order.discountAmount,
        order.finalAmount,
        order.paymentMethod,
        createdAt,
      ]
    )
    console.log(`[db-store] Order inserted successfully: ${id}`)

    return {
      ...order,
      id,
      orderNumber,
      createdAt,
    }
  } catch (error: any) {
    console.error('❌ Error adding order:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId,
      orderId: id,
    })
    
    // Check for foreign key constraint error
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint')) {
      console.error(`⚠️ Foreign key constraint failed. User ${userId} might not exist in users table.`)
      throw new Error(`User not found. Please log in again.`)
    }
    
    throw error
  } finally {
    connection.release()
  }
}

export async function updateOrder(
  userId: string,
  id: string,
  data: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>
): Promise<Order | null> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const updates: string[] = []
    const values: any[] = []

    if (data.date !== undefined) {
      updates.push('date = ?')
      values.push(new Date(data.date))
    }
    if (data.items !== undefined) {
      updates.push('items = ?')
      values.push(JSON.stringify(data.items))
    }
    if (data.totalAmount !== undefined) {
      updates.push('total_amount = ?')
      values.push(data.totalAmount)
    }
    if (data.discountAmount !== undefined) {
      updates.push('discount_amount = ?')
      values.push(data.discountAmount)
    }
    if (data.finalAmount !== undefined) {
      updates.push('final_amount = ?')
      values.push(data.finalAmount)
    }
    if (data.paymentMethod !== undefined) {
      updates.push('payment_method = ?')
      values.push(data.paymentMethod)
    }

    if (updates.length === 0) {
      // Return existing order
      const order = await queryOne<{
        id: string
        order_number: string
        date: Date
        items: string
        total_amount: number
        discount_amount: number
        final_amount: number
        payment_method: string
        created_at: Date
      }>(
        `SELECT id, order_number, date, items, total_amount, discount_amount, 
                final_amount, payment_method, created_at 
         FROM orders 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      )

      if (!order) return null

      return {
        id: order.id,
        orderNumber: order.order_number,
        date: order.date.toISOString(),
        items: JSON.parse(order.items),
        totalAmount: order.total_amount,
        discountAmount: order.discount_amount,
        finalAmount: order.final_amount,
        paymentMethod: order.payment_method,
        createdAt: order.created_at.toISOString(),
      }
    }

    values.push(id, userId)
    await connection.execute(
      `UPDATE orders 
       SET ${updates.join(', ')} 
       WHERE id = ? AND user_id = ?`,
      values
    )

    // Return updated order
    const updated = await queryOne<{
      id: string
      order_number: string
      date: Date
      items: string
      total_amount: number
      discount_amount: number
      final_amount: number
      payment_method: string
      created_at: Date
    }>(
      `SELECT id, order_number, date, items, total_amount, discount_amount, 
              final_amount, payment_method, created_at 
       FROM orders 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    )

    if (!updated) return null

    return {
      id: updated.id,
      orderNumber: updated.order_number,
      date: updated.date.toISOString(),
      items: JSON.parse(updated.items),
      totalAmount: updated.total_amount,
      discountAmount: updated.discount_amount,
      finalAmount: updated.final_amount,
      paymentMethod: updated.payment_method,
      createdAt: updated.created_at.toISOString(),
    }
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteOrder(userId: string, id: string): Promise<boolean> {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      const [result] = await connection.execute(
        'DELETE FROM orders WHERE id = ? AND user_id = ?',
        [id, userId]
      ) as any[]

      return result.affectedRows > 0
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error deleting order:', error)
    return false
  }
}

// Restaurant Settings
export async function getRestaurantSettings(userId: string): Promise<RestaurantSettings | null> {
  try {
    const settings = await queryOne<{
      name: string
      address: string | null
      contact_number: string | null
    }>(
      `SELECT name, address, contact_number 
       FROM restaurant_settings 
       WHERE user_id = ?`,
      [userId]
    )

    if (!settings) return null

    return {
      name: settings.name,
      address: settings.address || '',
      contactNumber: settings.contact_number || '',
    }
  } catch (error) {
    console.error('Error getting restaurant settings:', error)
    return null
  }
}

export async function saveRestaurantSettings(userId: string, settings: RestaurantSettings): Promise<void> {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.execute(
      `INSERT INTO restaurant_settings (user_id, name, address, contact_number)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         address = VALUES(address),
         contact_number = VALUES(contact_number)`,
      [userId, settings.name, settings.address || null, settings.contactNumber || null]
    )
  } catch (error) {
    console.error('Error saving restaurant settings:', error)
    throw error
  } finally {
    connection.release()
  }
}

export async function initializeRestaurantSettings(userId: string, name: string): Promise<void> {
  const existing = await getRestaurantSettings(userId)
  if (!existing) {
    await saveRestaurantSettings(userId, {
      name,
      address: '',
      contactNumber: '',
    })
  }
}
