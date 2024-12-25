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
    currentScene: 'CommonScene',
    xp: 0,
    level: 1
  }

  socket.emit('currentPlayers', players)
  socket.broadcast.emit('newPlayer', players[socket.id])

  socket.on('playerInput', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x
      players[socket.id].y = data.y
      players[socket.id].animation = data.animation
      players[socket.id].flipX = data.flipX
      players[socket.id].lastDirection = data.lastDirection

      io.emit('playerMoved', {
        ...players[socket.id],
        playerId: socket.id,
      })
    }
  })

  socket.on('leaveScene', (data) => {
    console.log('Player leaving scene:', socket.id); // Debug log
    
    if (players[socket.id]) {
        // Tell other players in the current scene that this player left
        socket.to(data.from).emit('playerDisconnected', socket.id);
        
        // Update player's scene
        players[socket.id].currentScene = data.to;
        
        // Leave the old scene room and join the new one
        socket.leave(data.from);
        socket.join(data.to);
    }
  })

  socket.on('attackPlayer', (data) => {
    const targetId = data.targetId
    if (players[socket.id] && players[targetId]) {
      players[targetId].life -= players[socket.id].attack
      
      io.emit('playerAttackAnimation', {
        attacker: socket.id,
        target: targetId,
        animation: data.animation,
        direction: data.direction,
      })

      if (players[targetId].life <= 0) {
        io.emit('playerDefeated', targetId)
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

  socket.on('playerKilled', (killerInfo) => {
    const killer = players[killerInfo.killerId];
    if (killer) {
      killer.xp += 5; // 5 XP per kill
      
      // Calculate new level (every 100 XP = 1 level)
      const newLevel = Math.floor(killer.xp / 100) + 1;
      
      // Check if player leveled up
      if (newLevel > killer.level) {
        killer.level = newLevel;
        // Emit level up event
        io.to(killerInfo.killerId).emit('levelUp', {
          level: killer.level,
          xp: killer.xp
        });
      }

      // Update XP for all clients
      io.emit('xpUpdate', {
        playerId: killerInfo.killerId,
        xp: killer.xp,
        level: killer.level
      });
    }
  });

  // Send initial XP data when player joins
  socket.on('requestXPData', () => {
    socket.emit('xpUpdate', {
      playerId: socket.id,
      xp: players[socket.id].xp,
      level: players[socket.id].level
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
    delete players[socket.id]
    io.emit('playerDisconnected', socket.id)
  })
})

httpServer.listen(3000, () => {
  console.log('Listening on port 3000')
})
