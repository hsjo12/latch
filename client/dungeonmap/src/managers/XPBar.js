export class XPBar {
    constructor(scene) {
        this.scene = scene;
        
        // Get existing XP from scene data or use defaults
        this.currentXP = scene.registry.get('currentXP') || 0;
        this.currentLevel = scene.registry.get('currentLevel') || 1;
        this.maxXP = 100;

        // Fixed positions for top left corner
        const x = 20;
        const y = 20;
        
        // Create black background with more opacity
        this.background = scene.add.rectangle(x, y, 200, 25, 0x000000, 1);
        this.background.setOrigin(0, 0);
        this.background.setScrollFactor(0);
        this.background.setDepth(999999);
        this.background.setAlpha(0.7);

        // Create green XP fill bar with brighter color
        this.fillBar = scene.add.rectangle(x + 2, y + 2, 196, 21, 0x00FF00, 1);
        this.fillBar.setOrigin(0, 0);
        this.fillBar.setScrollFactor(0);
        this.fillBar.setDepth(999999);

        // Add level text with larger font
        this.levelText = scene.add.text(x, y - 25, `Level ${this.currentLevel}`, {
            font: '20px Arial',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 5
        });
        this.levelText.setOrigin(0, 0);
        this.levelText.setScrollFactor(0);
        this.levelText.setDepth(999999);

        // XP text with larger font
        this.xpText = scene.add.text(x + 210, y + 3, `${this.currentXP}/${this.maxXP}`, {
            font: '18px Arial',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 5
        });
        this.xpText.setScrollFactor(0);
        this.xpText.setDepth(999999);

        // Make all elements fixed to camera
        const elements = [this.background, this.fillBar, this.levelText, this.xpText];
        elements.forEach(element => {
            element.setScrollFactor(0);
            element.setVisible(true);
        });

        // Initial update
        this.update(this.currentXP, this.currentLevel);
    }

    update(xp, level) {
        this.currentXP = xp;
        this.currentLevel = level;
        
        // Store values in scene registry
        this.scene.registry.set('currentXP', this.currentXP);
        this.scene.registry.set('currentLevel', this.currentLevel);
        
        const percentage = (this.currentXP / this.maxXP);
        this.fillBar.width = 196 * percentage;

        this.levelText.setText(`Level ${this.currentLevel}`);
        this.xpText.setText(`${this.currentXP}/${this.maxXP}`);

        // Ensure visibility after update
        [this.background, this.fillBar, this.levelText, this.xpText].forEach(element => {
            element.setVisible(true);
        });
    }
} 