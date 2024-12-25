import Phaser from "phaser";
import Level from "./Level.js";
import { PlayerManager } from './managers/PlayerManager'

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super("DungeonScene");
    this.player = null;
    this.level = new Level();
    this.spike = null;
    this.healthBar = null;
    this.otherPlayers = {};
    this.canMove = false;
    this.countdownText = null;
    this.countdownStarted = false;
  }

  preload() {
    this.load.image("Dungeon_1", "/assets/Dungeon_1.png");
    this.load.image("windows", "/assets/Dungeon_2_Arch_small.png");
    this.load.image("pillars", "/assets/Dungeon_2_Pillars.png");
    this.load.image("objects", "/assets/Dungeon_Objects.png");
    this.load.image("spikes", "/assets/Floor_spikes_1.png");
    this.load.tilemapTiledJSON("dungeon", "assets/dmap.json");
    this.load.spritesheet("player", "assets/Spearman.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet("spike", "assets/spk1.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    // this.load.image("spike", "assets/tile000.png");
  }

  create() {
this.game.scale.resize(256,256)
    const map = this.make.tilemap({ key: "dungeon" });
    const floor = map.addTilesetImage("Dungeon_1", "Dungeon_1");
    const floorLayer = map.createLayer("Tile Layer 1", [floor], 0, -100);
    floorLayer.setScale(1, 2).setOrigin(0, 0);

    const windows = map.addTilesetImage("windows", "windows");
    const windowsLayer = map.createLayer("windows", [windows], 0, 0);
    windowsLayer.setScale(1, 1).setOrigin(0, 0);

    const pillars = map.addTilesetImage("pillars", "pillars");
    const pillarLayer = map.createLayer("pillars", pillars, 0, 0);
    pillarLayer.setScale(1, 1).setOrigin(0, 0);
    pillarLayer.setCollisionByProperty({ collider: true });

    const objects = map.addTilesetImage("objects", "objects");
    const spikes = map.addTilesetImage("spikes", "spikes");
    const objectLayer = map.createLayer("objects", [objects, spikes], 0, 0);
    objectLayer
        .setScale(1, 1)
        .setOrigin(0, 0)
        .setCollisionByProperty({ collider: true });
    // this.spike = this.physics.add.image(
    //   this.game.config.width / 2 - 70,
    //   this.game.config.height / 2 - 25,
    //   "spike",
    // );
    //
    // this.anims.create({
    //   key: "spike-anim",
    //   frames: this.anims.generateFrameNumbers("spike", { start: 0, end: 7 }),
    //   frameRate: 10,
    //   repeat: -1,
    // });
    // this.spike.play("spike-anim", true);

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
    this.anims.create({
      key: "idleDown",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.physics.add.collider(this.player, pillarLayer);
    this.physics.add.collider(this.player, objectLayer);

    this.anims.create({
      key: "idleRight",
      frames: this.anims.generateFrameNumbers("player", { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "idleUp",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walkDown",
      frames: this.anims.generateFrameNumbers("player", { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walkRight",
      frames: this.anims.generateFrameNumbers("player", { start: 24, end: 29 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walkUp",
      frames: this.anims.generateFrameNumbers("player", { start: 30, end: 35 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "attackDown",
      frames: this.anims.generateFrameNumbers("player", { start: 36, end: 39 }),
      frameRate: 10,
      repeat: 1,
    });

    this.anims.create({
      key: "attackRight",
      frames: this.anims.generateFrameNumbers("player", { start: 42, end: 46 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "attackUp",
      frames: this.anims.generateFrameNumbers("player", { start: 48, end: 52 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "die",
      frames: this.anims.generateFrameNumbers("player", { start: 54, end: 56 }),
      frameRate: 10,
      repeat: 0,
    });
    this.player.play("idleDown");
    this.healthBar = this.createHealthBar(this.player.x, this.player.y, this.player);

    this.attackKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

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
        console.log('Leave button clicked'); // Debug log
        
        if (this.socket) {
            this.socket.emit('leaveScene', {
                from: 'DungeonScene',
                to: 'CommonScene'
            });
        }
        
        // Reload the whole game
        window.location.reload();
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
  }

  createHealthBar(x, y, player) {
    const width = 40;
    const height = 5;
    
    // White outline
    const outline = this.add.rectangle(x, y - 40, width + 2, height + 2, 0xffffff);
    
    // Black background
    const healthBarBackground = this.add.rectangle(x, y - 40, width, height, 0x000000);
    
    // Red health bar - set origin to left
    const healthBar = this.add.rectangle(x - width/2, y - 40, width, height, 0xff0000)
        .setOrigin(0, 0.5);
    
    return { 
        outline: outline,
        background: healthBarBackground, 
        bar: healthBar 
    };
  }

  update() {
    const speed = 80;
    const prevVelocity = this.player.body.velocity.clone();
    let newX = this.player.x;
    let newY = this.player.y;

      // this.input.keyboard.addListener("keydown-F", (e) => {
      //     console.log(e)
      //     this.player.play("attackRight");
      // })

    // Stop any previous movement from the last frame
    this.player.body.setVelocity(0);

    // Horizontal movement
    if (this.cursors.left.isDown) {
      newX -= speed * (1 / 60);
      if (!this.level.isColliding(newX, newY)) {
        this.player.body.setVelocityX(-speed);
        this.player.anims.play("walkRight", true); // Assuming you have a 'walkLeft' animation
        this.player.flipX = true; // Flip the sprite to face left
      }
    } else if (this.cursors.right.isDown) {
      newX += speed * (1 / 60);
      if (!this.level.isColliding(newX, newY)) {
        this.player.body.setVelocityX(speed);
        this.player.anims.play("walkRight", true);
        this.player.flipX = false; // Ensure the sprite is facing right
      }
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      newY -= speed * (1 / 60);
      if (!this.level.isColliding(newX, newY)) {
        this.player.body.setVelocityY(-speed);
        this.player.anims.play("walkUp", true);
      }
    } else if (this.cursors.down.isDown) {
      newY += speed * (1 / 60);
      console.log(this.level.isColliding(newX, newY));
      if (!this.level.isColliding(newX, newY)) {
        console.log("not");
        this.player.body.setVelocityY(speed);
        this.player.anims.play("walkDown", true);
      }
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
        this.player.anims.play("idleRight", true);
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
    if (this.healthBar) {
        const yOffset = -20;
        const width = 40;
        
        this.healthBar.outline.x = this.player.x;
        this.healthBar.outline.y = this.player.y + yOffset;
        this.healthBar.background.x = this.player.x;
        this.healthBar.background.y = this.player.y + yOffset;
        
        // Update red bar position and width
        this.healthBar.bar.x = this.player.x - width/2;
        this.healthBar.bar.y = this.player.y + yOffset;
        this.healthBar.bar.width = (this.player.life / 100) * width;
    }
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
        { x: 200, y: 90 }   // Second player spawn
    ];
    
    // Count existing players to determine spawn point
    const playerCount = Object.keys(this.otherPlayers).length;
    
    // First player gets first spawn, second player gets second spawn
    const spawnPoint = spawnPoints[playerCount] || spawnPoints[0];
    
    // Validate the chosen point
    if (!this.level.isColliding(spawnPoint.x, spawnPoint.y)) {
        return spawnPoint;
    }
    
    // Fallback to center if spawn point is invalid
    return {
        x: this.cameras.main.width / 2,
        y: this.cameras.main.height / 2
    };
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
            this.countdownText.setText('In Queue...');
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
}
