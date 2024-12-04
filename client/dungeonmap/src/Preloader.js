import Phaser from "phaser";
import Level from "./Level.js";

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("preloader");
    this.player = null;
    this.level = new Level();
    this.spike = null;
  }

  preload() {
    this.load.image("tiles", "/assets/Dungeon_1.png");
    this.load.image("windows", "/assets/Dungeon_2_Arch_small.png");
    this.load.image("pillars", "/assets/Dungeon_2_Pillars.png");
    this.load.image("objects", "/assets/Dungeon_Objects.png");
    this.load.image("spikes", "/assets/Floor_spikes_1.png");
    this.load.tilemapTiledJSON("dungeon", "assets/dmap.json");
    this.load.spritesheet("player", "assets/orc.png", {
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
    const map = this.make.tilemap({ key: "dungeon" });
    const tileset = map.addTilesetImage("Dungeon_1", "tiles");
    const layer1 = map.createLayer("Tile Layer 1", [tileset], 0, -100);
    layer1.setScale(1, 2).setOrigin(0, 0);

    const tileset1 = map.addTilesetImage("windows", "windows");
    const layer2 = map.createLayer("windows", [tileset1], 0, 0);
    layer2.setScale(1, 1).setOrigin(0, 0);
    const tileset2 = map.addTilesetImage("pillars", "pillars");
    const layer3 = map.createLayer("pillars", tileset2, 0, 0);
    layer3.setScale(1, 1).setOrigin(0, 0);
    layer3.setCollisionByProperty({ collider: true });

    const tileset3 = map.addTilesetImage("objects", "objects");
    const tileset4 = map.addTilesetImage("spikes", "spikes");
    const layer4 = map.createLayer("objects", [tileset3, tileset4], 0, 0);
    layer4
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
        this.game.config.width / 2 - 50,
        this.game.config.height / 2 - 35,
        "player",
      )
      .setScale(1);

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

    this.physics.add.collider(this.player, layer3);
    this.physics.add.collider(this.player, layer4);

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

  update() {
    const speed = 80;
    const prevVelocity = this.player.body.velocity.clone();
    let newX = this.player.x;
    let newY = this.player.y;

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
  }
}
