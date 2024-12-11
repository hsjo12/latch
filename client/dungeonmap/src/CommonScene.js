import Phaser from "phaser";
import Level from "./Level.js";
import io from 'socket.io-client';

export default class CommonScene extends Phaser.Scene {
  constructor() {
    super("CommonScene");
    this.player = null;
    this.otherPlayers = new Map();
    this.socket = io('http://localhost:8080');
  }

  preload() {
    this.load.image("Apple_Tree", "/assets/Apple_Tree.png");
    this.load.image("Barn", "/assets/Barn.png");
    this.load.image("Beach_Decor_Tiles", "/assets/Beach_Decor_Tiles.png");
    this.load.image("Beach_Tile", "/assets/Beach_Tile.png");
    this.load.image("Birch_Tree", "/assets/Birch_Tree.png");
    this.load.image("Boat", "/assets/Boat.png");
    this.load.image("Cobble_Road_1", "/assets/Cobble_Road_1.png");
    this.load.image("Cobble_Road_2", "/assets/Cobble_Road_2.png");
    this.load.image("Fences", "/assets/Fences.png");
    this.load.image("Fountain", "/assets/Fountain.png");
    this.load.image("Grass_Middle", "/assets/Grass_Middle.png");
    this.load.image("Grass_Tiles_1", "/assets/Grass_Tiles_1.png");
    this.load.image("Water_Middle", "/assets/Water_Middle.png");
    this.load.image("Water_Tile", "/assets/Water_Tile.png");
    this.load.image("Well", "/assets/Well.png");
    this.load.image("With_Hut", "/assets/With_Hut.png");
    this.load.image("Cave_Floor", "/assets/Cave_Floor.png");
    this.load.image("Water_Troughs", "/assets/Water_Troughs.png");

    this.load.tilemapTiledJSON("common", "/assets/common.json");
    this.load.spritesheet("player", "/assets/Spearman.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "common" });
    const grass = map.addTilesetImage("Grass_Middle", "Grass_Middle");
    const water = map.addTilesetImage("Water_Tile", "Water_Tile");
    const waterMiddle = map.addTilesetImage("Water_Middle", "Water_Middle");
    const Cobble_Road_1 = map.addTilesetImage("Cobble_Road_1", "Cobble_Road_1");
    const Grass_Tiles_1 = map.addTilesetImage("Grass_Tiles_1", "Grass_Tiles_1");
    const Cave_Floor = map.addTilesetImage("Cave_Floor", "Cave_Floor");
    const beachDecorTiles = map.addTilesetImage(
        "Beach_Decor_Tiles",
        "Beach_Decor_Tiles",
    );
    const layer1 = map.createLayer(
        "floor",
        [
          grass,
          waterMiddle,
          water,
          beachDecorTiles,
          Cobble_Road_1,
          Grass_Tiles_1,
          Cave_Floor
        ],
        0,
        0,
    );
    layer1
        .setScale(1, 1)
        .setOrigin(0, 0)
        .setCollisionByProperty({ collider: true });




    const Fountain = map.addTilesetImage("Fountain", "Fountain");
    const Barn = map.addTilesetImage("Barn", "Barn");
    const Fences = map.addTilesetImage("Fences", "Fences");
    const Well = map.addTilesetImage("Well", "Well");
    const Boat = map.addTilesetImage("Boat", "Boat");
    const With_Hut = map.addTilesetImage("With_Hut", "With_Hut");
    const Birch_Tree = map.addTilesetImage("Birch_Tree", "Birch_Tree");
    const Apple_Tree = map.addTilesetImage("Apple_Tree", "Apple_Tree");
    const Water_Troughs = map.addTilesetImage("Water_Troughs", "Water_Troughs");
    const objectLayer = map.createLayer(
        "objects",
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
          Water_Troughs
        ],
        0,
        0,
    );
    objectLayer
        .setScale(1, 1)
        .setOrigin(0, 0)
        .setCollisionByProperty({ collider: true,  });
     //create layer id for collsion
 
    // Make sure player loads
    console.log('Creating player sprite...');
    this.player = this.add.sprite(400, 300, "player")
        .setScale(1)
        .setDepth(10)
        .setVisible(true);
    
    console.log('Player created:', this.player);
    console.log('Player position:', this.player.x, this.player.y);
    console.log('Player visible:', this.player.visible);

    this.createAnimations();

    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setFollowOffset(-50, -50);

    this.socket.emit('joinGame', { 
        scene: 'common',
        x: this.player.x,
        y: this.player.y 
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.setupSocketListeners();
  }

  createAnimations() {
    this.anims.create({
      key: "idleDown",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

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
      repeat: -1,
    });

    this.anims.create({
      key: "attackRight",
      frames: this.anims.generateFrameNumbers("player", { start: 42, end: 45 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "attackUp",
      frames: this.anims.generateFrameNumbers("player", { start: 48, end: 51 }),
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
  }

  setupSocketListeners() {
    this.socket.on('currentPlayers', (players) => {
        Object.keys(players).forEach((id) => {
            if (id === this.socket.id) {
                // Update our player position from server
                this.updatePlayerState(this.player, players[id]);
                // Set camera to follow our player
                this.cameras.main.startFollow(this.player, true);
                this.cameras.main.setFollowOffset(-50, -50);
            } else {
                this.addOtherPlayer(players[id]);
            }
        });
    });

    // ... rest of the listeners remain the same ...
}

sendCollisionData() {
    // collisions
    const collisionMap = [];
    const mapHeight = this.layer1.layer.height;
    const mapWidth = this.layer1.layer.width;

    for (let y = 0; y < mapHeight; y++) {
        collisionMap[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            const tile1 = this.layer1.getTileAt(x, y);
            const tileObject = this.objectLayer.getTileAt(x, y);
            collisionMap[y][x] = (tile1 && tile1.properties.collider) || 
                                (tileObject && tileObject.properties.collider) || 
                                false;
        }
    }

    this.socket.emit('sceneCollision', {
        scene: 'common',
        collisionMap: collisionMap
    })
}
// receive input -- server / check collsion = revert 
update() {
    if (!this.player) return;

    this.socket.emit('playerInput', {
        left: this.cursors.left.isDown,
        right: this.cursors.right.isDown,
        up: this.cursors.up.isDown,
        down: this.cursors.down.isDown,
        scene: 'common'
    });
}

// Disconnect when scene is shut down
shutdown() {
    if (this.socket) {
        this.socket.removeAllListeners();
 
}}}
