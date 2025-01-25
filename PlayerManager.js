export class PlayerManager {
  static handleAttack(scene, player, targetId) {
    if (player.isAttacking) return;
    
    player.isAttacking = true;
    
    // Get the current direction from the player
    const direction = player.lastDirection || 'Down';
    const animation = `attack${direction}`;
    
    // Play attack animation
    player.play(animation, true);
    
    // Emit attack animation to other players
    scene.socket.emit('playerAttackAnimation', {
        animation: animation,
        direction: direction,
        attacker: scene.socket.id
    });
    
    scene.time.delayedCall(500, () => {
        player.isAttacking = false;
        if (targetId) {
            scene.socket.emit('attackPlayer', targetId);
        }
    });
  }

  static handleOtherPlayerAttack(otherPlayer, animation) {
    if (otherPlayer.isAttacking) return;
    
    otherPlayer.isAttacking = true;
    otherPlayer.play(animation, true);
    
    otherPlayer.scene.time.delayedCall(500, () => {
        otherPlayer.isAttacking = false;
    });
  }

  static handleMovement(scene, player) {
    const speed = 80;
    let animation = 'idleDown';
    let velocityChanged = false;

    if (!player.isAttacking) {
        // Store previous position
        const prevX = player.x;
        const prevY = player.y;

        // Reset velocity
        player.body.setVelocity(0);

        // Handle movement with collision checks
        if (scene.cursors.left.isDown) {
            player.body.setVelocityX(-speed);
            animation = 'walkLeft';
            player.lastDirection = 'Left';
            player.flipX = true;
            velocityChanged = true;
            if (player.x === prevX) console.log('Collision detected: Left');
        } else if (scene.cursors.right.isDown) {
            player.body.setVelocityX(speed);
            animation = 'walkRight';
            player.lastDirection = 'Right';
            player.flipX = false;
            velocityChanged = true;
            if (player.x === prevX) console.log('Collision detected: Right');
        }

        if (scene.cursors.up.isDown) {
            player.body.setVelocityY(-speed);
            animation = 'walkUp';
            player.lastDirection = 'Up';
            velocityChanged = true;
            if (player.y === prevY) console.log('Collision detected: Up');
        } else if (scene.cursors.down.isDown) {
            player.body.setVelocityY(speed);
            animation = 'walkDown';
            player.lastDirection = 'Down';
            velocityChanged = true;
            if (player.y === prevY) console.log('Collision detected: Down');
        }

        // Normalize diagonal movement
        if (player.body.velocity.x !== 0 && player.body.velocity.y !== 0) {
            const normalize = Math.sqrt(2);
            player.body.velocity.x /= normalize;
            player.body.velocity.y /= normalize;
        }

        // If no movement or collision occurred, play idle animation
        if (!velocityChanged || (prevX === player.x && prevY === player.y)) {
            animation = `idle${player.lastDirection || 'Down'}`;
            player.body.setVelocity(0);
        }

        // Play the animation
        player.play(animation, true);

        // Only emit if position actually changed
        if (player.x !== prevX || player.y !== prevY) {
            scene.socket.emit('playerState', {
                x: player.x,
                y: player.y,
                animation: animation,
                flipX: player.flipX,
                lastDirection: player.lastDirection,
                isAttacking: player.isAttacking
            });
        }
    }

    return animation;
  }
}
