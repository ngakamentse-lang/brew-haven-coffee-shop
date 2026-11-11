
// ========================================
// BREW HAVEN - REDIS CONNECTION
// ========================================

const { createClient } = require('redis')
require('dotenv').config()

// CREATE REDIS CLIENT
const redisClient = createClient({
  url: process.env.REDIS_URL
})

// HANDLE REDIS ERRORS
redisClient.on('error', (error) => {
  console.log('Redis Error:', error)
})

// CONFIRM CONNECTION
redisClient.on('connect', () => {
  console.log('Connecting to Redis...')
})

redisClient.on('ready', () => {
  console.log('Brew Haven Redis connected successfully!')
})
// CONNECT TO REDIS
async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

// EXPORT REDIS CLIENT AND CONNECTION FUNCTION
module.exports = {
  redisClient,
  connectRedis
}
// CONNECT TO REDIS
async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

// EXPORT REDIS CLIENT AND CONNECTION FUNCTION
module.exports = {
  redisClient,
  connectRedis
}