import { AnimationManager } from './managers/AnimationManager'
import { PlayerManager } from './managers/PlayerManager'
import { CombatManager} from './managers/CombatManager'
import Level from './Level.js'
import { io } from 'socket.io-client'
import { XPBar } from './managers/XPBar'
const socketUrl = "https://latch.netlify.app/game";

export default class CommonScene extends Phaser.Scene {
  constructor() {
    super('CommonScene')
    this.player = null
    this.otherPlayers = {}
    this.level = new Level()
    this.spike = null
    this.lastEmitTime = 0
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

    // Add permanent scene transition labels
    const dungeonTiles = objectLayer.filterTiles(tile => tile.properties.dungeon);
    dungeonTiles.forEach(tile => {
        const posKey = `${tile.pixelX},${tile.pixelY}`;
        if (!isTooClose(tile.pixelX, tile.pixelY)) {
            this.add.text(tile.pixelX, tile.pixelY - 20, 'Battle', {
                fontFamily: 'Verdana',
                fontSize: '10px',
                fill: '#fff',
                backgroundColor: '',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            labelPositions.add(posKey);
        }
    });

    const bridgeTiles = objectLayer.filterTiles(tile => tile.properties.bridge);
    bridgeTiles.forEach(tile => {
        const posKey = `${tile.pixelX},${tile.pixelY}`;
        if (!isTooClose(tile.pixelX, tile.pixelY)) {
            this.add.text(tile.pixelX + 16, tile.pixelY - 20, 'Battle', {
                fontFamily: 'Verdana',
                fontSize: '10px',
                fill: '#fff',
                backgroundColor: '',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            labelPositions.add(posKey);
        }
    });

    this.socket = io(socketId, {
      withCredentials: false,
    })
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
          this.socket.emit('changeScene', {
            from: 'CommonScene',
            to: 'DungeonScene'
          });
          this.scene.start('DungeonScene')
          element.style.display = 'none'
        })
        noButton.addEventListener('click', () => {
          element.style.display = 'none'
        })
      }
      if (b?.properties?.bridge) {
        element.style.display = 'block'
        yesButton.addEventListener('click', () => {
          this.scene.start('BridgeScene')
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

    // Create XP bar with debug logging
    console.log('Creating XP bar...');
    this.xpBar = new XPBar(this);
    
    // Test if XP bar exists and has required methods
    console.log('XP Bar created:', {
        exists: !!this.xpBar,
        background: !!this.xpBar?.background,
        fillBar: !!this.xpBar?.fillBar,
        levelText: !!this.xpBar?.levelText,
        xpText: !!this.xpBar?.xpText
    });

    // Force an initial update
    this.xpBar.update(50, 1); // Changed from setXP to update

    // Listen for XP updates
    this.socket.on('xpUpdate', (data) => {
        if (data.playerId === this.socket.id) {
            this.xpBar.update(data.xp, data.level); // Changed from setXP to update
        }
    });

    // Request initial XP data
    this.socket.emit('requestXPData');
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
    const otherPlayer = this.physics.add.sprite(
      playerInfo.x,
      playerInfo.y,
      'player'
    )
    otherPlayer.playerId = playerInfo.playerId
    otherPlayer.life = playerInfo.life
    otherPlayer.attack = playerInfo.attack
    otherPlayer.weapon = playerInfo.weapon
    otherPlayer.lastDirection = playerInfo.lastDirection || 'Down'
    otherPlayer.isAttacking = false
    otherPlayer.setScale(1)
    this.otherPlayers[playerInfo.playerId] = otherPlayer
    console.log('Added other player:', playerInfo)
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
    let animation = this.lastDirection ? 'idle' + this.lastDirection : 'idleDown';

    // Stop any previous movement
    this.player.body.setVelocity(0);

    if (!this.player.isAttacking) {
        // Handle movement and set last direction
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
            animation = 'walkRight';
            this.lastDirection = 'Right';
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
            animation = 'walkRight';
            this.lastDirection = 'Right';
            this.player.flipX = false;
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
            animation = 'walkUp';
            this.lastDirection = 'Up';
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
            animation = 'walkDown';
            this.lastDirection = 'Down';
        }

        // Normalize and scale the velocity
        this.player.body.velocity.normalize().scale(speed);

        // Play the animation
        this.player.anims.play(animation, true);
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
    let closestPlayer = null
    let closestDistance = Infinity

    Object.keys(this.otherPlayers).forEach((id) => {
      const otherPlayer = this.otherPlayers[id]
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        otherPlayer.x,
        otherPlayer.y
      )
      if (distance < closestDistance) {
        closestDistance = distance
        closestPlayer = otherPlayer
      }
    })

    if (closestPlayer && closestDistance < 50) {
      // Adjust attack range as needed
      // this.socket.emit('attackPlayer', closestPlayer.playerId)
      PlayerManager.handleAttack(this, this.player, closestPlayer.playerId)
      console.log('Attacking player:', closestPlayer.playerId)
    }
  }
}
