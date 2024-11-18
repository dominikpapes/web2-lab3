const coyote_time = 5; // slight advantage to the player
const ball_speed = 10;
const stick_speed = 10;
const brick_margin = 5;
const header_margin = 75;
const counter_size = 50;

let myStick;
let myBall;

let bricks = [];
let brickRows = 5;
let brickCols = 10;

let ballshot = false;
let isGameOver = false;
let win = false;
let score = 0;
let hiscore = false;

let myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = window.innerWidth * 0.95;
        this.canvas.height = window.innerHeight * 0.95;
        this.context = this.canvas.getContext("2d");

        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        // refresh canvas every 20 miliseconds -> 50fps
        this.interval = setInterval(updateGameArea, 20);
        window.addEventListener('keydown', function (e) {
            myGameArea.key = e.keyCode;
            if (isGameOver && e.keyCode === 32) {
                startGame();
            }
        })
        window.addEventListener('keyup', function (e) {
            if (e.keyCode === 32 && !ballshot) { // Space key to shoot
                myBall.shoot();
                ballshot = true;
            }
            myGameArea.key = false;
        })
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawGameOver: function () {
        const ctx = this.context;
        ctx.font = "40px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
        this.drawHiScore();
    },
    drawWinningScreen: function () {
        const ctx = this.context;
        ctx.font = "40px Arial";
        ctx.fillStyle = "green";
        ctx.textAlign = "center";
        ctx.fillText("Congratulations! You have won!", this.canvas.width / 2, this.canvas.height / 2);
        this.drawHiScore();
    },
    drawHiScore: function () {
        const ctx = this.context;
        ctx.font = "30px Arial";
        ctx.fillText(`HISCORE: ${hiscore}`,  this.canvas.width / 2,this.canvas.width / 2);
        ctx.font = "20px Arial";
        ctx.fillText("Press SPACE to Restart", this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
};

function startGame() {
    ballshot = false;
    isGameOver = false;
    win = false;
    score = 0;
    bricks = [];

    myGameArea.start();
    myStick = new stick(200, 30, "red", 10, 120);
    myBall = new ball(15, "blue");
    createBricks();
}

function scoreCounter() {
    this.x = myGameArea.canvas.width - counter_size;
    this.y = counter_size;
    const ctx = myGameArea.context;
    ctx.font = "30px Arial";
    ctx.fillStyle = "green";
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${score} / ${bricks.length}`,  this.x, this.y);
}

function header() {
    this.context = myGameArea.canvas.getContext("2d");

    // draw header separator
    this.context.beginPath();
    this.context.moveTo(0, header_margin);
    this.context.lineTo(myGameArea.canvas.width, header_margin);
    this.context.strokeStyle = "blue";  // Line color
    this.context.lineWidth = 5;
    this.context.stroke();
}

function stick(width, height, color) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.x = (myGameArea.canvas.width - this.width) / 2;
    this.y = myGameArea.canvas.height - this.height;
    this.update = function(){
        const ctx = myGameArea.context;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent"
    }
    this.newPos = function(){
        this.x += this.speedX;

        // boundary checks
        if (this.x < 0) this.x = 0; // left boundary
        if (this.x + this.width > myGameArea.canvas.width) {
            this.x = myGameArea.canvas.width - this.width; // right boundary
        }
    }
}

function ball(radius, color) {
    this.radius = radius;
    this.color = color;
    this.x = myStick.x + myStick.width / 2;
    this.y = myStick.y - this.radius;
    this.speedX = 0;
    this.speedY = 0;

    this.shoot = function() {
        const angle = Math.random() * (Math.PI / 3) + Math.PI / 6; // Random angle between 30° (PI/6) and 150° (5PI/6)
        const speed = ball_speed;
        this.speedX = speed * Math.cos(angle);
        this.speedY = -speed * Math.sin(angle);
    };

    this.update = function(){
        const ctx = myGameArea.context;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    };

    this.newPos = function(){
        if (!ballshot) {
            this.x = myStick.x + myStick.width / 2;
            this.y = myStick.y - this.radius;
        } else {
            // update ball position
            this.x += this.speedX;
            this.y += this.speedY;

            // check for wall bounce -> left || right
            if (this.x - this.radius < 0 || this.x + this.radius > myGameArea.canvas.width) {
                this.speedX = -this.speedX;
            }

            // check for ceiling bounce
            if (this.y - this.radius < header_margin) {
                this.speedY = -this.speedY;
            }

            // check for stick bounce
            if (this.y + this.radius >= myStick.y && // ball is at the height of the stick
                this.x + coyote_time >= myStick.x && this.x + this.radius <= myStick.width + myStick.x + coyote_time && // ball is within the stick width
                this.speedY > 0 ) { // ball is moving downwards
                this.speedY = -this.speedY;

                // Add a slight effect based on where the ball hits the stick
                const hitPosition = (this.x - myStick.x) / myStick.width; // 0 (left) to 1 (right)
                this.speedX += (hitPosition - 0.5) * 2; // Adjust horizontal speed based on hit position
            }

            // check for hitting the floor -> game over
            if (this.y + this.radius > myGameArea.canvas.height) {
                ballshot = false;
                isGameOver = true;
                this.speedY = 0;
                this.speedX = 0;
            }

            // Check collision with bricks
            for (let i = 0; i < bricks.length; i++) {
                const brick = bricks[i];
                if (brick.active && this.collidesWith(brick)) {
                    this.speedY = -this.speedY;
                    brick.active = false;
                    score += 1;
                    console.log(score);
                    if (score === bricks.length) {
                        win = true;
                    }
                }
            }
        }
    };

    // Check collision with a brick
    this.collidesWith = function (brick) {
        return (
            this.x + this.radius > brick.x &&
            this.x - this.radius < brick.x + brick.width &&
            this.y + this.radius > brick.y &&
            this.y - this.radius < brick.y + brick.height
        );
    };
}

function brick(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.active = true; // brick is visible

    this.update = function(){
        if (this.active) {
            const ctx = myGameArea.context;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
}

function createBricks() {
    const available_width = myGameArea.canvas.width - 2 * brick_margin;
    const brickwidth = (available_width - (brickCols - 1) * brick_margin) / brickCols;
    const brickheight = 20;
    const colors = ["red", "orange", "yellow", "green", "blue"];

    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {

            let x = c * (brickwidth + brick_margin) + brick_margin;
            let y = r * (brickheight + brick_margin) + brick_margin + header_margin;

            bricks.push(new brick(x, y, brickwidth, brickheight, colors[r % colors.length]));
        }
    }

}

function gameOver() {
    hiscore = localStorage.getItem('hiscore');
    console.log("Hiscore: ", hiscore)
    if (hiscore) {
        if (score > hiscore) {
            localStorage.setItem('hiscore', score);
        }
    } else {
        localStorage.setItem('hiscore', score);
    }
    hiscore = localStorage.getItem('hiscore');
    isGameOver = true;
    clearInterval(myGameArea.interval);

}

function updateGameArea() {
    if (win) {
        gameOver();
        myGameArea.drawWinningScreen();
    }
    else if (!isGameOver) {
        myGameArea.clear();
        myStick.speedX = 0;
        if (myGameArea.key && myGameArea.key === 37) {myStick.speedX = -stick_speed; }
        if (myGameArea.key && myGameArea.key === 39) {myStick.speedX = stick_speed; }

        // update positions
        myStick.newPos();
        myBall.newPos();

        // render
        myStick.update();
        myBall.update();
        scoreCounter();
        header();

        // update bricks
        bricks.forEach((brick) => brick.update());
    }
    else {
        gameOver();
        myGameArea.drawGameOver();
    }
}