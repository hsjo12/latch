import Phaser from "phaser";
import Level from "./Level.js";
import BackgroundScene from './managers/backgroundscene'
import { PlayerManager } from './managers/PlayerManager'
import { AnimationManager } from './managers/AnimationManager'
import { CombatManager } from './managers/CombatManager'
import { io } from 'socket.io-client'



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
    this.socket = null;
    this.backgroundScene = null;
    this.animationsCreated = false;  // Track if animations are created
    this.otherPlayersGroup = null;
    this.playerWorldPosition = {};
    this.playersGroup = null;
    this.playerEventListeners = new Map();
    this.localPlayerId = null; // Track local player ID
    this.hasJoinedScene = false; // Track if we've already joined
    this.initializedPlayers = new Set(); // Track which players we've initialized
    this.existingPlayers = new Set(); // Track existing player IDs
    this.isAttacking = false;  // Add attack state tracking
    this.lastMovementUpdate = 0;
    this.movementUpdateInterval = 50; // Update every 50ms
    this.lastPosition = { x: 0, y: 0, animation: '', flipX: false };
  }

  init(data) {
    console.log('BridgeScene init with data:', data);
    // Only set socket once
    if (!this.socket) {
        if (data && data.socket) {
            this.socket = data.socket;
        } else {
            this.backgroundScene = this.scene.get('BackgroundScene');
            this.socket = this.backgroundScene.getSocket();
        }
        console.log('Socket initialized:', this.socket.id);
    }
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
    console.log('BridgeScene create starting');
    
    // Initialize groups first, before any other creation logic
    this.playersGroup = this.add.group();
    this.otherPlayersGroup = this.add.group();
    
    this.game.scale.resize(256,256);
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
    
    this.player.play("idleDown");
    this.healthBar = this.createHealthBar(this.player.x, this.player.y, this.player);

 

    // Add leave button
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
        console.log('Returning to common map');
        
        if (this.socket) {
            this.socket.emit('playerLeftScene', {
                playerId: this.socket.id,
                from: 'BridgeScene',
                to: 'CommonScene'
            });
        }
        
        // Reset game scale before transitioning
        this.game.scale.resize(800, 600); // Set to CommonScene dimensions
        
        this.scene.start('CommonScene', { 
            x: 620,
            y: 360
        });
    });

    // Add waiting text instead of starting countdown immediately
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

    // Listen for player join/leave events
    this.socket.on('playerJoined', () => this.checkPlayersAndStartCountdown());
    this.socket.on('playerLeft', () => this.checkPlayersAndStartCountdown());

    // Create animations using AnimationManager
    AnimationManager.createAnimations(this);

    // Setup socket events if socket exists
    if (this.socket) {
        // Remove any existing listeners first
        this.socket.removeAllListeners('gameState');
        this.socket.removeAllListeners('playerDisconnected');

        // Add new listeners
        this.socket.on('gameState', (state) => {
            if (state && state.players) {
                Object.entries(state.players).forEach(([playerId, playerData]) => {
                    if (playerId !== this.socket.id && !this.otherPlayers[playerId]) {
                        // Add new player
                        this.addOtherPlayer(playerData);
                    } else if (this.otherPlayers[playerId]) {
                        // Update existing player
                        const otherPlayer = this.otherPlayers[playerId];
                        otherPlayer.x = playerData.x;
                        otherPlayer.y = playerData.y;
                        if (playerData.animation) {
                            otherPlayer.play(playerData.animation, true);
                        }
                    }
                });
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            if (this.otherPlayers[playerId]) {
                this.otherPlayers[playerId].destroy();
                delete this.otherPlayers[playerId];
            }
        });

        // Join the scene
        this.socket.emit('joinScene', {
            scene: 'BridgeScene',
            x: this.game.config.width / 2,
            y: this.game.config.height / 2
        });
    }

    // Add portal collision handler
    this.physics.add.overlap(this.player, this.portal, () => {
        // Tell server we're leaving this scene
        this.socket.emit('leaveBridgeScene');
        
        // Start next scene
        this.scene.start('CommonScene');  // or whatever scene you're transitioning to
    });

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

    this.otherPlayersGroup = this.add.group();

    // Add these socket listeners
    this.socket.on('currentPlayers', (players) => {
        console.log('Current players in BridgeScene:', players);
        
        // Don't clear if we already have these players
        const currentPlayerIds = new Set(Object.keys(players));
        const existingPlayerIds = new Set(Object.keys(this.playerWorldPosition));
        
        // Only clear and recreate if the player sets are different
        if (!this.areSetsEqual(currentPlayerIds, existingPlayerIds)) {
            this.clearExistingPlayers();
            
            Object.entries(players).forEach(([id, playerInfo]) => {
                if (!this.existingPlayers.has(id)) {
                    console.log('Creating new player:', id);
                    if (id === this.socket.id) {
                        this.player = this.createPlayerWithListeners(id, playerInfo);
                    } else if (playerInfo.scene === 'BridgeScene') {
                        this.createPlayerWithListeners(id, playerInfo);
                    }
                    this.existingPlayers.add(id);
                }
            });

            // After all players are created, check if we should start countdown
            if (Object.keys(players).length >= 2) {
                // Tell server we have enough players
                this.socket.emit('bridgeReady', {
                    scene: 'BridgeScene',
                    players: Object.keys(players)
                });
            }
        }
    });

    this.socket.on('newPlayer', (playerInfo) => {
        console.log('New player joined:', playerInfo);
        if (playerInfo.playerId !== this.localPlayerId && playerInfo.scene === 'BridgeScene') {
            this.createPlayerWithListeners(playerInfo.playerId, playerInfo);
        }
    });

    this.socket.on('playerMovedInBridge', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            if (playerInfo.animation) {
                otherPlayer.play(playerInfo.animation, true);
            }
            otherPlayer.setFlipX(playerInfo.flipX || false);
        }
    });

    this.socket.on('playerDisconnected', (playerId) => {
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
        }
    });

    // Listen for server's countdown signal
    this.socket.on('bridgeCountdown', () => {
        if (!this.countdownStarted) {
            this.startCountdown();
        }
    });

    // Store local player ID
    this.localPlayerId = this.socket.id;
    console.log('Local player ID:', this.localPlayerId);

    // Clean up old listeners before adding new ones
    this.cleanupSocketListeners();

    // Set up socket listeners
    this.socket.on('currentPlayers', (players) => {
        console.log('Current players received:', Object.keys(players));
        
        // Clear existing players first
        this.clearExistingPlayers();
        
        Object.entries(players).forEach(([id, playerInfo]) => {
            if (!this.initializedPlayers.has(id)) {
                console.log('Initializing player:', id);
                if (id === this.localPlayerId) {
                    console.log('Creating local player');
                    this.player = this.createPlayerWithListeners(id, playerInfo);
                } else if (playerInfo.scene === 'BridgeScene') {
                    console.log('Creating remote player');
                    this.createPlayerWithListeners(id, playerInfo);
                }
                this.initializedPlayers.add(id);
            } else {
                console.log('Player already initialized:', id);
            }
        });
    });

    this.socket.on('newPlayer', (playerInfo) => {
        console.log('New player joined:', playerInfo);
        if (playerInfo.playerId !== this.localPlayerId && playerInfo.scene === 'BridgeScene') {
            this.createPlayerWithListeners(playerInfo.playerId, playerInfo);
        }
    });

    this.socket.on('playerMoved', (playerInfo) => {
        const otherPlayer = this.otherPlayers[playerInfo.playerId];
        if (otherPlayer) {
            // Clear any existing tweens to prevent position conflicts
            this.tweens.killTweensOf(otherPlayer);
            
            // Update position immediately
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            
            // Update animation only if it's different
            if (playerInfo.animation && (!otherPlayer.anims.currentAnim || 
                otherPlayer.anims.currentAnim.key !== playerInfo.animation)) {
                otherPlayer.play(playerInfo.animation, true);
            }
            
            // Update flip state
            otherPlayer.setFlipX(playerInfo.flipX);
            
            // Store latest info
            otherPlayer.playerInfo = {
                ...playerInfo,
                lastUpdated: Date.now()
            };
        }
    });

    // Only emit join if we haven't already
    if (!this.hasJoinedScene) {
        console.log('Emitting first-time join for player:', this.localPlayerId);
        this.socket.emit('joinScene', {
            scene: 'BridgeScene',
            playerId: this.localPlayerId,
            x: this.getSpawnPoint().x,
            y: this.getSpawnPoint().y,
            animation: 'idleDown',
            flipX: false
        });
        this.hasJoinedScene = true;
    }

    // Clean up old listeners before adding new ones
    this.cleanupSocketListeners();

    // Set up socket listeners
    this.setupSocketListeners();

    // Update server with player movement
    this.time.addEvent({
        delay: 50, // Send updates every 50ms
        callback: this.sendPlayerUpdate,
        callbackScope: this,
        loop: true
    });

    // Listen for player counts in this scene specifically
    this.socket.on('playerCount', (data) => {
        console.log('Player count update:', data);
        if (data.scene === 'BridgeScene' && data.count >= 2 && !this.countdownStarted) {
            this.startCountdown();
        }
    });

    // Add spacebar input
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add attack animations
    const attackAnims = [
        { key: 'attackDown', start: 36, end: 39 },
        { key: 'attackRight', start: 42, end: 45 },
        { key: 'attackUp', start: 48, end: 51 },
        { key: 'attackLeft', start: 42, end: 45 }
    ];

    attackAnims.forEach(anim => {
        if (!this.anims.exists(anim.key)) {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers('player', { 
                    start: anim.start, 
                    end: anim.end 
                }),
                frameRate: 10,
                repeat: 0,  // Ensure animation only plays once
                hideOnComplete: false  // Don't hide sprite when animation completes
            });
        }
    });

    // Create physics group for other players if it doesn't exist
    this.otherPlayersGroup = this.physics.add.group({
        collideWorldBounds: true
    });

    // Add collision between players
    this.physics.add.collider(this.player, this.otherPlayersGroup);
    
    // Add collision between other players
    this.physics.add.collider(this.otherPlayersGroup, this.otherPlayersGroup);

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.game.config.width, this.game.config.height);

    // Set up scene-specific socket events
    this.socket.on('currentBridgePlayers', (players) => {
        console.log('Current bridge players:', players);
        Object.keys(players).forEach((id) => {
            if (id !== this.socket.id) {
                this.addOtherPlayer(players[id]);
            }
        });
    });

    this.socket.on('newBridgePlayer', (playerInfo) => {
        console.log('New player joined bridge:', playerInfo);
        if (playerInfo.playerId !== this.socket.id) {
            this.addOtherPlayer(playerInfo);
        }
    });

    // Emit that we've joined the bridge scene
    this.socket.emit('joinScene', {
        scene: 'BridgeScene',
        x: this.player.x,
        y: this.player.y
    });
  }

  createHealthBar(x, y, player) {
    const width = 40;
    const height = 5;
    
    // White outline
    const outline = this.add.rectangle(x, y - 40, width + 2, height + 2, 0xffffff);
    
    // Black background
    const healthBarBackground = this.add.rectangle(x, y - 40, width, height, 0x000000);
    
    // Red health bar - set origin to left and start with full width
    const healthBar = this.add.rectangle(x - width/2, y - 40, width, height, 0xff0000)
        .setOrigin(0, 0.5);
    
    // Make sure initial width matches full health
    healthBar.width = width; // Start with full width since health is 100
    
    return { 
        outline: outline,
        background: healthBarBackground, 
        bar: healthBar 
    };
  }

  update() {
    const speed = 80;
    const prevVelocity = this.player.body.velocity.clone();

    // Only allow movement if countdown is finished
    if (!this.canMove) {
        if (this.player) {
            this.player.body.setVelocity(0);
        }
        return;
    }

    // Stop any previous movement from the last frame
    this.player.body.setVelocity(0);

    // Horizontal movement
    if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-speed);
        this.player.anims.play("walkRight", true);
        this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(speed);
        this.player.anims.play("walkRight", true);
        this.player.flipX = false;
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
        this.player.body.setVelocityY(-speed);
        this.player.anims.play("walkUp", true);
    } else if (this.cursors.down.isDown) {
        this.player.body.setVelocityY(speed);
        this.player.anims.play("walkDown", true);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    this.player.body.velocity.normalize().scale(speed);

    // If no movement keys are pressed, stop the animation
    if (
        this.cursors.left.isUp &&
        this.cursors.right.isUp &&
        this.cursors.up.isUp &&
        this.cursors.down.isUp
    ) {
      this.player.anims.stop();

      // Set idle animation based on the last direction
      if (prevVelocity.x < 0) {
        this.player.anims.play("idleLeft", true);
        this.player.flipX = true;
      } else if (prevVelocity.x > 0) {
        this.player.anims.play("idleRight", true);
        this.player.flipX = false;
      } else if (prevVelocity.y < 0) {
        this.player.anims.play("idleUp", true);
      } else if (prevVelocity.y > 0) {
        this.player.anims.play("idleDown", true);
      }
    }

    // Update health bar position and width
    if (this.healthBar && this.player) {
        const yOffset = -20;
        const width = 40;
        
        this.healthBar.outline.x = this.player.x;
        this.healthBar.outline.y = this.player.y + yOffset;
        this.healthBar.background.x = this.player.x;
        this.healthBar.background.y = this.player.y + yOffset;
        
        // Update red bar position and width based on current health
        this.healthBar.bar.x = this.player.x - width/2;
        this.healthBar.bar.y = this.player.y + yOffset;
        this.healthBar.bar.width = (this.player.life / 100) * width; // Make sure this.player.life is set to 100 initially
    }

    this.otherPlayersGroup.getChildren().forEach((player) => {
        if (player.playerInfo) {
            player.setPosition(player.playerInfo.x, player.playerInfo.y);
            player.play(player.playerInfo.animation, true);
            player.flipX = player.playerInfo.flipX;
        }
    });

    // Update local player
    if (this.player && this.canMove) {
        // ... existing player movement code ...

        // Only emit if this is the local player
        if (this.socket.id === this.localPlayerId) {
            this.sendPlayerUpdate();
        }

        // Handle attack
        if (Phaser.Input.Keyboard.JustDown(this.spacebar) && !this.isAttacking) {
            this.handleAttack();  // Use the consolidated attack handler
        }
    }

    // Update other players
    Object.entries(this.playerWorldPosition).forEach(([playerId, playerData]) => {
        if (playerData.sprite && playerId !== this.localPlayerId) {
            playerData.sprite.setPosition(playerData.x, playerData.y);
            if (playerData.animation) {
                playerData.sprite.play(playerData.animation, true);
            }
            playerData.sprite.setFlipX(playerData.flipX);
        }
    });

    // Clean up any trailing sprites
    Object.values(this.otherPlayers).forEach(otherPlayer => {
        if (otherPlayer && otherPlayer.playerInfo) {
            // If player hasn't been updated in a while, set to idle
            const timeSinceUpdate = Date.now() - (otherPlayer.playerInfo.lastUpdated || 0);
            if (timeSinceUpdate > 100) { // 100ms threshold
                const currentAnim = otherPlayer.anims.currentAnim;
                if (currentAnim && currentAnim.key.startsWith('walk')) {
                    const idleAnim = currentAnim.key.replace('walk', 'idle');
                    otherPlayer.play(idleAnim, true);
                }
            }
        }
    });
  }

  handleSocketEvents() {
    // ... keep existing socket events ...

    // Check if this handler exists and has flipX
    this.socket.on('playerMoved', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            otherPlayer.anims.play(playerInfo.animation, true);
            otherPlayer.flipX = playerInfo.flipX;  // Make sure this is here
        }
    });
  }

  getSpawnPoint() {
    // Define two specific spawn points
    const spawnPoints = [
        { x: 50, y: 90 },    // First player spawn
        { x: 200, y: 90 }    // Second player spawn
    ];
    
    // Count existing players to determine spawn point
    const playerCount = Object.keys(this.playerWorldPosition).length;
    return spawnPoints[playerCount] || spawnPoints[0];
  }

  checkPlayersAndStartCountdown() {
    // Remove local countdown check - wait for server signal instead
    console.log('Waiting for server countdown signal...');
  }

  startCountdown() {
    if (this.countdownStarted) return; // Prevent multiple countdowns
    
    console.log('Starting countdown');
    this.countdownStarted = true;
    let count = 3;

    if (this.countdownText) {
        this.countdownText.setText(count.toString());
    }

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            this.countdownText?.setText(count.toString());
        } else {
            this.countdownText?.setText('FIGHT!');
            this.canMove = true;
            
            // Remove countdown text after "FIGHT!"
            setTimeout(() => {
                this.countdownText?.destroy();
                this.countdownText = null;
            }, 1000);
            
            clearInterval(countdownInterval);
        }
    }, 1000);
  }

  handleAttack() {
    // Find the closest player to attack
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
        const currentDirection = this.getPlayerDirection();
        const attackAnim = `attack${currentDirection}`;
        
        if (this.anims.exists(attackAnim)) {
            // Play attack animation locally
            this.player.play(attackAnim, true)
                .once('animationcomplete', () => {
                    this.isAttacking = false;
                    const idleAnim = `idle${currentDirection}`;
                    if (this.anims.exists(idleAnim)) {
                        this.player.play(idleAnim, true);
                    }
                });
            
            // Emit attack event with target information
            this.socket.emit('playerAttack', {
                x: this.player.x,
                y: this.player.y,
                direction: currentDirection,
                scene: 'BridgeScene',
                targetId: closestPlayer.playerId
            });
            
            console.log('Attacking player:', closestPlayer.playerId, 'with animation:', attackAnim);
        }
    }
  }

  setupSocketListeners() {
    this.socket.on('currentPlayers', (players) => {
        console.log('Current players in BridgeScene:', players);
        
        // Don't clear if we already have these players
        const currentPlayerIds = new Set(Object.keys(players));
        const existingPlayerIds = new Set(Object.keys(this.playerWorldPosition));
        
        // Only clear and recreate if the player sets are different
        if (!this.areSetsEqual(currentPlayerIds, existingPlayerIds)) {
            this.clearExistingPlayers();
            
            Object.entries(players).forEach(([id, playerInfo]) => {
                if (!this.existingPlayers.has(id)) {
                    console.log('Creating new player:', id);
                    if (id === this.socket.id) {
                        this.player = this.createPlayerWithListeners(id, playerInfo);
                    } else if (playerInfo.scene === 'BridgeScene') {
                        this.createPlayerWithListeners(id, playerInfo);
                    }
                    this.existingPlayers.add(id);
                }
            });

            // After all players are created, check if we should start countdown
            if (Object.keys(players).length >= 2) {
                // Tell server we have enough players
                this.socket.emit('bridgeReady', {
                    scene: 'BridgeScene',
                    players: Object.keys(players)
                });
            }
        }
    });

    // Listen for server's countdown signal
    this.socket.on('bridgeCountdown', () => {
        if (!this.countdownStarted) {
            this.startCountdown();
        }
    });

    // Update other players more smoothly
    this.socket.on('playerMovedInBridge', (playerInfo) => {
        if (this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            if (playerInfo.animation) {
                otherPlayer.play(playerInfo.animation, true);
            }
            otherPlayer.setFlipX(playerInfo.flipX || false);
        }
    });

    this.socket.on('playerMoved', (playerInfo) => {
        const otherPlayer = this.otherPlayers[playerInfo.playerId];
        if (otherPlayer) {
            // Clear any existing tweens to prevent position conflicts
            this.tweens.killTweensOf(otherPlayer);
            
            // Update position immediately
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            
            // Update animation only if it's different
            if (playerInfo.animation && (!otherPlayer.anims.currentAnim || 
                otherPlayer.anims.currentAnim.key !== playerInfo.animation)) {
                otherPlayer.play(playerInfo.animation, true);
            }
            
            // Update flip state
            otherPlayer.setFlipX(playerInfo.flipX);
            
            // Store latest info
            otherPlayer.playerInfo = {
                ...playerInfo,
                lastUpdated: Date.now()
            };
        }
    });

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
                        // Return to idle after attack
                        const idleAnim = `idle${attackInfo.direction}`;
                        if (this.anims.exists(idleAnim)) {
                            attacker.play(idleAnim, true);
                        }
                    });
            }
        }
    });

    this.socket.on('playerDamaged', (damageInfo) => {
        console.log('Received damage info:', damageInfo);
        const targetPlayer = damageInfo.playerId === this.socket.id ? 
            this.player : this.otherPlayers[damageInfo.playerId];
            
        if (targetPlayer) {
            targetPlayer.life = damageInfo.newHealth;
            if (targetPlayer.healthBar) {
                targetPlayer.healthBar.update();
            }
        }
    });
  }

  shutdown() {
    console.log('BridgeScene shutting down');
    this.cleanupSocketListeners();
    this.hasJoinedScene = false;
    this.existingPlayers.clear();
  }

  createAnimations() {
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
        { key: 'attackLeft', start: 52, end: 55 },
        { key: 'die', start: 54, end: 57 }
    ];

    animations.forEach(anim => {
        if (!this.anims.exists(anim.key)) {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers('player', { 
                    start: anim.start, 
                    end: anim.end 
                }),
                frameRate: 10,
                repeat: anim.key.startsWith('attack') || anim.key === 'die' ? 0 : -1
            });
        }
    });
  }

  addOtherPlayer(playerInfo) {
    if (!playerInfo) return null;

    try {
        console.log('Adding other player:', playerInfo);
        
        // Destroy existing player if it exists
        if (this.otherPlayers[playerInfo.playerId]) {
            this.otherPlayers[playerInfo.playerId].destroy();
        }
        
        const otherPlayer = this.physics.add.sprite(
            playerInfo.x || this.game.config.width / 2,
            playerInfo.y || this.game.config.height / 2,
            'player'
        ).setScale(1);

        // Set up physics body
        otherPlayer.setBodySize(24, 28);
        otherPlayer.setOffset(10, 13);
        otherPlayer.setBounce(0.2);
        otherPlayer.setCollideWorldBounds(true);
        
        // Enable physics but disable gravity
        otherPlayer.body.setAllowGravity(false);
        
        // Set initial animation
        if (this.anims.exists('idleDown')) {
            otherPlayer.play('idleDown');
        }

        // Store player info
        otherPlayer.playerInfo = playerInfo;
        otherPlayer.playerId = playerInfo.playerId;

        // Add to tracking
        this.otherPlayers[playerInfo.playerId] = otherPlayer;
        
        if (this.otherPlayersGroup) {
            this.otherPlayersGroup.add(otherPlayer);
        }

        console.log('Successfully added other player:', playerInfo.playerId);
        return otherPlayer;
    } catch (error) {
        console.error('Error in addOtherPlayer:', error);
        return null;
    }
  }

  removePlayer(playerId) {
    this.otherPlayersGroup.getChildren().forEach((player) => {
        if (player.playerId === playerId) {
            player.destroy();
        }
    });
  }

  createPlayerWithListeners(playerId, playerInfo) {
    // Check if player already exists using the Set
    if (this.existingPlayers.has(playerId)) {
        console.log('Player already exists:', playerId);
        return this.playerWorldPosition[playerId]?.sprite;
    }

    console.log('Actually creating new player:', playerId);
    const spawnPoint = this.getSpawnPoint();
    const playerSprite = this.physics.add.sprite(
        spawnPoint.x,
        spawnPoint.y,
        'player'
    ).setScale(1);

    playerSprite.setBodySize(24, 28);
    playerSprite.setOffset(10, 13);
    playerSprite.setBounce(0.2);
    playerSprite.setCollideWorldBounds(true);
    playerSprite.body.setAllowGravity(false);
    
    playerSprite.play('idleDown');
    playerSprite.life = 100; // Make sure to set initial life

    this.playerWorldPosition[playerId] = {
        x: spawnPoint.x,
        y: spawnPoint.y,
        sprite: playerSprite,
        animation: 'idleDown',
        flipX: false
    };

    // Only add to group if it exists
    if (this.playersGroup) {
        this.playersGroup.add(playerSprite);
    } else {
        console.warn('playersGroup not initialized');
    }
    
    this.existingPlayers.add(playerId);

    return playerSprite;
  }

  handlePlayerCollision(player1, player2) {
    // Handle player collision logic here
    console.log('Players collided!');
  }

  sendPlayerUpdate() {
    if (this.player && this.socket) {
        const now = Date.now();
        const playerInfo = {
            x: this.player.x,
            y: this.player.y,
            animation: this.player.anims.currentAnim?.key || 'idleDown',
            flipX: this.player.flipX,
            scene: 'BridgeScene'
        };

        // Only send update if enough time has passed and position/state has changed
        if (now - this.lastMovementUpdate >= this.movementUpdateInterval && 
            this.hasPlayerStateChanged(playerInfo)) {
            
            this.socket.emit('playerMovement', playerInfo);
            this.lastMovementUpdate = now;
            this.lastPosition = { ...playerInfo };
        }
    }
  }

  updatePlayerInWorld(playerId, playerInfo) {
    const playerData = this.playerWorldPosition[playerId];
    if (playerData?.sprite) {
        // Update position
        playerData.x = playerInfo.x;
        playerData.y = playerInfo.y;
        playerData.sprite.setPosition(playerInfo.x, playerInfo.y);

        // Update animation
        if (playerInfo.animation && playerData.animation !== playerInfo.animation) {
            playerData.animation = playerInfo.animation;
            playerData.sprite.play(playerInfo.animation, true);
        }

        // Update flip
        if (playerInfo.flipX !== undefined && playerData.flipX !== playerInfo.flipX) {
            playerData.flipX = playerInfo.flipX;
            playerData.sprite.setFlipX(playerInfo.flipX);
        }
    }
  }

  clearExistingPlayers() {
    console.log('Clearing existing players');
    Object.entries(this.playerWorldPosition).forEach(([playerId, playerData]) => {
        if (playerData.sprite) {
            playerData.sprite.destroy();
        }
    });
    this.playerWorldPosition = {};
    if (this.playersGroup) {
        this.playersGroup.clear(true, true);
    }
    this.existingPlayers.clear();
  }

  cleanupSocketListeners() {
    if (this.socket) {
        this.socket.removeAllListeners('currentPlayers');
        this.socket.removeAllListeners('newPlayer');
        this.socket.removeAllListeners('playerMoved');
        this.socket.removeAllListeners('playerCount');
    }
  }

  // Helper method to compare Sets
  areSetsEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
        if (!set2.has(item)) return false;
    }
    return true;
  }

  getPlayerDirection() {
    const currentAnim = this.player.anims.currentAnim;
    if (!currentAnim) return 'Down';
    
    // Check for attack animations first
    if (currentAnim.key.includes('attack')) {
        return currentAnim.key.replace('attack', '');
    }
    
    // Then check movement/idle animations
    if (currentAnim.key.includes('Left')) return 'Left';
    if (currentAnim.key.includes('Right')) return 'Right';
    if (currentAnim.key.includes('Up')) return 'Up';
    return 'Down';
  }

  hasPlayerStateChanged(newState) {
    const positionThreshold = 1; // Minimum movement to trigger update
    return Math.abs(this.lastPosition.x - newState.x) > positionThreshold ||
           Math.abs(this.lastPosition.y - newState.y) > positionThreshold ||
           this.lastPosition.animation !== newState.animation ||
           this.lastPosition.flipX !== newState.flipX;
  }
}
