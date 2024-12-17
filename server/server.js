const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'https://latch.netlify.app/game',
    methods: ["GET", "POST"],
    credentials: true,
  },
})

const players = {}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  // Add new player to the players object
  players[socket.id] = {
    playerId: socket.id,
    x: 400,
    y: 300,
    life: 100,
    attack: 10,
    weapon: 'sword',
    animation: 'idleDown'
  }

  // Send the current players to the new player
  socket.emit('currentPlayers', players)

  // Notify existing players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id])

  // Handle player movement
  socket.on('movePlayer', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x
      players[socket.id].y = movementData.y
      players[socket.id].animation = movementData.animation
      players[socket.id].flipX = movementData.flipX
      io.emit('playerMoved', players[socket.id])
    }
  })

  // Handle player attack
  socket.on('attackPlayer', (targetId) => {
    if (players[socket.id] && players[targetId]) {
      players[targetId].life -= players[socket.id].attack
      // log the both players life
      console.log('Attacker:', players[socket.id].life)
      console.log('Target:', players[targetId].life)
      if (players[targetId].life <= 0) {
        io.emit('playerDefeated', targetId)
        delete players[targetId]
      } else {
        io.emit('playerAttacked', {
          attacker: socket.id,
          target: targetId,
          life: players[targetId].life,
        })
      }
    }
  })

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
    delete players[socket.id]
    io.emit('playerDisconnected', socket.id)
  })
})

httpServer.listen(3001, () => {
  console.log('Server running on port 3001')
})
