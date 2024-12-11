class Game {
    constructor() {
        this.players = new Map();
        this.collisionMaps = new Map();
        this.TILE_SIZE = 48;
        this.PLAYER_SPEED = 3;
        this.ANIMATIONS = {
            IDLE: {
                DOWN: 'idleDown',
                UP: 'idleUp',
                RIGHT: 'idleRight'
            },
            WALK: {
                DOWN: 'walkDown',
                UP: 'walkUp',
                RIGHT: 'walkRight'
            }
        };
    }

    handlePlayerInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player) return null;

        // original position
        const originalX = player.x;
        const originalY = player.y;
        let moved = false;

        // new position
        if (input.left) {
            player.x -= this.PLAYER_SPEED;
            moved = true;
        }
        if (input.right) {
            player.x += this.PLAYER_SPEED;
            moved = true;
        }
        if (input.up) {
            player.y -= this.PLAYER_SPEED;
            moved = true;
        }
        if (input.down) {
            player.y += this.PLAYER_SPEED;
            moved = true;
        }

        // Check collision and revert if needed
        if (moved && this.checkCollision(player.x, player.y, player.scene)) {
            player.x = originalX;
            player.y = originalY;
        }

        // Update animation state
        const animationState = this.determineAnimation(input, player.animation);
        player.animation = animationState.animation;
        player.flipX = animationState.flipX;

        return player;
    }

    determineAnimation(input, currentAnimation) {
        if (input.left || input.right || input.up || input.down) {
            if (input.left || input.right) {
                return {
                    animation: this.ANIMATIONS.WALK.RIGHT,
                    flipX: input.left
                };
            }
            if (input.up) return { animation: this.ANIMATIONS.WALK.UP, flipX: false };
            if (input.down) return { animation: this.ANIMATIONS.WALK.DOWN, flipX: false };
        }

        // Convert to idle animation
        let idleAnimation = currentAnimation.replace('walk', 'idle');
        if (!Object.values(this.ANIMATIONS.IDLE).includes(idleAnimation)) {
            idleAnimation = this.ANIMATIONS.IDLE.DOWN;
        }

        return {
            animation: idleAnimation,
            flipX: currentAnimation.includes('Right') ? input.left : false
        };
    }

    checkCollision(x, y, scene) {
        const collisionMap = this.collisionMaps.get(scene);
        if (!collisionMap) return false;

        const tileX = Math.floor(x / this.TILE_SIZE);
        const tileY = Math.floor(y / this.TILE_SIZE);

        if (tileY < 0 || tileY >= collisionMap.length || 
            tileX < 0 || tileX >= collisionMap[0].length) {
            return true; // Out of bounds collision
        }

        return collisionMap[tileY][tileX];
    }

    setSceneCollision(scene, collisionMap) {
        this.collisionMaps.set(scene, collisionMap);
    }

    getSceneState(scene) {
        const scenePlayers = {};
        for (const [id, player] of this.players) {
            if (player.scene === scene) {
                scenePlayers[id] = player;
            }
        }
        return scenePlayers;
    }

    addPlayer(socket, playerInfo) {
        // Initialize player with stats
        this.players.set(socket.id, {
            playerId: socket.id,
            x: playerInfo.x || 400,
            y: playerInfo.y || 300,
            scene: playerInfo.scene,
            animation: 'idleDown',
            flipX: false,
            // Add stats
            health: 100,
            maxHealth: 100,
            level: 1,
            xp: 0,
            maxXp: 100  // Initial XP needed for level 2
        });

        // Send initial stats to player
        this.sendPlayerStats(socket);
    }

    sendPlayerStats(socket) {
        const player = this.players.get(socket.id);
        if (player) {
            socket.emit('playerStats', {
                health: player.health,
                maxHealth: player.maxHealth,
                level: player.level,
                xp: player.xp,
                maxXp: player.maxXp
            });
        }
    }

    handleDamage(playerId, damage) {
        const player = this.players.get(playerId);
        if (player) {
            player.health = Math.max(0, player.health - damage);
            this.sendPlayerStats(this.io.sockets.sockets.get(playerId));
        }
    }

    addXP(playerId, amount) {
        const player = this.players.get(playerId);
        if (player) {
            player.xp += amount;
            
            // Check for level up
            while (player.xp >= player.maxXp) {
                player.xp -= player.maxXp;
                player.level++;
                // Each level requires 7% more XP
                player.maxXp = Math.floor(player.maxXp * 1.07);
                // Increase max health with level
                player.maxHealth = 100 + (player.level - 1) * 10;
                player.health = player.maxHealth; // Heal on level up
            }

            this.sendPlayerStats(this.io.sockets.sockets.get(playerId));
        }
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    getStartPosition(scene) {
        const positions = {
            dungeon: { x: 256/2 - 50, y: 256/2 - 35 },
            common: { x: 400, y: 300 }
        };
        return positions[scene] || { x: 0, y: 0 };
    }
}

module.exports = Game;
