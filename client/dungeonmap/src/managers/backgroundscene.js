import { io } from 'socket.io-client';
import CommonScene from '../CommonScene';
import DungeonScene from '../DungeonScene';
import BridgeScene from '../BridgeScene';

export default class BackgroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BackgroundScene', active: true });
        this.socket = null;
      
    }

    create() {
        if (!this.socket) {
            const serverUrl = 'http://localhost:3000';  // Make sure this matches your server
            console.log('Connecting to server at:', serverUrl);
            
            this.socket = io(serverUrl, {
                transports: ['websocket'],
                upgrade: false,
                reconnection: true,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('Connected to server with ID:', this.socket.id);
                this.hasJoinedScene = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        }

        // Listen for scene changes
        this.events.on('changeScene', (sceneName) => {
            if (!this.hasJoinedScene) {
                console.log('Joining scene:', sceneName);
                this.socket.emit('joinScene', {
                    scene: sceneName,
                    x: this.game.config.width / 2,
                    y: this.game.config.height / 2
                });
                this.hasJoinedScene = true;
            }
        });

        // Start with CommonScene
        if (!this.currentScene) {
            this.startScene('CommonScene');
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
            this.hasJoinedScene = false;
        });

        this.socket.on('currentPlayers', (players) => {
            console.log('Received current players:', players);
            if (this.currentScene) {
                this.currentScene.events.emit('currentPlayers', players);
            }
        });

        this.socket.on('newPlayer', (playerInfo) => {
            console.log('New player joined:', playerInfo);
            if (this.currentScene) {
                this.currentScene.events.emit('newPlayer', playerInfo);
            }
        });

        this.socket.on('playerMoved', (playerInfo) => {
            if (this.currentScene) {
                this.currentScene.events.emit('playerMoved', playerInfo);
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            console.log('Player disconnected:', playerId);
            if (this.currentScene) {
                this.currentScene.events.emit('playerDisconnected', playerId);
            }
        });

        this.socket.on('gameState', (state) => {
            if (this.currentScene) {
                this.currentScene.events.emit('gameState', state);
            }
        });
    }

    startScene(sceneName, data = {}) {
        console.log(`Starting scene: ${sceneName} with socket ID:`, this.socket.id);

        // Stop current scene if it exists
        if (this.currentScene) {
            console.log(`Leaving scene: ${this.currentScene.scene.key}`);
            this.socket.emit('leaveScene', { 
                scene: this.currentScene.scene.key,
                playerId: this.socket.id 
            });
            this.scene.stop(this.currentScene.scene.key);
        }

        // Start new scene with socket reference
        this.scene.start(sceneName, { 
            socket: this.socket,
            backgroundScene: this,
            ...data 
        });

        // Update current scene reference
        this.currentScene = this.scene.get(sceneName);
    }

    getSocket() {
        return this.socket;
    }
}
