const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});
const Game = require('./game');
const game = new Game();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', (playerInfo) => {
        try {
            game.addPlayer(socket, playerInfo);
            
            // Send current scene state to new player
            const sceneState = game.getSceneState(playerInfo.scene);
            socket.emit('currentPlayers', sceneState);
            
            // Notify other players in the same scene
            const newPlayer = game.players.get(socket.id);
            socket.to(playerInfo.scene).emit('newPlayer', newPlayer);
            
            // Join the scene room
            socket.join(playerInfo.scene);
        } catch (error) {
            console.error('Error in joinGame:', error);
        }
    });

    socket.on('sceneCollision', (data) => {
        try {
            game.setSceneCollision(data.scene, data.collisionMap);
        } catch (error) {
            console.error('Error in sceneCollision:', error);
        }
    });

    socket.on('playerInput', (input) => {
        try {
            const player = game.handlePlayerInput(socket.id, input);
            if (player) {
                // Broadcast only to players in the same scene
                io.to(player.scene).emit('gameState', game.getSceneState(player.scene));
            }
        } catch (error) {
            console.error('Error in playerInput:', error);
        }
    });

    socket.on('disconnect', () => {
        try {
            const player = game.players.get(socket.id);
            if (player) {
                const scene = player.scene;
                game.removePlayer(socket.id);
                io.to(scene).emit('playerDisconnected', socket.id);
            }
        } catch (error) {
            console.error('Error in disconnect:', error);
        }
    });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
