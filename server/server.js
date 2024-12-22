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

  players[socket.id] = {
    playerId: socket.id,
    x: 400,
    y: 300,
    life: 100,
    attack: 10,
    weapon: 'sword',
    animation: 'idleDown',
    lastDirection: 'Down',
    flipX: false,
    isAttacking: false,
  }

  socket.emit('currentPlayers', players)
  socket.broadcast.emit('newPlayer', players[socket.id])

  socket.on('movePlayer', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x
      players[socket.id].y = movementData.y
      players[socket.id].animation = movementData.animation
      players[socket.id].flipX = movementData.flipX
      players[socket.id].lastDirection = movementData.lastDirection
      io.emit('playerMoved', {
        ...players[socket.id],
        playerId: socket.id,
      })
    }
  })

  socket.on('attackPlayer', (data) => {
    const targetId = data.targetId
    console.log('Attack event received:', {
      attacker: socket.id,
      target: targetId,
      animation: data.animation,
    })
    if (players[socket.id] && players[targetId]) {
      players[targetId].life -= players[socket.id].attack
      players[socket.id].animation = data.animation
      players[socket.id].lastDirection = data.direction
      players[socket.id].isAttacking = true

      // After attack animation duration (roughly 400ms for 10fps, 4 frames)
      setTimeout(() => {
        if (players[socket.id]) {
          players[socket.id].isAttacking = false
          players[socket.id].animation = 'idle' + data.direction
        }
      }, 400)
      // Broadcast attack animation to ALL players including attacker
      io.emit('playerAttackAnimation', {
        attacker: socket.id,
        target: targetId,
        animation: data.animation,
        direction: data.direction,
      })

      console.log('Attack animation broadcasted')

      if (players[targetId].life <= 0) {
        players[targetId].animation = 'die'
        console.log('Player defeated:', targetId)
        io.emit('playerDefeated', targetId)
        // Give time for death animation to play before removing player
        setTimeout(() => {
          delete players[targetId]
        }, 1000)
      } else {
        io.emit('playerAttacked', {
          attacker: socket.id,
          target: targetId,
          life: players[targetId].life,
        })
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
    delete players[socket.id]
    io.emit('playerDisconnected', socket.id)
  })
})

httpServer.listen(3000, () => {
  console.log('Listening on port 3000')
})
