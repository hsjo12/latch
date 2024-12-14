import Phaser from 'phaser'
import Level from './Level.js'
import { io } from 'socket.io-client'

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

    // const tileset2 = map.addTilesetImage("pillars", "pillars");
    // const layer3 = map.createLayer("pillars", tileset2, 0, 0);
    // layer3.setScale(1, 1).setOrigin(0, 0);
    // layer3.setCollisionByProperty({ collider: true });

    this.socket = io('http://localhost:3000', {
      withCredentials: false,
    })
    this.player = this.physics.add
      .sprite(this.game.config.width / 2, this.game.config.height / 2, 'player')
      .setScale(1)

    this.player.setCollideWorldBounds(true)
    this.player.life = 100
    this.player.attack = 10
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

    this.physics.add.collider(this.player, layer1)
    this.physics.add.collider(this.player, objectLayer, (a, b) => {
      if (b?.properties?.dungeon) {
        this.scene.start('DungeonScene')
      }
      if (b?.properties?.bridge) {
        this.scene.start('BridgeScene')
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

    this.anims.create({
      key: 'attackDown',
      frames: this.anims.generateFrameNumbers('player', { start: 36, end: 39 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'attackRight',
      frames: this.anims.generateFrameNumbers('player', { start: 42, end: 45 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'attackUp',
      frames: this.anims.generateFrameNumbers('player', { start: 48, end: 51 }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNumbers('player', { start: 54, end: 56 }),
      frameRate: 10,
      repeat: 0,
    })
    this.player.play('idleDown')
    this.handleSocketEvents()

    // Add a attack kek
    this.attackKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )
  }

  handleSocketEvents() {
    const socket = this.socket

    socket.on('currentPlayers', (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === socket.id) {
          this.player.setPosition(players[id].x, players[id].y)
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
      if (this.otherPlayers[playerInfo.playerId]) {
        this.otherPlayers[playerInfo.playerId].setPosition(
          playerInfo.x,
          playerInfo.y
        )
        this.otherPlayers[playerInfo.playerId].anims.play(playerInfo.animation, true)
      }
    })

    socket.on('playerAttacked', (data) => {
      if (this.otherPlayers[data.target]) {
        this.otherPlayers[data.target].life = data.life
        console.log('Player attacked:', data)
      }
    })

    socket.on('playerDefeated', (playerId) => {
      if (this.otherPlayers[playerId]) {
        this.otherPlayers[playerId].destroy()
        delete this.otherPlayers[playerId]
        console.log('Player defeated:', playerId)
      }
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
    this.otherPlayers[playerInfo.playerId] = otherPlayer
    console.log('Added other player:', playerInfo)
  }
  update(time, delta) {
    const speed = 80
    const prevVelocity = this.player.body.velocity.clone()
    let newX = this.player.x
    let newY = this.player.y

    // Stop any previous movement from the last frame
    this.player.body.setVelocity(0)

    let animation = 'idleDown'
    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed)
      animation = 'walkRight'
      this.player.anims.play('walkRight', true) // Assuming you have a 'walkLeft' animation
      this.player.flipX = true // Flip the sprite to face left
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed)
      animation = 'walkRight'
      this.player.anims.play('walkRight', true)
      this.player.flipX = false // Ensure the sprite is facing right
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed)
      animation = 'walkUp'
      this.player.anims.play('walkUp', true)
    } else if (this.cursors.down.isDown) {
      console.log('not')
      this.player.body.setVelocityY(speed)
      animation = 'walkDown'
      this.player.anims.play('walkDown', true)
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    this.player.body.velocity.normalize().scale(speed)

    // Emit the player's new position to the server at regular intervals
    if (time - this.lastEmitTime > 5) {
      // Emit every 50ms
      this.socket.emit('movePlayer', {
        x: this.player.x,
        y: this.player.y,
        animation: animation,
      })
      this.lastEmitTime = time
    }

    // Play the appropriate animation
    this.player.anims.play(animation, true)

    // If no movement keys are pressed, stop the animation
    if (
      this.cursors.left.isUp &&
      this.cursors.right.isUp &&
      this.cursors.up.isUp &&
      this.cursors.down.isUp
    ) {
      this.player.anims.stop()
      // Emit the player's new position to the server
      this.socket.emit('movePlayer', { x: this.player.x, y: this.player.y,animation: 'idleDown' })

      // Set idle animation based on the last direction
      if (prevVelocity.x < 0) {
        this.player.anims.play('idleRight', true)
        this.player.flipX = true
      } else if (prevVelocity.x > 0) {
        this.player.anims.play('idleRight', true)
        this.player.flipX = false
      } else if (prevVelocity.y < 0) {
        this.player.anims.play('idleUp', true)
      } else if (prevVelocity.y > 0) {
        this.player.anims.play('idleDown', true)
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.handleAttack()
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
      this.socket.emit('attackPlayer', closestPlayer.playerId)
      console.log('Attacking player:', closestPlayer.playerId)
    }
  }
}
