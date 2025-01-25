export class AnimationManager {
  static createAnimations(scene) {
    const animations = [
      {
        key: 'idleDown',
        frames: { start: 0, end: 5 }
      },
      {
        key: 'idleRight',
        frames: { start: 6, end: 11 }
      },
      {
        key: 'idleLeft',
        frames: { start: 6, end: 11 }
      },
      {
        key: 'idleUp',
        frames: { start: 12, end: 17 }
      },
      {
        key: 'walkDown',
        frames: { start: 18, end: 23 }
      },
      {
        key: 'walkRight',
        frames: { start: 24, end: 29 }
      },
      {
        key: 'walkLeft',
        frames: { start: 24, end: 29 }
      },
      {
        key: 'walkUp',
        frames: { start: 30, end: 35 }
      },
      {
        key: 'attackDown',
        frames: { start: 36, end: 49 }
      },
      {
        key: 'attackRight',
        frames: { start: 42, end: 46 }
      },
      {
        key: 'attackLeft',
        frames: { start: 42, end: 46 }
      },
      {
        key: 'attackUp',
        frames: { start: 48, end: 52 }
      },
      {
        key: 'die',
        frames: { start: 54, end: 56 }
      }
    ];

    animations.forEach(animation => {
      // Check if animation already exists
      if (!scene.anims.exists(animation.key)) {
        scene.anims.create({
          key: animation.key,
          frames: scene.anims.generateFrameNumbers('player', animation.frames),
          frameRate: 10,
          repeat: animation.key.includes('idle') ? -1 : 0
        });
      }
    });
  }
}
