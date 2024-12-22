export class PlayerManager {
  static handleAttack(scene, player, targetId) {
    if (player.isAttacking) {
      console.log('Player is already attacking')
      return
    }

    const attackAnimation = 'attack' + (player.lastDirection || 'Down')
    console.log('Starting attack animation:', attackAnimation)

    player.isAttacking = true

    // Play local attack animation
    player.anims.play(attackAnimation, true).once('animationcomplete', () => {
      console.log('Attack animation complete, returning to idle')
      player.isAttacking = false
      const idleAnim = 'idle' + (player.lastDirection || 'Down')
      player.anims.play(idleAnim, true)
    })

    // Emit attack event
    scene.socket.emit('attackPlayer', {
      targetId: targetId,
      animation: attackAnimation,
      direction: player.lastDirection || 'Down',
    })
  }

  static handleOtherPlayerAttack(otherPlayer, animation, direction) {
    console.log('Other player attacking:', { animation, direction })

    otherPlayer.isAttacking = true
    otherPlayer.lastDirection = direction

    otherPlayer.anims.play(animation, true).once('animationcomplete', () => {
      console.log('Other player attack complete')
      otherPlayer.isAttacking = false
      const idleAnim = 'idle' + (direction || 'Down')
      otherPlayer.anims.play(idleAnim, true)
    })
  }
}
