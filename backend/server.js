// ========================================
// BREW HAVEN - EXPRESS BACKEND SERVER
// ========================================

const express = require('express')
const cors = require('cors')
const { randomUUID } = require('crypto')
require('dotenv').config()

// CREATE EXPRESS APPLICATION
const app = express()

// MIDDLEWARE
app.use(cors())
app.use(express.json())

// SERVER PORT
const PORT = process.env.PORT || 5000

// IMPORT COFFEE SHOP MENU
const menuItems = require('./menu')

// IMPORT REDIS CONNECTION
const { redisClient, connectRedis } = require('./redis')

// ========================================
// REDIS MENU STORAGE
// ========================================

const MENU_REDIS_KEY = 'brew-haven:menu'

// GET MENU FROM REDIS
async function getMenuItems() {

  const savedMenu = await redisClient.get(MENU_REDIS_KEY)

  if (savedMenu) {
    return JSON.parse(savedMenu)
  }

  await redisClient.set(
    MENU_REDIS_KEY,
    JSON.stringify(menuItems)
  )

  return menuItems
}

// SAVE MENU TO REDIS
async function saveMenuItems(items) {

  await redisClient.set(
    MENU_REDIS_KEY,
    JSON.stringify(items)
  )

}

// ========================================
// REDIS ORDER STORAGE
// ========================================

const ORDERS_REDIS_KEY = 'brew-haven:orders'

// GET ALL CUSTOMER ORDERS
async function getOrders() {

  const savedOrders = await redisClient.get(ORDERS_REDIS_KEY)

  if (savedOrders) {
    return JSON.parse(savedOrders)
  }

  await redisClient.set(
    ORDERS_REDIS_KEY,
    JSON.stringify([])
  )

  return []

}

// SAVE CUSTOMER ORDERS TO REDIS
async function saveOrders(orders) {

  await redisClient.set(
    ORDERS_REDIS_KEY,
    JSON.stringify(orders)
  )

}

// ========================================
// TEST ROUTE
// ========================================

app.get('/', (req, res) => {

  res.send('Welcome to Brew Haven Backend!')

})

// ========================================
// HEALTH CHECK API
// ========================================

app.get('/api/health', (req, res) => {

  res.status(200).json({
    success: true,
    message: 'Brew Haven Backend is running successfully!',
    status: 'Online',
    redis: redisClient.isReady ? 'Connected' : 'Disconnected'
  })

})

// ========================================
// GET ALL MENU ITEMS
// ========================================

app.get('/api/menu', async (req, res) => {

  try {

    const menu = await getMenuItems()

    res.status(200).json({
      success: true,
      count: menu.length,
      menu: menu
    })

  } catch (error) {

    console.error('Error retrieving menu:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu items.'
    })

  }

})

// ========================================
// GET ONE MENU ITEM
// ========================================

app.get('/api/menu/:id', async (req, res) => {

  try {

    const menu = await getMenuItems()

    const item = menu.find(
      product => product.id === req.params.id
    )

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      })
    }

    res.status(200).json({
      success: true,
      item: item
    })

  } catch (error) {

    console.error('Error retrieving menu item:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu item.'
    })

  }

})

// ========================================
// ADD NEW MENU ITEM (POST)
// ========================================

app.post('/api/menu', async (req, res) => {

  try {

    const {
      name,
      category,
      description,
      price,
      available
    } = req.body

    // VALIDATE INPUT
    if (
      typeof name !== 'string' || !name.trim() ||
      typeof category !== 'string' || !category.trim() ||
      typeof description !== 'string' ||
      !Number.isFinite(price) || price <= 0 ||
      (available !== undefined && typeof available !== 'boolean')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid menu item details.'
      })
    }

    const menu = await getMenuItems()

    // CREATE NEW MENU ITEM
    const newItem = {
      id: randomUUID(),
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price,
      available: available === undefined ? true : available
    }

    menu.push(newItem)

    await saveMenuItems(menu)

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully!',
      item: newItem
    })

  } catch (error) {

    console.error('Error adding menu item:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to add menu item.'
    })

  }

})

// ========================================
// UPDATE MENU ITEM (PUT)
// ========================================

app.put('/api/menu/:id', async (req, res) => {

  try {

    const menu = await getMenuItems()

    const item = menu.find(
      product => product.id === req.params.id
    )

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      })
    }

    const {
      name,
      category,
      description,
      price,
      available
    } = req.body

    // VALIDATE UPDATED INFORMATION
    if (
      (name !== undefined &&
        (typeof name !== 'string' || !name.trim())) ||

      (category !== undefined &&
        (typeof category !== 'string' || !category.trim())) ||

      (description !== undefined &&
        typeof description !== 'string') ||

      (price !== undefined &&
        (!Number.isFinite(price) || price <= 0)) ||

      (available !== undefined &&
        typeof available !== 'boolean')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item information.'
      })
    }

    // UPDATE ITEM DETAILS
    if (name !== undefined) item.name = name.trim()
    if (category !== undefined) item.category = category.trim()
    if (description !== undefined) item.description = description.trim()
    if (price !== undefined) item.price = price
    if (available !== undefined) item.available = available

    await saveMenuItems(menu)

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully!',
      item: item
    })

  } catch (error) {

    console.error('Error updating menu item:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update menu item.'
    })

  }

})

// ========================================
// DELETE MENU ITEM (DELETE)
// ========================================

app.delete('/api/menu/:id', async (req, res) => {

  try {

    const menu = await getMenuItems()

    const itemIndex = menu.findIndex(
      product => product.id === req.params.id
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      })
    }

    const deletedItem = menu.splice(itemIndex, 1)[0]

    await saveMenuItems(menu)

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully!',
      item: deletedItem
    })

  } catch (error) {

    console.error('Error deleting menu item:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item.'
    })

  }

})

// ========================================
// PLACE CUSTOMER ORDER (POST)
// ========================================

app.post('/api/orders', async (req, res) => {

  try {

    const {
      customerName,
      phone,
      orderType,
      specialInstructions,
      items
    } = req.body

    // VALIDATE CUSTOMER DETAILS
    if (
      typeof customerName !== 'string' ||
      !customerName.trim() ||

      typeof phone !== 'string' ||
      !phone.trim() ||

      !['Takeaway', 'Dine-in'].includes(orderType) ||

      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid customer and order details.'
      })
    }

    // GET MENU ITEMS FROM REDIS
    const menu = await getMenuItems()

    const orderItems = []

    let total = 0

    // VALIDATE AND PROCESS ORDER ITEMS
    for (const orderItem of items) {

      const { menuItemId, quantity } = orderItem

      if (
        typeof menuItemId !== 'string' ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order item or quantity.'
        })
      }

      // FIND PRODUCT IN MENU
      const product = menu.find(
        item => item.id === menuItemId
      )

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'A menu item was not found.'
        })
      }

      // CHECK PRODUCT AVAILABILITY
      if (!product.available) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable.`
        })
      }

      // CALCULATE ITEM SUBTOTAL
      const subtotal = product.price * quantity

      total += subtotal

      orderItems.push({
        menuItemId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: subtotal
      })

    }

    // GET EXISTING ORDERS
    const orders = await getOrders()

    // CREATE NEW ORDER
    const newOrder = {
      id: randomUUID(),
      orderNumber: `BH-${Date.now()}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      orderType: orderType,
      specialInstructions:
        typeof specialInstructions === 'string'
          ? specialInstructions.trim()
          : '',
      items: orderItems,
      total: total,
      status: 'Pending',
      createdAt: new Date().toISOString()
    }

    orders.push(newOrder)

    // SAVE ORDERS TO REDIS
    await saveOrders(orders)

    res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully!',
      order: newOrder
    })

  } catch (error) {

    console.error('Error placing order:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to place customer order.'
    })

  }

})

// ========================================
// GET ALL CUSTOMER ORDERS
// ========================================

app.get('/api/orders', async (req, res) => {

  try {

    const orders = await getOrders()

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders
    })

  } catch (error) {

    console.error('Error retrieving orders:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer orders.'
    })

  }

})

// ========================================
// GET ONE CUSTOMER ORDER
// ========================================

app.get('/api/orders/:id', async (req, res) => {

  try {

    const orders = await getOrders()

    const order = orders.find(
      item => item.id === req.params.id
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Customer order not found.'
      })
    }

    res.status(200).json({
      success: true,
      order: order
    })

  } catch (error) {

    console.error('Error retrieving customer order:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer order.'
    })

  }

})

// ========================================
// UPDATE CUSTOMER ORDER STATUS (PUT)
// ========================================

app.put('/api/orders/:id/status', async (req, res) => {

  try {

    const { status } = req.body

    const allowedStatuses = [
      'Pending',
      'Preparing',
      'Ready',
      'Collected'
    ]

    // VALIDATE STATUS
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status. Use Pending, Preparing, Ready or Collected.'
      })
    }

    const orders = await getOrders()

    const order = orders.find(
      item => item.id === req.params.id
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Customer order not found.'
      })
    }

    // UPDATE ORDER STATUS
    order.status = status

    // SAVE UPDATED ORDERS TO REDIS
    await saveOrders(orders)

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully!',
      order: order
    })

  } catch (error) {

    console.error('Error updating order status:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update order status.'
    })

  }

})

// ========================================
// DAILY SALES SUMMARY
// ========================================

app.get('/api/reports/daily', async (req, res) => {

  try {

    const orders = await getOrders()

    // GET TODAY'S DATE
    const today = new Date().toISOString().split('T')[0]

    // FILTER TODAY'S ORDERS
    const todaysOrders = orders.filter(order =>
      order.createdAt.startsWith(today)
    )

    // CALCULATE TOTAL REVENUE
    const totalRevenue = todaysOrders.reduce(
      (total, order) => total + order.total,
      0
    )

    // COUNT ORDERS BY STATUS
    const pendingOrders = todaysOrders.filter(
      order => order.status === 'Pending'
    ).length

    const preparingOrders = todaysOrders.filter(
      order => order.status === 'Preparing'
    ).length

    const readyOrders = todaysOrders.filter(
      order => order.status === 'Ready'
    ).length

    const collectedOrders = todaysOrders.filter(
      order => order.status === 'Collected'
    ).length

    // RETURN DAILY SUMMARY
    res.status(200).json({
      success: true,
      date: today,
      summary: {
        totalOrders: todaysOrders.length,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders,
        preparingOrders: preparingOrders,
        readyOrders: readyOrders,
        collectedOrders: collectedOrders
      }
    })

  } catch (error) {

    console.error('Error generating daily report:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to generate daily sales report.'
    })

  }

})

// ========================================
// REDIS CONNECTION TEST
// ========================================

app.get('/api/redis-test', async (req, res) => {

  try {

    if (!redisClient.isReady) {
      return res.status(503).json({
        success: false,
        message: 'Redis is not connected.'
      })
    }

    await redisClient.set(
      'brew-haven:test',
      'Redis is working!'
    )

    const result = await redisClient.get('brew-haven:test')

    res.status(200).json({
      success: true,
      message: 'Redis is connected successfully!',
      data: result
    })

  } catch (error) {

    console.error('Redis test error:', error)

    res.status(500).json({
      success: false,
      message: 'Redis test failed.',
      error: error.message
    })

  }

})

// ========================================
// HANDLE UNKNOWN ROUTES
// ========================================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  })

})

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {

  console.error(err)

  res.status(err.status || 500).json({
    success: false,
    message: err.status === 400
      ? 'Invalid JSON request.'
      : 'Internal server error.'
  })

})

// ========================================
// START SERVER AND CONNECT REDIS
// ========================================

async function startServer() {

  try {

    await connectRedis()

    console.log('Redis connection established!')

    // INITIALISE MENU IN REDIS
    await getMenuItems()

    console.log('Brew Haven menu loaded from Redis!')

    // INITIALISE ORDERS IN REDIS
    await getOrders()

    console.log('Brew Haven orders storage ready!')

  } catch (error) {

    console.error('Redis connection failed:', error.message)

  }

  app.listen(PORT, () => {

    console.log(`Brew Haven server running on port ${PORT}`)

  })

}

startServer()