import Phaser from 'phaser';

// Define an interface for communication with React
export interface GameEvents {
  requestNewQuestion: () => void;
}

// Define the expected callback type for clarity (optional but good practice)
type ArcadeCollisionCallback = (
    obj1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
    obj2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody
) => void;


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
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // --- Alien Setup ---
    this.aliens = this.physics.add.group(); // Create empty group first
    for(let i = 0; i < 10; i++) {
        const alienX = 100 + i * 60;
        const alienY = 50;
        // Create rectangle directly and add physics
        const alienRect = this.add.rectangle(alienX, alienY, 30, 20, 0xff0000).setOrigin(0.5);
        this.physics.add.existing(alienRect); // Add physics *after* creating the GameObject
        (alienRect.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.aliens.add(alienRect); // Add the GameObject with physics to the group
    }


    // --- Bullets Setup ---
    this.bullets = this.physics.add.group({
      // classType: Phaser.GameObjects.Rectangle, // Not needed if creating manually
      maxSize: 10, // Pool size
      runChildUpdate: true // Allows bullet update method to run
    });

    // --- Input Setup ---
    this.cursors = this.input.keyboard?.createCursorKeys();

    // --- Collision Setup ---
    // Use the correctly typed method as the callback
    this.physics.add.overlap(
        this.bullets,
        this.aliens,
        this.handleBulletAlienCollision, // Cast here or ensure signature matches
        undefined, // processCallback (optional filtering)
        this       // callbackContext
    );

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
    this.aliens?.children.iterate((alienChild) => {
        const alien = alienChild as Phaser.GameObjects.Rectangle; // Cast here as we know what's in the group
        if (alien && alien.active) { // Check if active
            (alien.body as Phaser.Physics.Arcade.Body).y += 0.5 * (delta / 16.66); // Move down slowly
            // Basic boundary check (replace later with proper game over)
            if (alien.y > 600) {
                console.log("Alien reached bottom!");
                // Reset position for now
                 alien.y = 0;
                 alien.x = Math.random() * 700 + 50;
            }
        }
        return true; // Keep iterating
    });

    // --- Bullet Update (within the group config) ---
    // The runChildUpdate: true in the group config handles calling bullet.update
  }

  // Called from React when a correct answer is given
  fireBullet() {
    console.log('GameScene: Firing bullet');
    if (!this.player) return;

    // Get an inactive bullet from the pool or create a new one if pool is empty/full
    const bullet = this.bullets?.get(this.player.x, this.player.y - 20) as Phaser.GameObjects.Rectangle | null;

    if (bullet) {
        // Configure the bullet (it's a rectangle)
        bullet.setFillStyle(0xffffff); // White color
        bullet.setSize(5, 15);
        bullet.setActive(true); // Make it active
        bullet.setVisible(true); // Make it visible

        // Ensure physics body is enabled and set velocity
        this.physics.world.enable(bullet); // Enable physics on the recycled object
        if (bullet.body instanceof Phaser.Physics.Arcade.Body) {
             bullet.body.setAllowGravity(false);
             bullet.body.setVelocityY(-300); // Move up
             bullet.body.setSize(5,15); // Ensure body size matches visual size
             bullet.body.setOffset(0,0); // Reset offset if needed
        }


        // Define the update logic for this specific bullet instance
        // This will be called automatically because runChildUpdate is true for the group
        bullet.update = () => {
            if (bullet.y < -10) { // Give some buffer
                console.log('Bullet off screen, killing');
                // Use killAndHide to return it to the pool
                this.bullets?.killAndHide(bullet);
                 if(bullet.body) {
                     (bullet.body as Phaser.Physics.Arcade.Body).stop(); // Stop physics movement
                 }
                // Note: setActive(false) and setVisible(false) are handled by killAndHide
            }
        };
    } else {
        console.log("Bullet pool empty/max size reached?");
    }
  }

  // Collision handler - Signature matches ArcadePhysicsCallback
  private handleBulletAlienCollision(
    obj1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
    obj2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody
  ) {
    // --- Type Guards to ensure we have GameObjects ---
    // Check if obj1 and obj2 are instances of GameObject (which Rectangle is)
    // This helps TypeScript narrow down the type safely.
    if (!(obj1 instanceof Phaser.GameObjects.GameObject) || !(obj2 instanceof Phaser.GameObjects.GameObject)) {
        console.warn("Collision detected with non-GameObject:", obj1, obj2);
        return; // Exit if they aren't the GameObjects we expect
    }

    // --- Safe Casting after Type Guard ---
    // Since the overlap is (bullets, aliens), obj1 = bullet, obj2 = alien
    const bullet = obj1 as Phaser.GameObjects.Rectangle;
    const alien = obj2 as Phaser.GameObjects.Rectangle;
    console.log('Collision handled!');


    // --- Deactivate and return/remove ---
    // Bullet: Return to pool using killAndHide
    this.bullets?.killAndHide(bullet);
    if (bullet.body) {
        (bullet.body as Phaser.Physics.Arcade.Body).stop();
    }

    // Alien: Remove from scene/group using killAndHide (or just destroy if not pooling aliens)
    this.aliens?.killAndHide(alien); // Use killAndHide if you might reuse aliens later
    // Alternatively, if aliens are never reused: alien.destroy();
    if (alien.body) {
        (alien.body as Phaser.Physics.Arcade.Body).stop();
        // Optionally disable the body entirely if destroying the GO:
        // (alien.body as Phaser.Physics.Arcade.Body).enable = false;
    }


    // Check if all aliens are gone
    if (this.aliens?.countActive(true) === 0) {
        console.log("Wave Cleared! Respawning...");
        this.respawnAliens();
    }

    // Request a new question AFTER handling the collision outcome
    this.requestNewQuestion();
  }


  private respawnAliens() {
     this.aliens?.children.each(child => {
        const alien = child as Phaser.GameObjects.Rectangle; // We know they are rectangles

        // Reset position
        const index = this.aliens!.children.entries.indexOf(alien); // Get index for spacing
        alien.x = 100 + (index * 60);
        alien.y = 50;

        // Reactivate
        alien.setActive(true);
        alien.setVisible(true);

        // Re-enable physics body if it was disabled
        if (alien.body) {
            const body = alien.body as Phaser.Physics.Arcade.Body;
            body.enable = true;
            body.reset(alien.x, alien.y); // Reset body position too
            body.setVelocity(0,0); // Ensure it's not moving from previous state
        } else {
            // This shouldn't happen if physics was added initially, but good failsafe
            console.warn("Respawning alien without physics body?", alien);
            this.physics.add.existing(alien); // Try adding physics again
            if(alien.body) {
                 (alien.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            }
        }
        return true; // Phaser TS expects boolean return for .each with Group
     });
     console.log("Aliens respawned. Active count:", this.aliens?.countActive(true));
  }

  // Method to request a new question via the event emitter
  requestNewQuestion() {
    console.log('GameScene: Requesting new question');
    // Ensure gameEvents exists before calling
    if (this.gameEvents && typeof this.gameEvents.requestNewQuestion === 'function') {
         this.gameEvents.requestNewQuestion();
    } else {
        console.warn("GameScene: gameEvents or requestNewQuestion not available!");
    }
  }
}