export class XPBar {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // XP bar background
        this.background = scene.add.rectangle(x, y, 100, 10, 0x000000)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);
            
        // XP bar fill
        this.bar = scene.add.rectangle(x, y, 0, 10, 0x00ff00)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1001);
            
        // Level text
        this.levelText = scene.add.text(x, y - 15, 'Level 1', {
            fontSize: '12px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        })
        .setScrollFactor(0)
        .setDepth(1001);
        
        // XP text
        this.xpText = scene.add.text(x + 110, y, '0/100', {
            fontSize: '10px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        })
        .setScrollFactor(0)
        .setDepth(1001);
    }

    update(xp, level) {
        const xpForNextLevel = 100; // XP needed per level
        const currentLevelXP = xp % xpForNextLevel;
        const percentage = (currentLevelXP / xpForNextLevel) * 100;
        
        this.bar.width = percentage;
        this.levelText.setText(`Level ${level}`);
        this.xpText.setText(`${currentLevelXP}/${xpForNextLevel}`);
    }
} 