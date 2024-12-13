const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: false,
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
      io.emit('playerMoved', players[socket.id])
    }
  })

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
    delete players[socket.id]
    io.emit('playerDisconnected', socket.id)
  })
})

httpServer.listen(3000, () => {
  console.log('Listening on port 3000')
})
