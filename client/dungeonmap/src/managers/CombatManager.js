// src/managers/CombatManager.js
export class CombatManager {
  static handlePlayerDeath(scene, playerId) {
    console.log('Local player died')
    if (playerId === scene.socket.id) {
      // Local player death
      scene.player.isAttacking = false
      scene.player.isDead = true
      scene.player.anims.play('die', true).once('animationcomplete', () => {
        // Handle respawn or game over logic here
        console.log('Local player died')
      })
    } else if (scene.otherPlayers[playerId]) {
      // Other player death
      const deadPlayer = scene.otherPlayers[playerId]
      deadPlayer.isAttacking = false
      deadPlayer.isDead = true
      deadPlayer.anims.play('die', true).once('animationcomplete', () => {
        deadPlayer.destroy()
        delete scene.otherPlayers[playerId]
        console.log('Other player died:', playerId)
      })
    }
  }
}
