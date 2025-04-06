import Phaser from 'phaser';

// Define an interface for communication with React
export interface GameEvents {
  requestNewQuestion: () => void;
}

export class GameScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private aliens?: Phaser.Physics.Arcade.Group;
  private bullets?: Phaser.Physics.Arcade.Group;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameEvents?: GameEvents; // To communicate back to React

  constructor() {
    super('GameScene');
  }

  // Receive the event emitter from React component
  init(data: { gameEvents: GameEvents }) {
    this.gameEvents = data.gameEvents;
    console.log('GameScene init - Received gameEvents:', this.gameEvents);
  }

  preload() {
    // No assets to load for placeholders
  }

  create() {
    console.log('GameScene create');
    // --- Player Setup ---
    this.player = this.add.rectangle(400, 550, 50, 30, 0x00ff00).setOrigin(0.5);
    this.physics.add.existing(this.player);
    // We cast player.body because physics must be enabled
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // --- Alien Setup ---
    this.aliens = this.physics.add.group({
        key: 'alien', // We'll use rectangles for now
        repeat: 9,    // 10 aliens total
        setXY: { x: 100, y: 50, stepX: 60 }
    });

    this.aliens.children.iterate((child) => {
        // Replace default texture with a rectangle
        const alien = child as Phaser.GameObjects.Sprite;
        alien.setVisible(false); // Hide original sprite if needed

        const alienRect = this.add.rectangle(alien.x, alien.y, 30, 20, 0xff0000).setOrigin(0.5);
        this.physics.add.existing(alienRect);
        (alienRect.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        // Add the rectangle to the group (important!)
        // Need to re-think this slightly - let's just create rectangles directly
        return true; // Indicate iteration should continue
    });
    // Clear the initial placeholder sprites if they existed
    this.aliens.clear(true, true);

    // Let's recreate aliens properly with rectangles
    for(let i = 0; i < 10; i++) {
        const alienX = 100 + i * 60;
        const alienY = 50;
        const alienRect = this.add.rectangle(alienX, alienY, 30, 20, 0xff0000).setOrigin(0.5);
        this.physics.add.existing(alienRect);
        (alienRect.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.aliens.add(alienRect); // Add the rectangle to the group
    }

    // --- Bullets Setup ---
    this.bullets = this.physics.add.group({
      classType: Phaser.GameObjects.Rectangle, // Using rectangles for bullets too
      maxSize: 10, // Pool size
      runChildUpdate: true
    });

    // --- Input Setup ---
    this.cursors = this.input.keyboard?.createCursorKeys();

    // --- Collision Setup ---
    this.physics.add.overlap(this.bullets, this.aliens, this.handleBulletAlienCollision, undefined, this);

    // --- Initial Question Request ---
    this.requestNewQuestion();
  }

  update(_time: number, delta: number) {
    if (!this.cursors || !this.player) {
        return;
    }

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    // --- Player Movement ---
    playerBody.setVelocityX(0);
    if (this.cursors.left.isDown) {
      playerBody.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      playerBody.setVelocityX(200);
    }

    // --- Alien Movement ---
    this.aliens?.children.iterate((alien) => {
        if (alien) {
            (alien.body as Phaser.Physics.Arcade.Body).y += 0.5 * (delta / 16.66); // Move down slowly
            // Basic boundary check (replace later with proper game over)
            if ((alien as Phaser.GameObjects.Rectangle).y > 600) {
                console.log("Alien reached bottom!");
                // Reset position for now
                 (alien as Phaser.GameObjects.Rectangle).y = 0;
                 (alien as Phaser.GameObjects.Rectangle).x = Math.random() * 700 + 50;
            }
        }
        return true; // Keep iterating
    });
  }

  // Called from React when a correct answer is given
  fireBullet() {
    console.log('GameScene: Firing bullet');
    if (!this.player) return;

    const bullet = this.bullets?.get(this.player.x, this.player.y - 20) as Phaser.GameObjects.Rectangle | null;

    if (bullet) {
        // Activate and configure the bullet (it's a rectangle)
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setFillStyle(0xffffff); // White color
        bullet.setSize(5, 15);
        this.physics.world.enable(bullet); // Ensure physics body is enabled
        (bullet.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (bullet.body as Phaser.Physics.Arcade.Body).setVelocityY(-300); // Move up

        // Optional: Destroy bullet when it goes off-screen
        bullet.update = () => {
            if (bullet.y < 0) {
                this.bullets?.killAndHide(bullet);
                bullet.setActive(false);
                bullet.setVisible(false);
                (bullet.body as Phaser.Physics.Arcade.Body).stop();
            }
        };
    }
  }

  // Collision handler
  private handleBulletAlienCollision(
    bullet: Phaser.GameObjects.GameObject,
    alien: Phaser.GameObjects.GameObject
  ) {
    console.log('Collision!');
    // Deactivate both bullet and alien
    bullet.setActive(false).setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).stop();
    this.bullets?.killAndHide(bullet); // Return bullet to pool

    alien.setActive(false).setVisible(false);
    (alien.body as Phaser.Physics.Arcade.Body).stop();
    this.aliens?.killAndHide(alien); // Remove alien (or handle health later)

    // Check if all aliens are gone (simple version)
    if (this.aliens?.countActive(true) === 0) {
        console.log("Wave Cleared! (Implement next level/reset)");
        // For now, just respawn them
        this.respawnAliens();
    }

    // Important: Request a new question *after* hitting an alien
    this.requestNewQuestion();
  }

  private respawnAliens() {
     this.aliens?.children.each(child => {
        const alien = child as Phaser.GameObjects.Rectangle;
        alien.setActive(true);
        alien.setVisible(true);
        alien.x = 100 + (this.aliens!.children.entries.indexOf(alien) * 60);
        alien.y = 50;
        (alien.body as Phaser.Physics.Arcade.Body).enable = true;
        return true;
     });
  }

  // Method to request a new question via the event emitter
  requestNewQuestion() {
    console.log('GameScene: Requesting new question');
    this.gameEvents?.requestNewQuestion();
  }
}