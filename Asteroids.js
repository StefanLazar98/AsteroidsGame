const FPS = 30; // frames per second
const SHIP_SIZE = 30; // ship height
const SHIP_THRUST = 5; // acceleration of the ship
const SHIP_EXPLODE_DURATION = 0.3 // duration of the ship's explosion
const SHIP_INVINCIBLE_DURATION = 3 // duration of ship's invincibility after respawning
const SHIP_BLINK_TIME = 0.3 // duration of ship's blink during invincibility after respawning
const TURN_SPEED = 360; // turn speed in degrees per second
const FRICTION = 2 // friction coefficient that determines how much speed does the ship lose
const ASTEROIDS_NUMBER = 25; // starting number of asteroids
const ASTEROIDS_SIZE = 100; // starting size of asteroids
const MAX_ROCKETS = 3 // maximum number of rockets that can be shot at the same time
const ROCKET_SPEED = 500; // speed of the rockets in pixels per second
const ROCKET_DISTANCE = 0.7 // max distance a rocket can go
const GAME_LIVES = 3; // starting number of lives
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 80; // text font size in pixels
const LARGE_ASTEROIDS = 5; // points you will receive if you destroy a large asteroid
const MEDIUM_ASTEROIDS = 10; // points you will receive if you destroy a mediun asteroid
const SMALL_ASTEROIDS = 20; // points you will receive if you destroy a small asteroid
const TINY_ASTEROIDS = 30; // points you will receive if you destroy a tiny asteroid
const SAVE_KEY_SCORE = "High Score"; // save key for local storage of the highscore

var canvas = document.getElementById("game");
var context = canvas.getContext("2d");
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;

var text, textAlpha, lives, ship, asteroids, score;
var SCORE_FOR_EXTRA_LIVE = 400 // points you need to get in order to receive an additional live
var HIGH_SCORE;
var img = document.getElementById("space");
newGame();

// set up event handelers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function createAsteroids() {
    asteroids = [];
    var x, y;
    for (var i = 0; i < ASTEROIDS_NUMBER; i++) {
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROIDS_SIZE * 2 + ship.r);
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 2)));
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS);
}

function newGame() {
    lives = GAME_LIVES;
    ship = newShip();
    text = "Game Started";
    textAlpha = 1.0;
    score = 0;
    // get the high score from local storage
    var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
    if (scoreStr == null) {
        HIGH_SCORE = 0;
    }
    else {
        HIGH_SCORE = parseInt(scoreStr);
    }
    createAsteroids();
}

function gameCompleted() {
    text = "Game Completed";
    if (textAlpha >= 0) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(255,255,255, " + textAlpha + ")";
        context.font = "small-caps " + TEXT_SIZE + "px times new roman";
        context.fillText(text, canvas.width / 2, canvas.height * 0.90);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    }
    newGame();
}

function newShip() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2, // radius
        a: 90 / 180 * Math.PI, // converted to radians, // angle
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0
        },
        explodeTime: 0,
        blinkTime: Math.ceil(SHIP_BLINK_TIME * FPS),
        blinkNumber: Math.ceil(SHIP_INVINCIBLE_DURATION / SHIP_BLINK_TIME),
        canShoot: true,
        rockets: [],
        dead: false
    }
}

function drawShip(x, y, a, colour = "white") {
    context.strokeStyle = colour;
    context.lineWidth = SHIP_SIZE / 20;
    context.beginPath();

    // tip of the ship
    context.moveTo(
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );

    // rear left of the ship
    context.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );

    // rear right of the ship
    context.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );
    context.closePath();
    context.stroke();
}

function gameOver() {
    ship.dead = true;
    text = "Game over";
    textAlpha = 1.0;
}

function newAsteroid(x, y) {
    var asteroids_speed = Math.floor(Math.random() * 60) + 30;
    var asteroid = {
        x: x,
        y: y,
        xv: Math.random() * asteroids_speed / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * asteroids_speed / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: ASTEROIDS_SIZE / 2,
        a: Math.random() * Math.PI * 2, // in radians
        power: Math.floor(Math.random() * 4) + 1,
        numberx: 0,
        numbery: 0
    };
    return asteroid;
}

function shootRockets() {
    if (ship.canShoot && ship.rockets.length <= MAX_ROCKETS) {
        ship.rockets.push({ // we shot from the tip of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: ROCKET_SPEED * Math.cos(ship.a) / FPS,
            yv: -ROCKET_SPEED * Math.sin(ship.a) / FPS,
            distance: 0
        });
    }
    ship.canShoot = false;
}

setInterval(update, 1000 / FPS);

function keyDown(/** @type {KeyboardEvent} */ event) {

    if (ship.dead) {
        return;
    }

    switch (event.keyCode) {
        case 37: // left arrow that thursts the ship to the left
            ship.thrusting = true;
            ship.thrust.x = -SHIP_THRUST * Math.sin(ship.a);
            ship.thrust.y = -SHIP_THRUST * Math.cos(ship.a);
            break;
        case 38: // up arrow that thrusts the ship forward
            ship.thrusting = true;
            ship.thrust.x = SHIP_THRUST * Math.cos(ship.a);
            ship.thrust.y = -SHIP_THRUST * Math.sin(ship.a);
            break;
        case 39: // right arrow that thrusts the ship to the right
            ship.thrusting = true;
            ship.thrust.x = SHIP_THRUST * Math.sin(ship.a);
            ship.thrust.y = SHIP_THRUST * Math.cos(ship.a);
            break;
        case 40: // down arrow that thrusts the ship down
            ship.thrusting = true;
            ship.thrust.x = -SHIP_THRUST * Math.cos(ship.a);
            ship.thrust.y = SHIP_THRUST * Math.sin(ship.a);
            break;
        case 90: // z key rotates the ship to the left
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 67: // c key rotates the ship to the right
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 88: // x key that shots rockets
            shootRockets();
            break;

    }
}

function keyUp(/** @type {KeyboardEvent} */ event) {

    if (ship.dead) {
        return;
    }

    switch (event.keyCode) {
        case 37: // when you release the left arrow the ship stops thrusting to the left
            ship.thrusting = false;
            break;
        case 38: // when you release the up arrow the ship stops thrusting forward
            ship.thrusting = false;
            break;
        case 39: // when you release the right arrow the ship stops thrusting to the right
            ship.thrusting = false;
            break;
        case 40: // when you release the down arrow the ship stops thrusting down
            ship.thrusting = false;
            break;
        case 90: // when you release the z key the ships stops from rotating left
            ship.rot = 0;
            break;
        case 67: // when you release the c key the ships stops from rotating right
            ship.rot = 0;
            break;
        case 88: // when you release the x key the ships stops from shooting rockets
            ship.canShoot = true;
            break;
    }
}

function update() {
    var blinkOn = ship.blinkNumber % 2 == 0;
    var exploding = ship.explodeTime > 0;

    //draw space
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // thrust the ship
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

        // draw the thruster
        if (!exploding && blinkOn) {
            context.fillStyle = "red";
            context.strokeStyle = "yellow";
            context.lineWidth = SHIP_SIZE / 10;
            context.beginPath();

            context.moveTo( // rear left
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            );

            // rear center behind the ship
            context.lineTo(
                ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 5 / 3 * Math.sin(ship.a)
            );

            // rear right of the ship
            context.lineTo(
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            );

            context.closePath();
            context.fill();
            context.stroke();
        }
    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw ship
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
        }
        // handle blinking 
        if (ship.blinkNumber > 0) {
            ship.blinkTime--;
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_TIME * FPS);
                ship.blinkNumber--;
            }
        }
    } else {
        // draw the explosion
        context.fillStyle = "red";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.5, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "yellow";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "white";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.9, 0, Math.PI * 2);
        context.fill();
    }

    //draw the rockets
    for (var i = 0; i < ship.rockets.length; i++) {
        context.fillStyle = "red";
        context.beginPath();
        context.arc(ship.rockets[i].x, ship.rockets[i].y, SHIP_SIZE / 10, 0, Math.PI * 2);
        context.fill();
    }

    // draw the game over text
    if (textAlpha >= 0) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(255,255,255, " + textAlpha + ")";
        context.font = "small-caps " + TEXT_SIZE + "px times new roman";
        context.fillText(text, canvas.width / 2, canvas.height * 0.90);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    } else if (ship.dead) {
        newGame();
    }

    // draw the lives
    var lifeColour;
    for (var i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "white";
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    // draw the score
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = TEXT_SIZE + "px times new roman";
    context.fillText(score, canvas.width - SHIP_SIZE / 2, SHIP_SIZE + 15);

    // draw the high score
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = (TEXT_SIZE * 0.75) + "px times new roman";
    context.fillText("HIGH SCORE: " + HIGH_SCORE, canvas.width / 2, SHIP_SIZE + 15);

    // detect the rockets when they hit asteroids
    var ax, ay, lx, ly;
    for (var i = asteroids.length - 1; i >= 0; i--) {

        var ax, ay, lx, ly;
        // asteroid properties
        ax = asteroids[i].x;
        ay = asteroids[i].y;

        for (var j = ship.rockets.length - 1; j >= 0; j--) {

            // rocket properties
            lx = ship.rockets[j].x;
            ly = ship.rockets[j].y;

            // detect the hits
            if (distBetweenPoints(ax, ay, lx, ly) < asteroids[i].power * 22) {
                // remove the rocket
                ship.rockets.splice(j, 1);

                if (asteroids[i].power == 1) {
                    score += TINY_ASTEROIDS;
                } else if (asteroids[i].power == 2) {
                    score += SMALL_ASTEROIDS;
                } else if (asteroids[i].power == 3) {
                    score += MEDIUM_ASTEROIDS;
                } else if (asteroids[i].power == 4) {
                    score += LARGE_ASTEROIDS;
                }
                // reduce or destroy the asteroid and activate the laser explosion
                asteroids[i].power = asteroids[i].power - 1;

                if (asteroids[i].power == 0) {
                    asteroids.splice(i, 1);
                }
                if (score >= SCORE_FOR_EXTRA_LIVE) {
                    lives++;
                    SCORE_FOR_EXTRA_LIVE += SCORE_FOR_EXTRA_LIVE;
                }
                // check high score
                if (score > HIGH_SCORE) {
                    HIGH_SCORE = score;
                    localStorage.setItem(SAVE_KEY_SCORE, HIGH_SCORE);
                }
            }
        }

    }
    // check for asteroid and ship collisions
    if (!exploding) {
        if (ship.blinkNumber == 0 && !ship.dead) {
            for (var i = 0; i < asteroids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < asteroids[i].power * 22) {
                    explodeShip();
                    if (asteroids[i].power == 1) {
                        score += TINY_ASTEROIDS;
                    } else if (asteroids[i].power == 2) {
                        score += SMALL_ASTEROIDS;
                    } else if (asteroids[i].power == 3) {
                        score += MEDIUM_ASTEROIDS;
                    } else if (asteroids[i].power == 4) {
                        score += LARGE_ASTEROIDS;
                    }
                    asteroids[i].power = asteroids[i].power - 1;

                    if (asteroids[i].power == 0) {
                        asteroids.splice(i, 1);
                    }

                    if (score >= SCORE_FOR_EXTRA_LIVE) {
                        lives++;
                        SCORE_FOR_EXTRA_LIVE += SCORE_FOR_EXTRA_LIVE;
                    }
                    // check high score
                    if (score > HIGH_SCORE) {
                        HIGH_SCORE = score;
                        localStorage.setItem(SAVE_KEY_SCORE, HIGH_SCORE);
                    }
                }
            }
            if (asteroids.length == 0) {
                gameCompleted();
            }
        }
    } else {
        //reduce the explode time
        ship.explodeTime--;

        // reset the ship after the explosion has finished
        if (ship.explodeTime == 0) {
            lives--;
            if (lives == 0) {
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }

    // rotate ship
    ship.a += ship.rot;

    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    // handle edge of the screen
    if (ship.x < 0 - ship.r) {
        ship.x = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.x = 0 - ship.r
    }

    if (ship.y < 0 - ship.r) {
        ship.y = canvas.height + ship.r;
    } else if (ship.y > canvas.height + ship.r) {
        ship.y = 0 - ship.r;
    }

    //move the rockets
    for (var i = ship.rockets.length - 1; i >= 0; i--) {

        // check distance travelled
        if (ship.rockets[i].distance > ROCKET_DISTANCE * canvas.width) {
            ship.rockets.splice(i, 1);
            continue; // skips the iteration and goes back to the loop
        }

        // handle the explosion
        if (ship.rockets[i].explodeTime > 0) {
            ship.rockets[i].explodeTime--;

            // destroy the rocket after the duration is up
            if (explodeTime == 0) {
                ship.rockets.splice(i, 1);
                continue;
            }
        } else {

            // move the rockets
            ship.rockets[i].x += ship.rockets[i].xv;
            ship.rockets[i].y += ship.rockets[i].yv;

            // calculate the distance travelled
            ship.rockets[i].distance += Math.sqrt(Math.pow(ship.rockets[i].xv, 2) + Math.pow(ship.rockets[i].yv, 2));
        }
    }

    // draw the asteroids
    var x, y, r, a, power;
    for (var i = 0; i < asteroids.length; i++) {

        context.strokeStyle = "slategrey";
        context.lineWidth = SHIP_SIZE / 20;

        // get the asteroid properties
        x = asteroids[i].x;
        y = asteroids[i].y;
        r = asteroids[i].r;
        a = asteroids[i].a;
        power = asteroids[i].power

        if (power == 1) {
            context.strokeStyle = "red";
            context.fillStyle = "red";
        }
        else if (power == 2) {
            context.strokeStyle = "orange";
            context.fillStyle = "orange";
        }
        else if (power == 3) {
            context.strokeStyle = "yellow";
            context.fillStyle = "yellow";
        }
        else if (power == 4) {
            context.strokeStyle = "white";
            context.fillStyle = "white";
        }

        // draw a path
        context.beginPath();
        context.moveTo(
            x + r * Math.cos(a),
            y + r * Math.sin(a)
        );

        // draw circles
        context.beginPath();
        context.arc(x, y, power * 20, 0, 2 * Math.PI);
        context.stroke();

        context.font = "20px TIMES NEW ROMAN";
        context.textAlign = "center";
        asteroids[i].numberx = x - power / 2;
        asteroids[i].numbery = y + power / 2;
        context.strokeText(power, asteroids[i].numberx, asteroids[i].numbery);
    }

    for (var i = 0; i < asteroids.length; i++) {
        // move the asteroids
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].numberx += asteroids[i].xv
        asteroids[i].y += asteroids[i].yv;
        asteroids[i].numbery += asteroids[i].yv

        //handle edge of screen for the asteroids 
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canvas.width + asteroids[i].r;
        } else if (asteroids[i].x > canvas.width + asteroids[i].r) {
            asteroids[i].x = 0 - asteroids[i].r;
        }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canvas.height + asteroids[i].r;
        } else if (asteroids[i].y > canvas.height + asteroids[i].r) {
            asteroids[i].y = 0 - asteroids[i].r;
        }
    }
}