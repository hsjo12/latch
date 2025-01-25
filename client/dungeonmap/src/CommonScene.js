import { AnimationManager } from './managers/AnimationManager'
import { PlayerManager } from './managers/PlayerManager'
import { CombatManager} from './managers/CombatManager'
import Level from './Level.js'
import BackgroundScene from './managers/backgroundscene'

export default class CommonScene extends Phaser.Scene {
  constructor() {
    super('CommonScene')
    this.player = null
    this.otherPlayers = {}
    this.level = new Level()
    this.spike = null
    this.lastEmitTime = 0
    this.socket = null
    this.backgroundScene = null
    this.chatBubbles = {}  // Store chat bubbles for each player
  }

  init(data) {
    // Get socket from BackgroundScene
    this.backgroundScene = this.scene.get('BackgroundScene');
    this.socket = this.backgroundScene.getSocket();
    console.log('Socket received from BackgroundScene:', this.socket.id);
  }

  preload() {
    this.load.image('Apple_Tree', '/assets/Apple_Tree.png')
    this.load.image('Barn', '/assets/Barn.png')
    this.load.image('Beach_Decor_Tiles', '/assets/Beach_Decor_Tiles.png')
    this.load.image('Beach_Tile', '/assets/Beach_Tile.png')
    this.load.image('Birch_Tree', '/assets/Birch_Tree.png')
    this.load.image('Boat', '/assets/Boat.png')
    this.load.image('Cobble_Road_1', '/assets/Cobble_Road_1.png')
    this.load.image('Cobble_Road_2', '/assets/Cobble_Road_2.png')
    this.load.image('Fences', '/assets/Fences.png')
    this.load.image('Fountain', '/assets/Fountain.png')
    this.load.image('Grass_Middle', '/assets/Grass_Middle.png')
    this.load.image('Grass_Tiles_1', '/assets/Grass_Tiles_1.png')
    this.load.image('Water_Middle', '/assets/Water_Middle.png')
    this.load.image('Water_Tile', '/assets/Water_Tile.png')
    this.load.image('Well', '/assets/Well.png')
    this.load.image('With_Hut', '/assets/With_Hut.png')
    this.load.image('Cave_Floor', '/assets/Cave_Floor.png')
    this.load.image('Water_Troughs', '/assets/Water_Troughs.png')

    this.load.tilemapTiledJSON('common', '/assets/common.json')
    this.load.spritesheet('player', '/assets/Spearman.png', {
      frameWidth: 48,
      frameHeight: 48,
    })
  }

  create() {
    this.backgroundScene = this.scene.get('BackgroundScene')
    this.socket = this.backgroundScene.getSocket()
    
    if (!this.socket || !this.socket.connected) {
        console.error('No socket connection available');
        return;
    }

    console.log('Using socket from BackgroundScene:', this.socket.id);

    const spawnData = this.scene.settings.data;
    if (spawnData && spawnData.x && spawnData.y) {
        this.game.config.width = spawnData.x;
        this.game.config.height = spawnData.y;
    }

    const map = this.make.tilemap({ key: 'common' })
    const grass = map.addTilesetImage('Grass_Middle', 'Grass_Middle')
    const water = map.addTilesetImage('Water_Tile', 'Water_Tile')
    const waterMiddle = map.addTilesetImage('Water_Middle', 'Water_Middle')
    const Cobble_Road_1 = map.addTilesetImage('Cobble_Road_1', 'Cobble_Road_1')
    const Grass_Tiles_1 = map.addTilesetImage('Grass_Tiles_1', 'Grass_Tiles_1')
    const Cave_Floor = map.addTilesetImage('Cave_Floor', 'Cave_Floor')
    const beachDecorTiles = map.addTilesetImage(
      'Beach_Decor_Tiles',
      'Beach_Decor_Tiles'
    )
    const layer1 = map.createLayer(
      'floor',
      [
        grass,
        waterMiddle,
        water,
        beachDecorTiles,
        Cobble_Road_1,
        Grass_Tiles_1,
        Cave_Floor,
      ],
      0,
      0
    )
    layer1
      .setScale(1, 1)
      .setOrigin(0, 0)
      .setCollisionByProperty({ collider: true })

    const Fountain = map.addTilesetImage('Fountain', 'Fountain')
    const Barn = map.addTilesetImage('Barn', 'Barn')
    const Fences = map.addTilesetImage('Fences', 'Fences')
    const Well = map.addTilesetImage('Well', 'Well')
    const Boat = map.addTilesetImage('Boat', 'Boat')
    const With_Hut = map.addTilesetImage('With_Hut', 'With_Hut')
    const Birch_Tree = map.addTilesetImage('Birch_Tree', 'Birch_Tree')
    const Apple_Tree = map.addTilesetImage('Apple_Tree', 'Apple_Tree')
    const Water_Troughs = map.addTilesetImage('Water_Troughs', 'Water_Troughs')
    const objectLayer = map.createLayer(
      'objects',
      [
        Fountain,
        Barn,
        Fences,
        Well,
        Boat,
        With_Hut,
        Birch_Tree,
        Apple_Tree,
        Grass_Tiles_1,
        Cave_Floor,
        Water_Troughs,
      ],
      0,
      0
    )
    objectLayer
      .setScale(1, 1)
      .setOrigin(0, 0)
      .setCollisionByProperty({ collider: true })

    // Clear any existing labels first
    this.children.list
        .filter(child => child.type === 'Text')
        .forEach(label => label.destroy());

    // Track positions where we've already placed labels
    const labelPositions = new Set();

    // Function to check if position is too close to existing labels
    const isTooClose = (x, y) => {
        for (let pos of labelPositions) {
            const [existingX, existingY] = pos.split(',').map(Number);
            const distance = Math.sqrt(Math.pow(existingX - x, 2) + Math.pow(existingY - y, 2));
            if (distance < 50) { // Adjust this number to change how close labels can be
                return true;
            }
        }
        return false;
    };

    // Add permanent scene transition label for dungeon (just one)
    const dungeonTiles = objectLayer.filterTiles(tile => tile.properties.dungeon);
    if (dungeonTiles.length > 0) {
        // Only use the first dungeon tile for the label
        const tile = dungeonTiles[7];
        const posKey = `${tile.pixelX},${tile.pixelY}`;
        this.add.text(tile.pixelX, tile.pixelY - 20, 'Battle (Dungeon)', {
            fontFamily: 'Verdana',
            fontSize: '10px',
            fill: '#fff',
            backgroundColor: '',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
        labelPositions.add(posKey);
    }

    // Add permanent scene transition label for bridge
    const bridgeTiles = objectLayer.filterTiles(tile => tile.properties.bridge);
    bridgeTiles.forEach(tile => {
        const posKey = `${tile.pixelX},${tile.pixelY}`;
        if (!isTooClose(tile.pixelX, tile.pixelY)) {
            this.add.text(tile.pixelX + 16, tile.pixelY - 20, 'Battle (Bridge)', {
                fontFamily: 'Verdana',
                fontSize: '10px',
                fill: '#fff',
                backgroundColor: '',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            labelPositions.add(posKey);
        }
    });

    this.player = this.physics.add
      .sprite(this.game.config.width / 2, this.game.config.height / 2, 'player')
      .setScale(1)

    this.player.setCollideWorldBounds(true)
    this.player.life = 100
    this.player.attack = 0
    this.player.weapon = 'sword'
    this.player.setScale(1) // Scale the player sprite by 1.5 times
    this.player.setBodySize(24, 28)
    this.player.setOffset(10, 13)
    this.cursors = this.input.keyboard.createCursorKeys()
    this.anims.create({
      key: 'idleDown',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    })
    let element = document.getElementById('input-box')
    const yesButton = document.getElementById('yes')
    const noButton = document.getElementById('no')
    this.physics.add.collider(this.player, layer1)
    this.physics.add.collider(this.player, objectLayer, (a, b) => {
      if (b?.properties?.dungeon) {
        element.style.display = 'block'
        yesButton.addEventListener('click', () => {
          this.socket.emit('leaveCommonScene');
          this.scene.start('DungeonScene');
          element.style.display = 'none'
        })
        noButton.addEventListener('click', () => {
          element.style.display = 'none'
        })
      }
      if (b?.properties?.bridge) {
        element.style.display = 'block'
        yesButton.addEventListener('click', () => {
          this.socket.emit('leaveCommonScene');
          this.scene.start('BridgeScene');
          element.style.display = 'none'
        })
        noButton.addEventListener('click', () => {
          element.style.display = 'none'
        })
      }
    })

    // this.cameras.main.setBounds(0, 0, +this.game.config.width, +this.game.config.height);
    this.cameras.main.startFollow(this.player, true)
    this.cameras.main.setFollowOffset(-50, -50)
  

    // Add other idle animations if missing
    this.anims.create({
      key: 'idleLeft',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'idleRight',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'idleUp',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'walkDown',
      frames: this.anims.generateFrameNumbers('player', { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'walkRight',
      frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'walkUp',
      frames: this.anims.generateFrameNumbers('player', { start: 30, end: 35 }),
      frameRate: 10,
      repeat: -1,
    })

    // Attack animations
    this.anims.create({
      key: 'attackDown',
      frames: this.anims.generateFrameNumbers('player', { start: 36, end: 41 }),
      frameRate: 10,
      repeat: 0  // Don't repeat attack animations
    });

    this.anims.create({
      key: 'attackRight',
      frames: this.anims.generateFrameNumbers('player', { start: 42, end: 47 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'attackUp',
      frames: this.anims.generateFrameNumbers('player', { start: 48, end: 53 }),
      frameRate: 10,
      repeat: 0
    });

    // Attack Left uses the same frames as Attack Right but flipped
    this.anims.create({
      key: 'attackLeft',
      frames: this.anims.generateFrameNumbers('player', { start: 42, end: 47 }),
      frameRate: 10,
      repeat: 0
    });

    AnimationManager.createAnimations(this)
    this.player.play('idleDown')
    this.handleSocketEvents()

    // Add a attack kek
    this.attackKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    // Add inventory key
    this.inventoryKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.I
    )

    // Create inventory (initially hidden)
    this.createInventory()

    // Add isAttacking flag
    this.player.isAttacking = false

    // When colliding with portal
    this.physics.add.overlap(this.player, this.portal, () => {
        // Tell server we're leaving this scene
        this.socket.emit('leaveCommonScene');
        
        // Start BridgeScene
        this.scene.start('BridgeScene');
    });

    // Setup multiplayer events
    this.socket.on('gameState', (state) => {
        if (!state.players) return;
        
        Object.entries(state.players).forEach(([playerId, playerData]) => {
            // Skip if it's not the current player and not in otherPlayers
            if (playerId !== this.socket.id && !this.otherPlayers[playerId]) {
                if (!this.reportedPlayers?.includes(playerId)) {
                    console.log('New player detected:', playerId);
                    this.reportedPlayers = [...(this.reportedPlayers || []), playerId];
                }
                return;
            }

            const player = playerId === this.socket.id ? this.player : this.otherPlayers[playerId];
            
            if (!player || !player.anims) return;

            // Update position
            player.x = Phaser.Math.Linear(player.x, playerData.x, 0.3);
            player.y = Phaser.Math.Linear(player.y, playerData.y, 0.3);

            // Handle animations and direction
            if (playerData.animation.includes('walk')) {
                if (playerData.animation === 'walkLeft') {
                    player.play('walkLeft', true);
                    player.flipX = true;
                    player.lastDirection = 'Left';
                } else {
                    player.play(playerData.animation, true);
                    player.flipX = false;
                    player.lastDirection = playerData.animation.replace('walk', '');
                }
            } else {
                // Handle idle animations
                if (player.lastDirection === 'Left') {
                    player.play('idleLeft', true);
                    player.flipX = true;
                } else {
                    player.play(`idle${player.lastDirection || 'Down'}`, true);
                    player.flipX = false;
                }
            }
        });
    });

    // Join the scene
    this.socket.emit('joinScene', { 
        scene: 'CommonScene',
        x: this.game.config.width / 2,
        y: this.game.config.height / 2
    });

    // Create chat input
    this.createChatInput();

    // Listen for chat messages
    this.socket.on('chatMessage', (data) => {
        if (data.playerId !== this.socket.id) {  // Don't add our own messages twice
            addMessage(data.playerId, data.message);
        }
    });
  }

  update(time) {
    console.log('Socket status:', this.socket?.connected);
    console.log('Player exists:', !!this.player);
    
    if (!this.player || !this.socket) return;

    // Send input state to server
    const input = {
        left: this.cursors.left.isDown,
        right: this.cursors.right.isDown,
        up: this.cursors.up.isDown,
        down: this.cursors.down.isDown,
        attack: this.input.keyboard.addKey('SPACE').isDown  // Add attack input
    };

    // Only send input updates when they change
    if (JSON.stringify(input) !== JSON.stringify(this.lastInput)) {
        this.socket.emit('playerInput', {
            input: input
        });
        this.lastInput = input;
    }

    // Animation is now based on server-provided state
    if (this.player.serverState) {
        this.player.play(this.player.serverState.animation, true);
        this.player.setFlipX(this.player.serverState.flipX);
    }
  }

  setupMultiplayerEvents() {
    // Handle server-authoritative state updates
    this.events.on('gameState', (state) => {
        // Update all players based on server state
        Object.keys(state.players).forEach((playerId) => {
            const playerState = state.players[playerId];
            
            if (playerId === this.socket.id) {
                // Update local player
                this.player.setPosition(playerState.x, playerState.y);
                this.player.serverState = playerState;
            } else {
                // Update other players
                if (!this.otherPlayers[playerId]) {
                    this.addOtherPlayer(playerState);
                } else {
                    const otherPlayer = this.otherPlayers[playerId];
                    otherPlayer.setPosition(playerState.x, playerState.y);
                    otherPlayer.play(playerState.animation, true);
                    otherPlayer.setFlipX(playerState.flipX);
                }
            }
        });
    });

    // Handle server-validated scene transitions
    this.events.on('sceneTransition', (data) => {
        if (data.playerId === this.socket.id) {
            this.backgroundScene.events.emit('switchScene', data);
        }
    });

    // Other event handlers remain similar but wait for server validation
  }

  handleAttack() {
    // Send attack intent to server instead of handling locally
    this.socket.emit('attackIntent', {
        scene: 'CommonScene',
        position: {
            x: this.player.x,
            y: this.player.y
        }
    });
  }

  handleSocketEvents() {
    const socket = this.socket

    socket.on('currentPlayers', (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === socket.id) {
          this.player.setPosition(players[id].x, players[id].y)
          this.player.lastDirection = players[id].lastDirection
        } else {
          this.addOtherPlayer(players[id])
        }
      })
    })

    socket.on('newPlayer', (playerInfo) => {
      console.log('New player connected:', playerInfo)
      this.addOtherPlayer(playerInfo)
    })

    socket.on('playerMoved', (playerInfo) => {
        if (!playerInfo || !playerInfo.playerId) return;

        // Handle local player
        if (playerInfo.playerId === this.socket.id) {
            if (this.player && this.player.anims && !this.player.isAttacking) {
                try {
                    this.player.anims.play(playerInfo.animation, true);
                    this.player.flipX = playerInfo.flipX;
                    this.player.lastDirection = playerInfo.lastDirection;
                } catch (error) {
                    console.warn('Local player animation error:', error);
                }
            }
        } 
        // Handle other players
        else if (this.otherPlayers && this.otherPlayers[playerInfo.playerId]) {
            const otherPlayer = this.otherPlayers[playerInfo.playerId];
            
            // Update position
            if (otherPlayer && typeof otherPlayer.setPosition === 'function') {
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }

            // Update animation
            if (otherPlayer && otherPlayer.anims && !otherPlayer.isAttacking) {
                try {
                    if (playerInfo.animation && this.anims.exists(playerInfo.animation)) {
                        otherPlayer.anims.play(playerInfo.animation, true);
                    }
                    if (typeof playerInfo.flipX !== 'undefined') {
                        otherPlayer.flipX = playerInfo.flipX;
                    }
                    if (playerInfo.lastDirection) {
                        otherPlayer.lastDirection = playerInfo.lastDirection;
                    }
                } catch (error) {
                    console.warn('Other player animation error:', error);
                }
            }
        }
    });

    socket.on('playerAttacked', (data) => {
      if (this.otherPlayers[data.target]) {
        this.otherPlayers[data.target].life = data.life
        console.log('Player attacked:', data)
      }
    })
    socket.on('playerAttackAnimation', (data) => {
      console.log('Received attack animation:', data)

      if (data.attacker === this.socket.id) {
        return
      }
      const otherPlayer = this.otherPlayers[data.attacker]
      if (otherPlayer) {
        PlayerManager.handleOtherPlayerAttack(
          otherPlayer,
          data.animation,
          data.direction
        )
      }
    })

    socket.on('playerDefeated', (playerId) => {
        CombatManager.handlePlayerDeath(this, playerId)
        console.log('Player defeated:', playerId)
      
    })

    socket.on('playerDisconnected', (playerId) => {
      if (this.otherPlayers[playerId]) {
        this.otherPlayers[playerId].destroy()
        delete this.otherPlayers[playerId]
      }
    })
  }

  addOtherPlayer(playerInfo) {
    try {
        const otherPlayer = this.physics.add.sprite(
            playerInfo.x || 400,
            playerInfo.y || 300,
            'player'
        );

        otherPlayer.setScale(1);
        otherPlayer.playerId = playerInfo.playerId;
        otherPlayer.life = playerInfo.life || 100;
        otherPlayer.attack = playerInfo.attack || 10;
        otherPlayer.setCollideWorldBounds(true);
        otherPlayer.setBodySize(24, 28);
        otherPlayer.setOffset(10, 13);

        if (this.layer1) {
            this.physics.add.collider(otherPlayer, this.layer1);
        }

        this.otherPlayers[playerInfo.playerId] = otherPlayer;
        otherPlayer.play('idleDown');

        console.log('Added player:', playerInfo.playerId);
        return otherPlayer;

    } catch (error) {
        console.error('Error in addOtherPlayer:', error);
        return null;
    }
  }

  createInventory() {
    // Create inventory container
    const padding = 10
    const cellSize = 40
    const rows = 4
    const cols = 6
    const width = cellSize * cols + padding * 2
    const height = cellSize * rows + padding * 2

    // Position in center of screen
    const x = this.cameras.main.centerX - width / 2
    const y = this.cameras.main.centerY - height / 2

    // Create semi-transparent background
    this.inventoryBg = this.add
      .rectangle(x, y, width, height, 0x000000)
      .setOrigin(0, 0)
      .setAlpha(0.7)
      .setScrollFactor(0)
      .setDepth(1000);

    // Create grid cells
    this.inventorySlots = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slotX = x + padding + col * cellSize
        const slotY = y + padding + row * cellSize

        // Create slot background
        const slot = this.add
          .rectangle(slotX, slotY, cellSize - 2, cellSize - 2, 0x666666)
          .setOrigin(0, 0)
          .setAlpha(0.8)
          .setScrollFactor(0)
          .setDepth(1001);

        this.inventorySlots.push(slot)
      }
    }

    // Hide inventory initially
    this.hideInventory()
  }

  hideInventory() {
    this.inventoryBg.setVisible(false)
    this.inventorySlots.forEach((slot) => slot.setVisible(false))
  }

  showInventory() {
    this.inventoryBg.setVisible(true)
    this.inventorySlots.forEach((slot) => slot.setVisible(true))
  }

  update(time, delta) {
    if (!this.player) return;

    // Update depths based on Y position, but keep lower than UI elements
    this.player.setDepth(this.player.y + 100); // Base player depth on Y position
    
    Object.values(this.otherPlayers).forEach(otherPlayer => {
        otherPlayer.setDepth(otherPlayer.y + 100); // Same for other players
    });

    const speed = 80;
    let animation = 'idleDown'; // Change default idle animation

    // Stop any previous movement
    this.player.body.setVelocity(0);

    if (!this.player.isAttacking) {
        // Track last pressed direction
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
            animation = 'walkLeft';
            this.player.lastDirection = 'Left';
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
            animation = 'walkRight';
            this.player.lastDirection = 'Right';
            this.player.flipX = false;
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
            animation = 'walkUp';
            this.player.lastDirection = 'Up';
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
            animation = 'walkDown';
            this.player.lastDirection = 'Down';
        }

        // If no movement keys are pressed, play the correct idle animation
        if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
            animation = `idle${this.player.lastDirection || 'Down'}`;
        }

        // Play the animation
        if (this.anims.exists(animation)) {  // Check if animation exists before playing
            this.player.anims.play(animation, true);
        }
    }

    // Emit movement to server
    if (time - this.lastEmitTime > 16) {
        this.socket.emit('playerInput', {
            x: this.player.x,
            y: this.player.y,
            animation: animation,
            flipX: this.player.flipX,
            lastDirection: this.lastDirection,
        });
        this.lastEmitTime = time;
    }

    // Handle attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.handleAttack();
    }

    // Handle inventory toggle
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
        if (this.inventoryBg.visible) {
            this.hideInventory();
        } else {
            this.showInventory();
        }
    }

    // Update health bar
    if (this.healthBar) {
        const yOffset = -20;
        const width = 40;
        
        this.healthBar.outline.x = this.player.x;
        this.healthBar.outline.y = this.player.y + yOffset;
        this.healthBar.background.x = this.player.x;
        this.healthBar.background.y = this.player.y + yOffset;
        
        this.healthBar.bar.x = this.player.x - width/2;
        this.healthBar.bar.y = this.player.y + yOffset;
        this.healthBar.bar.width = (this.player.life / 100) * width;
    }
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
        // Get the current direction from the player's last movement
        const direction = this.player.lastDirection || 'Down';
        
        // Set the attack animation based on direction
        const attackAnim = `attack${direction}`;
        
        // Pass both the animation and direction to handleAttack
        PlayerManager.handleAttack(this, this.player, closestPlayer.playerId, attackAnim);
        console.log('Attacking player:', closestPlayer.playerId, 'with animation:', attackAnim);
    }
  }

  renderGameState(state) {
    Object.entries(state.players).forEach(([playerId, playerData]) => {
      if (playerId === this.socket.id) {
        this.renderPlayer(playerData);
      } else {
        this.renderOtherPlayer(playerId, playerData);
      }
    });
  }

  renderPlayer(playerData) {
    if (!this.player) {
      this.player = this.add.sprite(playerData.x, playerData.y, 'player');
    }
    this.player.setPosition(playerData.x, playerData.y);
    this.player.flipX = playerData.flipX;
    if (playerData.animation) {
      this.player.play(playerData.animation, true);
    }
  }

  renderOtherPlayer(playerId, playerData) {
    if (!this.otherPlayers[playerId]) {
      this.otherPlayers[playerId] = this.add.sprite(playerData.x, playerData.y, 'player');
    }
    const otherPlayer = this.otherPlayers[playerId];
    otherPlayer.setPosition(playerData.x, playerData.y);
    otherPlayer.flipX = playerData.flipX;
    if (playerData.animation) {
      otherPlayer.play(playerData.animation, true);
    }
  }

  createChatInput() {
    // Check if chat already exists, if so, return early
    if (document.getElementById('game-chat-container')) {
        return;
    }

    // Add bad words filter
    const badWords = [
        'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cunt', 
        'bastard', 'damn', 'piss', 'cock', 'slut', 'whore',
        // Add more words as needed
    ];

    // Function to filter bad words
    const filterMessage = (message) => {
        let filteredMessage = message.toLowerCase();
        badWords.forEach(word => {
            // Create a regular expression that matches the word with possible special characters
            const regex = new RegExp(word.split('').join('[^a-zA-Z]*'), 'gi');
            // Replace bad word with asterisks
            filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
        });
        return filteredMessage;
    };

    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.style.position = 'absolute';
    chatContainer.style.bottom = '65px';
    chatContainer.style.right = '20px';
    chatContainer.style.width = '260px';
    chatContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    chatContainer.style.borderRadius = '5px';
    chatContainer.style.padding = '5px';
    chatContainer.style.zIndex = '1000';
    chatContainer.style.minHeight = '30px';  // Added minimum height

    // Create minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '−';
    minimizeButton.style.position = 'absolute';
    minimizeButton.style.right = '5px';
    minimizeButton.style.top = '5px';
    minimizeButton.style.padding = '0px 6px';
    minimizeButton.style.backgroundColor = 'transparent';
    minimizeButton.style.border = '1px solid white';
    minimizeButton.style.color = 'white';
    minimizeButton.style.cursor = 'pointer';
    minimizeButton.style.fontSize = '20px';   // Increased font size
    minimizeButton.style.lineHeight = '20px'; // Centered the symbol vertically
    chatContainer.appendChild(minimizeButton);

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.style.height = '200px';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.marginTop = '25px';  // Space for minimize button
    messagesContainer.style.color = 'white';
    messagesContainer.style.fontSize = '14px';
    messagesContainer.style.wordBreak = 'break-word';
    chatContainer.appendChild(messagesContainer);

    // Create chat input element
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Type message...';
    chatInput.style.position = 'absolute';
    chatInput.style.bottom = '20px';
    chatInput.style.right = '80px';
    chatInput.style.width = '200px';
    chatInput.style.padding = '5px';
    chatInput.style.zIndex = '1000';
    chatInput.style.height = '25px';

    // Create send button
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.position = 'absolute';
    sendButton.style.bottom = '20px';
    sendButton.style.right = '20px';
    sendButton.style.padding = '5px 10px';
    sendButton.style.zIndex = '1000';
    sendButton.style.height = '25px';
    sendButton.style.verticalAlign = 'top';

    // Update chat input styling
    chatInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    chatInput.style.color = 'white';
    chatInput.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    chatInput.style.borderRadius = '5px';
    chatInput.style.padding = '5px 10px';
    chatInput.style.outline = 'none';
    chatInput.style.width = '200px';
    
    // Update send button styling to match
    sendButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    sendButton.style.color = 'white';
    sendButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    sendButton.style.borderRadius = '5px';
    sendButton.style.padding = '5px 10px';
    sendButton.style.cursor = 'pointer';

    // Add to document
    document.body.appendChild(chatContainer);
    document.body.appendChild(chatInput);
    document.body.appendChild(sendButton);

    // Minimize functionality
    let isMinimized = false;
    minimizeButton.addEventListener('click', () => {
        isMinimized = !isMinimized;
        messagesContainer.style.display = isMinimized ? 'none' : 'block';
        minimizeButton.textContent = isMinimized ? '+' : '−';
        chatContainer.style.height = isMinimized ? 'auto' : 'auto';
    });

    // Remove the duplicate sendMessage function and keep just one
    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
            const filteredMessage = filterMessage(message);
            // Send message with player ID
            this.socket.emit('chatMessage', {
                playerId: this.socket.id,
                message: filteredMessage
            });
            chatInput.value = '';
            chatInput.blur();
            this.input.keyboard.enabled = true;
        }
    };

    // Update message display function to use filter for incoming messages
    const addMessage = (socketId, message) => {
        const messageElement = document.createElement('div');
        messageElement.style.marginBottom = '5px';
        messageElement.style.padding = '3px';
        
        // Highlight our own messages
        if (socketId === this.socket.id) {
            messageElement.innerHTML = `<span style="color: #00ff00">[${socketId}]:</span> ${message}`;  // Green color for own messages
        } else {
            messageElement.innerHTML = `<span style="color: #888">[${socketId}]:</span> ${message}`;  // Grey for others
        }
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Disable game input when chat is focused
    chatInput.addEventListener('focus', (e) => {
        e.stopPropagation();
        this.input.keyboard.enabled = false;
    });

    chatInput.addEventListener('blur', (e) => {
        e.stopPropagation();
        this.input.keyboard.enabled = true;
    });

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Store references for cleanup
    this.chatInput = chatInput;
    this.sendButton = sendButton;
    this.chatContainer = chatContainer;

    // Add chat message handler if not already in handleSocketEvents
    this.socket.on('chatMessage', (data) => {
        console.log('Received chat message:', data); // Debug log
        addMessage(data.playerId, data.message);
    });
  }

  showChatBubble(playerId, message) {
    // Remove existing bubble for this player if it exists
    if (this.chatBubbles[playerId]) {
        this.chatBubbles[playerId].destroy();
    }

    // Get player position
    const player = playerId === this.socket.id ? this.player : this.otherPlayers[playerId];
    if (!player) return;

    // Create background rectangle
    const padding = 0;
    const bubbleWidth = 150;
    const bubbleHeight = 40;
    
    const bubble = this.add.container(player.x, player.y - 60);

    // Add semi-transparent background
    const background = this.add.rectangle(
        0,
        0,
        bubbleWidth,
        bubbleHeight,
        0x000000,
        0.5  // Alpha value for transparency
    );
    
    // Add text
    const text = this.add.text(
        0,
        0,
        message,
        {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: bubbleWidth - padding * 2 }
        }
    );
    
    // Center text in bubble
    text.setPosition(
        -text.width / 2,
        -text.height / 2
    );

    // Add to container
    bubble.add([background, text]);

    // Store bubble reference
    this.chatBubbles[playerId] = bubble;

    // Destroy bubble after 5 seconds
    this.time.delayedCall(5000, () => {
        if (this.chatBubbles[playerId] === bubble) {
            bubble.destroy();
            delete this.chatBubbles[playerId];
        }
    });
  }

  // Add cleanup in scene shutdown
  shutdown() {
    if (this.chatInput) {
        this.chatInput.remove();
    }
    if (this.sendButton) {
        this.sendButton.remove();
    }
    if (this.chatContainer) {
        this.chatContainer.remove();
    }
  }
}
