export class AnimationManager {
  static createAnimations(scene) {
    const animations = {
      idle: [
        { key: 'idleDown', start: 0, end: 5 },
        { key: 'idleRight', start: 6, end: 11 },
        { key: 'idleUp', start: 12, end: 17 },
      ],
      walk: [
        { key: 'walkDown', start: 18, end: 23 },
        { key: 'walkRight', start: 24, end: 29 },
        { key: 'walkUp', start: 30, end: 35 },
      ],
      attack: [
        { key: 'attackDown', start: 36, end: 39 },
        { key: 'attackRight', start: 42, end: 46 },
        { key: 'attackUp', start: 48, end: 52 },
      ],
    }

    Object.values(animations)
      .flat()
      .forEach((anim) => {
        scene.anims.create({
          key: anim.key,
          frames: scene.anims.generateFrameNumbers('player', {
            start: anim.start,
            end: anim.end,
          }),
          frameRate: 10,
          repeat: anim.key.startsWith('attack') ? 0 : -1,
        })
      })
  }
}
