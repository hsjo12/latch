const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

// Scene configurations
const sceneConfig = {
    CommonScene: {
        spawnPoints: [
            { x: 400, y: 300 }  // Center spawn point for CommonScene
        ]
    },
    BridgeScene: {
        spawnPoints: [
            { x: 100, y: 100 },
            { x: 700, y: 100 }
        ]
    },
    DungeonScene: {
        spawnPoints: [
            { x: 100, y: 100 },
            { x: 700, y: 100 }
        ]
    }
};

// Game state to track players and scenes
const gameState = {
    CommonScene: {
        players: {}
    },
    BridgeScene: {
        players: {}
    },
    DungeonScene: {
        players: {}
    }
};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinScene', (data) => {
        console.log(`Player ${socket.id} joining ${data.scene}`);
        const scene = data.scene;
        
        // Leave previous scene if any
        if (socket.scene) {
            socket.leave(socket.scene);
            if (gameState[socket.scene]?.players[socket.id]) {
                delete gameState[socket.scene].players[socket.id];
            }
        }

        // Join new scene
        socket.scene = scene;
        socket.join(scene);

        // Initialize scene state if needed
        if (!gameState[scene]) {
            gameState[scene] = { players: {} };
        }

        // Add player to scene
        gameState[scene].players[socket.id] = {
            playerId: socket.id,
            x: Math.random() * 800,
            y: Math.random() * 600,
            animation: 'idleDown',
            flipX: false,
            lastDirection: 'Down',
            isAttacking: false
        };

        // Send current scene state to new player
        socket.emit('currentPlayers', gameState[scene].players);

        // Notify others in scene
        socket.to(scene).emit('newPlayer', {
            playerId: socket.id,
            ...gameState[scene].players[socket.id]
        });
    });

    socket.on('playerMovement', (movementData) => {
        if (socket.scene && gameState[socket.scene].players[socket.id]) {
            // Update player position
            gameState[socket.scene].players[socket.id] = {
                ...gameState[socket.scene].players[socket.id],
                ...movementData
            };

            // Send player movement to others in same scene
            socket.to(socket.scene).emit('playerMoved', {
                playerId: socket.id,
                ...movementData
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        if (socket.scene && gameState[socket.scene]?.players[socket.id]) {
            delete gameState[socket.scene].players[socket.id];
            io.to(socket.scene).emit('playerDisconnected', socket.id);
        }
    });

    socket.on('keyState', (keys) => {
        if (!socket.scene || !gameState[socket.scene].players[socket.id]) return;

        const player = gameState[socket.scene].players[socket.id];
        const speed = 80;
        let animation = 'idleDown';
        let moved = false;

        // Process movement based on either WASD or arrow keys
        const left = keys.arrows.left || keys.wasd.left;
        const right = keys.arrows.right || keys.wasd.right;
        const up = keys.arrows.up || keys.wasd.up;
        const down = keys.arrows.down || keys.wasd.down;

        // Calculate movement
        if (left) {
            player.x -= speed * (16/1000);
            animation = 'walkRight';
            player.flipX = true;
            player.lastDirection = 'Right';
            moved = true;
        } else if (right) {
            player.x += speed * (16/1000);
            animation = 'walkRight';
            player.flipX = false;
            player.lastDirection = 'Right';
            moved = true;
        }

        if (up) {
            player.y -= speed * (16/1000);
            animation = 'walkUp';
            player.lastDirection = 'Up';
            moved = true;
        } else if (down) {
            player.y += speed * (16/1000);
            animation = 'walkDown';
            player.lastDirection = 'Down';
            moved = true;
        }

        // Set idle animation if not moving
        if (!moved) {
            animation = `idle${player.lastDirection || 'Down'}`;
        }

        // Update player state
        player.animation = animation;

        // Broadcast updated game state
        io.to(socket.scene).emit('gameState', {
            players: gameState[socket.scene].players
        });
    });

    socket.on('chatMessage', (data) => {
        // Broadcast the message to all clients in the same scene
        io.to(socket.scene).emit('chatMessage', {
            playerId: socket.id,
            message: data.message
        });
    });

    socket.on('playerInput', (data) => {
        // If it's a state update (has x, y, animation)
        if (data.x !== undefined && data.y !== undefined && data.animation) {
            const player = gameState[socket.scene]?.players[socket.id];
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.animation = data.animation;
                player.flipX = data.flipX;
                
                // Broadcast update without logging
                io.to(socket.scene).emit('gameState', {
                    players: gameState[socket.scene].players
                });
            }
            return;
        }

        // If it's an input update (has input controls)
        if (data.input) {
            const player = gameState[socket.scene]?.players[socket.id];
            if (!player) return;

            const speed = 80;
            let animation = 'idleDown';
            
            // Don't process movement if player is attacking
            if (player.isAttacking) {
                animation = `attack${player.lastDirection || 'Down'}`;
                io.emit('gameState', { players: gameState[socket.scene].players });
                return;
            }

            // Reset velocity
            let velocityX = 0;
            let velocityY = 0;

            // Handle input with safe checks
            const input = data.input;
            if (input.left === true) {
                velocityX = -speed;
                animation = 'walkLeft';
                player.lastDirection = 'Left';
                player.flipX = true;
            } else if (input.right === true) {
                velocityX = speed;
                animation = 'walkRight';
                player.lastDirection = 'Right';
                player.flipX = false;
            }

            if (input.up === true) {
                velocityY = -speed;
                animation = 'walkUp';
                player.lastDirection = 'Up';
            } else if (input.down === true) {
                velocityY = speed;
                animation = 'walkDown';
                player.lastDirection = 'Down';
            }

            // Handle attack input
            if (input.attack === true) {
                player.isAttacking = true;
                animation = `attack${player.lastDirection || 'Down'}`;
                
                // Reset attack state after animation
                setTimeout(() => {
                    player.isAttacking = false;
                }, 500);
            }

            // Normalize diagonal movement
            if (velocityX !== 0 && velocityY !== 0) {
                const normalize = Math.sqrt(2);
                velocityX /= normalize;
                velocityY /= normalize;
            }

            // Update position if not attacking
            if (!player.isAttacking) {
                player.x += velocityX * (1/60);
                player.y += velocityY * (1/60);
            }

            // If no movement and not attacking, use idle animation
            if (velocityX === 0 && velocityY === 0 && !player.isAttacking) {
                animation = `idle${player.lastDirection || 'Down'}`;
            }

            // Update player state
            player.animation = animation;

            // Broadcast new state to all players
            io.to(socket.scene).emit('gameState', {
                players: gameState[socket.scene].players
            });
        }
    });

    socket.on('dungeonReady', (data) => {
        // When a client reports enough players, broadcast countdown to all
        io.in('DungeonScene').emit('dungeonCountdown');
    });

    socket.on('bridgeReady', (data) => {
        // When a client reports enough players, broadcast countdown to all
        io.in('BridgeScene').emit('bridgeCountdown');
    });

    socket.on('playerAttack', (attackInfo) => {
        const attacker = gameState[attackInfo.scene]?.players[socket.id];
        if (!attacker) return;

        // Emit attack animation to all players including attacker
        io.in(attackInfo.scene).emit('playerAttacked', {
            playerId: socket.id,
            direction: attackInfo.direction
        });

        // Check for players in attack range
        const attackRange = 50; // pixels
        const attackDamage = 10; // 10 damage per hit

        Object.entries(gameState[attackInfo.scene].players).forEach(([targetId, targetPlayer]) => {
            if (targetId !== socket.id && targetPlayer.scene === attackInfo.scene) {
                // Check if target is in range
                const dx = targetPlayer.x - attackInfo.x;
                const dy = targetPlayer.y - attackInfo.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= attackRange) {
                    // Initialize health if not set
                    if (typeof targetPlayer.health === 'undefined') {
                        targetPlayer.health = 100;
                    }

                    // Apply damage
                    targetPlayer.health = Math.max(0, targetPlayer.health - attackDamage);
                    
                    // Emit damage to all players
                    io.in(attackInfo.scene).emit('playerDamaged', {
                        playerId: targetId,
                        newHealth: targetPlayer.health,
                        attackerId: socket.id
                    });

                    // Check for player death
                    if (targetPlayer.health <= 0) {
                        io.in(attackInfo.scene).emit('playerDied', {
                            playerId: targetId
                        });
                    }
                }
            }
        });
    });
});

// Game loop for continuous state updates
setInterval(() => {
    Object.keys(gameState).forEach(scene => {
        if (Object.keys(gameState[scene].players).length > 0) {
            io.to(scene).emit('gameState', {
                players: gameState[scene].players
            });
        }
    });
}, 1000 / 60); // 60 times per second

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
