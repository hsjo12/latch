// server.ts

import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { verifyNFTOwnership, mintNFT, transferNFT } from './nftService' // Assume these functions are defined

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const JWT_SECRET = process.env.JWT_SECRET

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  socket.on('playerJoinSession', (data) => {
    const { token, sessionId } = data
    const user = jwt.verify(token, JWT_SECRET)
    socket.join(sessionId)
    // Logic to handle player joining the session
  })

  socket.on('playerMove', (data) => {
    const { sessionId, playerId, position } = data
    socket.to(sessionId).emit('gameUpdate', { playerId, position })
  })

  socket.on('useNFTItem', async (data) => {
    const { playerId, nftId, sessionId } = data
    const ownershipValid = await verifyNFTOwnership(playerId, nftId)
    if (ownershipValid) {
      // Logic to use the NFT item
      socket.to(sessionId).emit('nftUsed', { playerId, nftId })
    } else {
      socket.emit('error', { message: 'NFT ownership verification failed.' })
    }
  })

  socket.on('tradeNFTItem', async (data) => {
    const { fromPlayerId, toPlayerId, nftId } = data
    const ownershipValid = await verifyNFTOwnership(fromPlayerId, nftId)
    if (ownershipValid) {
      await transferNFT(fromPlayerId, toPlayerId, nftId)
      io.to(fromPlayerId).emit('nftTraded', { nftId, toPlayerId })
      io.to(toPlayerId).emit('nftReceived', { nftId, fromPlayerId })
    } else {
      socket.emit('error', {
        message: 'NFT ownership verification failed for trade.',
      })
    }
  })

  socket.on('sendMessage', (data) => {
    const { sessionId, playerId, content } = data
    const message = { playerId, content, timestamp: new Date() }
    io.to(sessionId).emit('newMessage', message)
    // Logic to save the message to the database

  })

  socket.on('disconnect', () => {
    console.log('User  disconnected:', socket.id)
  })
})

server.listen(3000, () => {
  console.log('Server is running on port 3000')
})
