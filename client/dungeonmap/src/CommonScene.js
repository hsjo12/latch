import Phaser from "phaser";
import Level from "./Level.js";

export default class CommonScene extends Phaser.Scene {
  constructor() {
    super("CommonScene");
    this.player = null;
}
  preload() {

	 .setScale(1, 1)
        .setOrigin(0, 0)
        .setCollisionByProperty({ collider: true,  });

 // const tileset2 = map.addTilesetImage("pillars", "pillars");
 // const layer3 = map.createLayer("pillars", tileset2, 0, 0);
 // layer3.setScale(1, 1).setOrigin(0, 0);
 // layer3.setCollisionByProperty({ collider: true });

 this.player = this.physics.add
        .sprite(
            this.game.config.width /2,
            this.game.config.height/2,
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

 this.physics.add.collider(this.player, layer1, );
    this.physics.add.collider(this.player, objectLayer, (a, b)=>{
     if(b?.properties?.dungeon){
       this.scene.start('DungeonScene')
     }
      if(b?.properties?.bridge){
        this.scene.start('BridgeScene')
      }
    });
    // this.cameras.main.setBounds(0, 0, +this.game.config.width, +this.game.config.height);
    this.cameras.main.startFollow(this.player, true)
    this.cameras.main.setFollowOffset(-50,-50)
    this.anims.create({
      key: "idleRight",
      frames: this.anims.generateFrameNumbers("player", { start: 6, end: 11 }),
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
      this.player.body.setVelocityX(-speed);
      this.player.anims.play("walkRight", true); // Assuming you have a 'walkLeft' animation
      this.player.flipX = true; // Flip the sprite to face left
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
      this.player.anims.play("walkRight", true);
      this.player.flipX = false; // Ensure the sprite is facing right
    }

  // Vertical movement
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
      this.player.anims.play("walkUp", true);
    } else if (this.cursors.down.isDown) {
      console.log("not");
      this.player.body.setVelocityY(speed);
      this.player.anims.play("walkDown", true);

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
