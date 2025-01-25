import { AnimationManager } from './managers/AnimationManager'
import { PlayerManager } from './managers/PlayerManager'
import { CombatManager} from './managers/CombatManager'
import Level from './Level.js'
import { io } from 'socket.io-client'
import BackgroundScene from './managers/backgroundscene'

export default class BridgeScene extends Phaser.Scene {
    constructor() {
        super("BridgeScene");
        this.player = null;
        this.level = new Level();
        this.spike = null;
        this.healthBar = null;
        this.otherPlayers = {};
        this.canMove = false;
        this.countdownText = null;
        this.countdownStarted = false;
        this.spawnPoints = [
        { x: 50, y: 50 },     // Top left
        { x: 128, y: 200 }    // Bottom middle
    ];
        this.lastEmitTime = 0;
        this.socket = null;
        /** @type {BackgroundScene} */
        this.backgroundScene = null;
        this.lastPlayerState = null;
}

init(data) {
    console.log('BridgeScene init with data:', data);
    this.backgroundScene = /** @type {BackgroundScene} */ (this.scene.get('BackgroundScene'));
    this.socket = this.backgroundScene.getSocket();
    console.log('Socket received in BridgeScene:', this.socket.id);

    // Create physics group for other players
    this.otherPlayersGroup = this.physics.add.group();

    // Emit that we've joined the BridgeScene with initial position
    this.socket.emit('joinScene', {
        scene: 'BridgeScene',
        playerId: this.socket.id,
        x: this.spawnPoints[0].x,
        y: this.spawnPoints[0].y,
        animation: 'idleDown',
        flipX: false
    });

    // Listen for all players currently in BridgeScene
    this.socket.on('currentBridgePlayers', (players) => {
        console.log('Current players in BridgeScene:', players);
        Object.keys(players).forEach((id) => {
            if (id !== this.socket.id) {
                this.addOtherPlayer(players[id]);
                console.log('Added existing player to BridgeScene:', id);
            }
        });
    });

    // Listen for new players joining BridgeScene
    this.socket.on('playerJoinedBridge', (playerInfo) => {
        console.log('New player joined BridgeScene:', playerInfo);
        if (playerInfo.playerId !== this.socket.id) {
            this.addOtherPlayer(playerInfo);
        }
    });

    // Handle player movements
    this.socket.on('playerMovedInBridge', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            if (playerInfo.animation) {
                otherPlayer.play(playerInfo.animation, true);
            }
            otherPlayer.setFlipX(playerInfo.flipX);
        }
    });
}

create() {
    console.log('BridgeScene create starting');
    
    // Initialize background scene
    if (!this.scene.isActive('BackgroundScene')) {
        this.scene.launch('BackgroundScene');
    }

    this.backgroundScene = this.scene.get('BackgroundScene');
    this.socket = this.backgroundScene.getSocket();

    // Tell background scene we're here
    this.backgroundScene.events.emit('changeScene', 'BridgeScene');

    // Listen for player updates
    this.backgroundScene.events.on('playerUpdated', ({ playerId, playerInfo, isNew, isMovement }) => {
        if (playerId === this.socket.id) {
            if (isNew) this.addPlayer(playerInfo);
        } else {
            if (isNew) {
                this.addOtherPlayer(playerInfo);
            } else if (isMovement) {
                this.updateOtherPlayer(playerId, playerInfo);
            }
        }
    });

    // Listen for player removals
    this.backgroundScene.events.on('playerRemoved', (playerId) => {
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
        }
    });

    // Create map and other setup...
    // ... existing create code ...

    this.player = this.physics.add
        .sprite(
            256/2 - 50,
            256/2 - 35,
            "player",
        )
        .setScale(1);

    this.player.life = 100;
    this.player.setScale(1);
    this.player.setBodySize(24, 28);
    this.player.setOffset(10, 13);
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create all animations using AnimationManager
    AnimationManager.createAnimations(this);

    this.physics.add.collider(this.player, objectLayer);

    this.player.play("idleDown");

    this.healthBar = this.createHealthBar(this.player.x, this.player.y, this.player);

    const leaveButton = this.add.text(
        this.cameras.main.width - 2, 
        this.cameras.main.height - 2, 
        'Quit Match', 
        { 
            fontFamily: 'Verdana',
            fontSize: '10px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 2 }
        }
    )
    .setOrigin(1, 1)
    .setScrollFactor(0)
    .setInteractive()
    .setDepth(1000);

    leaveButton.on('pointerdown', () => {
        console.log('Leave button clicked'); // Debug log
        
        if (this.socket) {
            this.socket.emit('leaveScene', {
                from: 'BridgeScene',
                to: 'CommonScene'
            });
        }
        
        // Instead of scene.start, reload the whole game
        window.location.reload();
    });
    
    this.countdownText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'In Queue...',
        {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);



    this.socket.on('currentPlayers', (players) => {
        console.log('Received current players:', players);
        Object.keys(players).forEach((id) => {
            if (id !== this.socket.id) {
                const playerInfo = players[id];
                const otherPlayer = this.physics.add.sprite(
                    playerInfo.x,
                    playerInfo.y,
                    'player'
                ).setScale(1);
                this.otherPlayers[id] = otherPlayer;
            }
        });
    });

    this.socket.on('newPlayer', (playerInfo) => {
        console.log('New player joined:', playerInfo);
        const otherPlayer = this.physics.add.sprite(
            playerInfo.x,
            playerInfo.y,
            'player'
        ).setScale(1);
        this.otherPlayers[playerInfo.playerId] = otherPlayer;
    });

    this.socket.on('playerDisconnected', (playerId) => {
        console.log('Player disconnected:', playerId);
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
        }
    });

    this.socket.on('playerMoved', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            otherPlayer.play(playerInfo.anim, true);
            otherPlayer.flipX = playerInfo.flipX;
        }
    });

    this.socket.on('playerAttack', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.play(playerInfo.anim);
        }
    });

    this.socket.on('playerDamaged', (data) => {
        if (this.otherPlayers[data.playerId]) {
            this.otherPlayers[data.playerId].life = data.newLife;
            // Update health bar if you have one for other players
        }
    });

    this.socket.emit('joinScene', 'BridgeScene');

    // Create animations
    const animations = [
        { key: 'idleDown', start: 0, end: 5 },
        { key: 'idleRight', start: 6, end: 11 },
        { key: 'idleUp', start: 12, end: 17 },
        { key: 'idleLeft', start: 18, end: 23 },
        { key: 'walkDown', start: 18, end: 23 },
        { key: 'walkRight', start: 24, end: 29 },
        { key: 'walkUp', start: 30, end: 35 },
        { key: 'attackDown', start: 36, end: 39 },
        { key: 'attackRight', start: 42, end: 45 },
        { key: 'attackUp', start: 48, end: 51 },
        { key: 'attackLeft', start: 42, end: 45 }
    ];

    animations.forEach(anim => {
        if (this.anims.exists(anim.key)) {
            this.anims.remove(anim.key);
        }
        
        this.anims.create({
            key: anim.key,
            frames: this.anims.generateFrameNumbers('player', { 
                start: anim.start, 
                end: anim.end 
            }),
            frameRate: 10,
            repeat: anim.key.startsWith('attack') ? 0 : -1,
            hideOnComplete: false
        });
    });

    // Add spacebar for attacks
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

setupSocketListeners() {
    // Current players in this scene
    this.socket.on('currentBridgePlayers', (players) => {
        Object.keys(players).forEach((id) => {
            if (id !== this.socket.id) {
                this.addOtherPlayer(players[id]);
            }
        });
    });

    // New player joins this scene
    this.socket.on('playerJoinedBridge', (playerInfo) => {
        if (playerInfo.playerId !== this.socket.id) {
            this.addOtherPlayer(playerInfo);
        }
    });

    // Player movements in this scene
    this.socket.on('playerMovedInBridge', (playerInfo) => {
        const otherPlayer = this.otherPlayers[playerInfo.playerId];
        if (otherPlayer) {
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            if (playerInfo.animation) {
                otherPlayer.play(playerInfo.animation, true);
            }
            otherPlayer.setFlipX(playerInfo.flipX);
        }
    });

    // Player attacks
    this.socket.on('playerAttacked', (attackInfo) => {
        const attacker = attackInfo.playerId === this.socket.id ? 
            this.player : this.otherPlayers[attackInfo.playerId];
            
        if (attacker && !attacker.isAttacking) {
            const attackAnim = `attack${attackInfo.direction}`;
            
            if (this.anims.exists(attackAnim)) {
                attacker.isAttacking = true;
                attacker.play(attackAnim, true)
                    .once('animationcomplete', () => {
                        attacker.isAttacking = false;
                        attacker.play(`idle${attackInfo.direction}`, true);
                    });
            }
        }
    });

    // Player leaves/disconnects
    this.socket.on('playerLeftBridge', (playerId) => {
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
        }
    });

    // Listen for countdown start
    this.socket.on('bridgeCountdown', () => {
        this.startCountdown();
    });
}

shutdown() {
    if (this.socket) {
        this.socket.emit('leaveScene', {
            from: 'BridgeScene'
        });
        this.socket.removeAllListeners();
    }
}

addOtherPlayer(playerInfo) {
    if (this.otherPlayers[playerInfo.playerId]) {
        this.otherPlayers[playerInfo.playerId].destroy();
    }

    const otherPlayer = this.physics.add.sprite(
        playerInfo.x,
        playerInfo.y,
        'player'
    ).setScale(1);

    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setBodySize(24, 28);
    otherPlayer.setOffset(10, 13);
    
    // Add to physics group
    this.otherPlayersGroup.add(otherPlayer);
    
    // Store in otherPlayers object
    this.otherPlayers[playerInfo.playerId] = otherPlayer;
    
    // Play initial animation
    if (playerInfo.animation) {
        otherPlayer.play(playerInfo.animation);
    }

    console.log('Successfully added other player:', playerInfo.playerId);
    return otherPlayer;
}

preload() {
    this.load.image("Bridge_Stone_Horizontal", "/assets/Bridge_Stone_Horizontal.png");
    this.load.image("Water_Tile", "/assets/Water_Tile.png");
    this.load.tilemapTiledJSON("bridge", "/assets/bridge.json");
    this.load.spritesheet("player", "/assets/Spearman.png", {
        frameWidth: 48,
        frameHeight: 48,
    });
}

create() {
    this.game.scale.resize(256,256)
    const map = this.make.tilemap({ key: "bridge" });
    const floor = map.addTilesetImage("Water_Tile", "Water_Tile");

    const floorLayer = map.createLayer("floor", [floor], 0, 0);
    floorLayer.setScale(1, 1).setOrigin(0, 0)
        .setCollisionByProperty({ collider: true });

    const Bridge_Stone_Horizontal = map.addTilesetImage("Bridge_Stone_Horizontal", "Bridge_Stone_Horizontal");
    const objectLayer = map.createLayer("object", [Bridge_Stone_Horizontal], 0, 0);
    objectLayer.setScale(1, 1).setOrigin(0, 0)
        .setCollisionByProperty({ collider: true });


    this.player = this.physics.add
        .sprite(
            256/2 - 50,
            256/2 - 35,
            "player",
        )
        .setScale(1);

    this.player.life = 100;

    this.player.setScale(1); // Scale the player sprite by 1.5 times
    this.player.setBodySize(24, 28);
    this.player.setOffset(10, 13);
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create all animations using AnimationManager
    AnimationManager.createAnimations(this);

    this.physics.add.collider(this.player, objectLayer);

    this.player.play("idleDown");

    this.healthBar = this.createHealthBar(this.player.x, this.player.y, this.player);

    const leaveButton = this.add.text(
        this.cameras.main.width - 2, 
        this.cameras.main.height - 2, 
        'Quit Match', 
        { 
            fontFamily: 'Verdana',
            fontSize: '10px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 2 }
        }
    )
    .setOrigin(1, 1)
    .setScrollFactor(0)
    .setInteractive()
    .setDepth(1000);

    leaveButton.on('pointerdown', () => {
        console.log('Leave button clicked'); // Debug log
        
        if (this.socket) {
            this.socket.emit('leaveScene', {
                from: 'BridgeScene',
                to: 'CommonScene'
            });
        }
        
        // Instead of scene.start, reload the whole game
        window.location.reload();
    });
    
    this.countdownText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'In Queue...',
        {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

    this.socket = io('http://localhost:8080', {
        withCredentials: false,
    });

    this.socket.on('currentPlayers', (players) => {
        console.log('Received current players:', players);
        Object.keys(players).forEach((id) => {
            if (id !== this.socket.id) {
                const playerInfo = players[id];
                const otherPlayer = this.physics.add.sprite(
                    playerInfo.x,
                    playerInfo.y,
                    'player'
                ).setScale(1);
                this.otherPlayers[id] = otherPlayer;
            }
        });
    });

    this.socket.on('newPlayer', (playerInfo) => {
        console.log('New player joined:', playerInfo);
        const otherPlayer = this.physics.add.sprite(
            playerInfo.x,
            playerInfo.y,
            'player'
        ).setScale(1);
        this.otherPlayers[playerInfo.playerId] = otherPlayer;
    });

    this.socket.on('playerDisconnected', (playerId) => {
        console.log('Player disconnected:', playerId);
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
        }
    });

    this.socket.on('playerMoved', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            otherPlayer.play(playerInfo.anim, true);
            otherPlayer.flipX = playerInfo.flipX;
        }
    });

    this.socket.on('playerAttack', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.play(playerInfo.anim);
        }
    });

    this.socket.on('playerDamaged', (data) => {
        if (this.otherPlayers[data.playerId]) {
            this.otherPlayers[data.playerId].life = data.newLife;
            // Update health bar if you have one for other players
        }
    });

    this.socket.emit('joinScene', 'BridgeScene');
}

checkPlayersAndStartCountdown() {
    const playerCount = Object.keys(this.otherPlayers).length + 1; // +1 for local player
    
    if (playerCount >= 2 && !this.countdownStarted) {
        this.countdownStarted = true;
        this.startCountdown();
    } else if (playerCount < 2) {
        // Reset if a player leaves during countdown
        this.countdownStarted = false;
        this.canMove = false;
        if (this.countdownText) {
            this.countdownText.setText('Waiting for players...');
        }
    }
}

startCountdown() {
    let count = 3;
    
    this.countdownText.setText(count.toString());
    
    const countdownTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
            count--;
            if (count > 0) {
                this.countdownText.setText(count.toString());
            } else if (count === 0) {
                this.countdownText.setText('FIGHT!');
                this.canMove = true;
                
                this.time.delayedCall(500, () => {
                    this.countdownText.destroy();
                });
            }
        },
        repeat: 3
    });
}

createHealthBar(x, y, player) {
    const width = 40;
    const height = 5;
    
    // White outline
    const outline = this.add.rectangle(x, y - 20, width + 2, height + 2, 0xffffff);
    
    // Black background
    const healthBarBackground = this.add.rectangle(x, y - 20, width, height, 0x000000);
    
    // Red health bar - set origin to left
    const healthBar = this.add.rectangle(x - width/2, y - 20, width, height, 0xff0000)
        .setOrigin(0, 0.5);
    
    return { 
        outline: outline,
        background: healthBarBackground, 
        bar: healthBar 
    };
}

update() {
    if (!this.canMove || !this.player) return;

    const speed = 80;
    const prevVelocity = this.player.body.velocity.clone();

    // Stop any previous movement
    this.player.body.setVelocity(0);

    // Handle attack input
    if (Phaser.Input.Keyboard.JustDown(this.spacebar) && !this.isAttacking) {
        this.handleAttack();
    }

    // Horizontal movement
    if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-speed);
        this.player.anims.play("walkRight", true);
        this.player.flipX = true;
        this.player.lastDirection = 'Right';
    } else if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(speed);
        this.player.anims.play("walkRight", true);
        this.player.flipX = false;
        this.player.lastDirection = 'Right';
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
        this.player.body.setVelocityY(-speed);
        this.player.anims.play("walkUp", true);
        this.player.lastDirection = 'Up';
    } else if (this.cursors.down.isDown) {
        this.player.body.setVelocityY(speed);
        this.player.anims.play("walkDown", true);
        this.player.lastDirection = 'Down';
    }

    // Normalize diagonal movement
    this.player.body.velocity.normalize().scale(speed);

    // Handle idle animations
    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
        const direction = this.player.lastDirection || 'Down';
        if (!this.isAttacking) {
            this.player.play(`idle${direction}`, true);
        }
    }

    // Emit player movement with more details
    const playerInfo = {
        playerId: this.socket.id,
        x: this.player.x,
        y: this.player.y,
        animation: this.player.anims.currentAnim?.key || 'idleDown',
        flipX: this.player.flipX,
        scene: 'BridgeScene'
    };

    // Only emit if position or animation changed
    if (this.lastPlayerState?.x !== playerInfo.x || 
        this.lastPlayerState?.y !== playerInfo.y ||
        this.lastPlayerState?.animation !== playerInfo.animation ||
        this.lastPlayerState?.flipX !== playerInfo.flipX) {
        
        this.socket.emit('playerMovement', playerInfo);
        this.lastPlayerState = { ...playerInfo };
    }

    // Check if enough players are ready
    this.checkPlayersReady();
}

handleAttack() {
    if (this.isAttacking) return;

    let closestPlayer = null;
    let closestDistance = Infinity;

    Object.keys(this.otherPlayers).forEach((id) => {
        const otherPlayer = this.otherPlayers[id];
        const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            otherPlayer.x,
            otherPlayer.y
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = otherPlayer;
        }
    });

    if (closestPlayer && closestDistance < 25) {
        this.isAttacking = true;
        const direction = this.player.lastDirection || 'Down';
        const attackAnim = `attack${direction}`;
        
        if (this.anims.exists(attackAnim)) {
            this.player.play(attackAnim, true)
                .once('animationcomplete', () => {
                    this.isAttacking = false;
                    this.player.play(`idle${direction}`, true);
                });
            
            this.socket.emit('playerAttack', {
                x: this.player.x,
                y: this.player.y,
                direction: direction,
                scene: 'BridgeScene',
                targetId: closestPlayer.playerId
            });
        }
    }
}

setupMultiplayerEvents() {
    // Similar to DungeonScene
    this.events.on('gameState', (state) => {
        this.handleGameState(state);
    });

    this.events.on('combatResult', (result) => {
        if (result.success) {
            const attacker = result.attackerId === this.socket.id ? 
                this.player : this.otherPlayers[result.attackerId];
            const target = result.targetId === this.socket.id ?
                this.player : this.otherPlayers[result.targetId];
            
            if (attacker && target) {
                this.handleCombatAnimation(attacker, target, result);
            }
        }
    });

    this.events.on('battleStart', () => {
        this.canMove = true;
        // ... your existing battle start logic ...
    });
}

checkPlayersReady() {
    const playerCount = Object.keys(this.otherPlayers).length + 1; // +1 for local player
    if (playerCount >= 2) { // Adjust number as needed
        this.socket.emit('bridgeReady');
    }
}

startCountdown() {
    let count = 3;
    const countdownText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'Starting in: 3',
        {
            fontSize: '64px',
            fill: '#fff'
        }
    ).setOrigin(0.5);

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.setText(`Starting in: ${count}`);
        } else {
            countdownText.setText('Fight!');
            setTimeout(() => {
                countdownText.destroy();
                this.startBattle();
            }, 1000);
            clearInterval(countdownInterval);
        }
    }, 1000);
}

startBattle() {
    // Enable player movement and attacks
    this.canMove = true;
    // Add any other battle start logic here
}
}
 