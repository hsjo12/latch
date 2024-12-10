const Game = require('./game');
const game = new Game();

// In your socket.io connection handler:
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', (playerInfo) => {
        game.addPlayer(socket, playerInfo);
        
        // Send current players to the new player
        socket.emit('currentPlayers', game.getSceneState(playerInfo.scene));
        
        // Notify other players
        socket.broadcast.emit('newPlayer', game.players.get(socket.id));
    });

    // New event to receive collision data
    socket.on('sceneCollision', (data) => {
        game.setSceneCollision(data.scene, data.collisionMap);
    });

    socket.on('playerInput', (input) => {
        game.handlePlayerInput(socket.id, input);
        // Broadcast new game state to players in the same scene
        io.emit('gameState', game.getSceneState(input.scene));
    });

    socket.on('disconnect', () => {
        game.removePlayer(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

// Optional: Server update loop for continuous state updates
setInterval(() => {
    io.emit('gameState', game.getGameState());
}, 1000 / 60); // 60 times per second 