const coyote_time = 5; // daje malu prednost igracu na nacin da produzi palicu za coyote_time nevidljivih piksela
const ball_speed = 15; // brzina kojom se giba loptica
const stick_speed = 15; // brzina kojom se giba palica
const brick_margin = 5; // udaljenost izmedu ciglica
const header_margin = 75; // margina za polje za prikaz broja bodova
const counter_size = 50;

let myStick;
let myBall;

let bricks = [];
let brickRows = 5;
let brickCols = 10;

let ballshot = false; // je li loptica ispucana
let isGameOver = false; // je li igra gotova
let win = false; // je li igrac pobijedio
let score = 0;
let hiscore = false;

let myGameArea = {
    canvas : document.createElement("canvas"), // stvaranje canvas elementa
    start : function() {
        this.canvas.width = window.innerWidth * 0.95;
        this.canvas.height = window.innerHeight * 0.95;
        this.context = this.canvas.getContext("2d");

        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        // osjvezi canvas svakih 20 milisekundi -> 50 FPS
        this.interval = setInterval(updateGameArea, 20);
        window.addEventListener('keydown', function (e) {
            myGameArea.key = e.keyCode;
            if (isGameOver && e.keyCode === 32) { // space restarta igru
                startGame();
            }
        })
        window.addEventListener('keyup', function (e) {
            if (e.keyCode === 32 && !ballshot) { // space ispucava lopticu
                myBall.shoot();
                ballshot = true;
            }
            myGameArea.key = false;
        })
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawGameOver: function () { // funkcija za iscrtavanje game over ekrana
        const ctx = this.context;
        ctx.font = "40px Monospace";
        ctx.fillStyle = "#cc241d";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
        this.drawHiScore();
    },
    drawWinningScreen: function () { // funkcija za iscrtavanje pobjednickog ekrana
        const ctx = this.context;
        ctx.font = "40px Monospace";
        ctx.fillStyle = "#b8bb26";
        ctx.textAlign = "center";
        ctx.fillText("Congratulations!", this.canvas.width / 2, this.canvas.height / 2);
        this.drawHiScore();
    },
    drawHiScore: function () { // funkcija za iscrtavanje najboljeg rezultata
        const ctx = this.context;
        ctx.font = "30px Monospace";
        ctx.fillText(`HISCORE: ${hiscore}`,  this.canvas.width / 2,this.canvas.width / 2);
        ctx.font = "20px Monospace";
        ctx.fillText("Press SPACE to Restart", this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
};

function startGame() { // funkcija za pokretanje igre - resetiranje default vrijednosti
    ballshot = false;
    isGameOver = false;
    win = false;
    score = 0;
    bricks = [];

    myGameArea.start();
    myStick = new stick(200, 30, "#BB000E");
    myBall = new ball(15, "white");
    createBricks();
}

function scoreCounter() { // prikaz brojaca bodova
    this.x = myGameArea.canvas.width - counter_size;
    this.y = counter_size;
    const ctx = myGameArea.context;
    ctx.font = "30px Monospace";
    ctx.fillStyle = "#98971a";
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${score} / ${bricks.length}`,  this.x, this.y);
}

function header() { // funkcija za crtanje header linije
    this.context = myGameArea.canvas.getContext("2d");
    this.context.beginPath();
    this.context.moveTo(0, header_margin);
    this.context.lineTo(myGameArea.canvas.width, header_margin);
    this.context.strokeStyle = "white";  // Line color
    this.context.lineWidth = 1;
    this.context.stroke();
}

function stick(width, height, color) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.x = (myGameArea.canvas.width - this.width) / 2;
    this.y = myGameArea.canvas.height - this.height;
    this.update = function(){ // koristi se za azuriranje pri svakom okviricu
        const ctx = myGameArea.context;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#BB000E";
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent"
    }
    this.newPos = function(){
        this.x += this.speedX;

        // provjera granica - lijevo / desno
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
        const angle = Math.random() * (Math.PI / 3) + Math.PI / 6; // nasumicni odabir pocetnog kuta loptice
        const speed = ball_speed;
        this.speedX = speed * Math.cos(angle);
        this.speedY = -speed * Math.sin(angle);
    };

    this.update = function(){ // koristi se za azuriranje pri svakom okviricu
        const ctx = myGameArea.context;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "white";
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent"
    };

    this.newPos = function(){ // azuriranje pozicije
        if (!ballshot) { // ako loptica nije ispaljena, zaljepljena je za palicu
            this.x = myStick.x + myStick.width / 2;
            this.y = myStick.y - this.radius;
        } else {
            this.x += this.speedX;
            this.y += this.speedY;

            // odbijanje od zidova
            if (this.x - this.radius < 0 || this.x + this.radius > myGameArea.canvas.width) {
                this.speedX = -this.speedX;
            }

            // odbijanje od stropa
            if (this.y - this.radius < header_margin) {
                this.y = header_margin + this.radius;
                this.speedY = -this.speedY;
            }

            // odbijanje od palice
            if (this.y + this.radius >= myStick.y && // loptica je na visini palice
                this.x + coyote_time >= myStick.x && this.x + this.radius <= myStick.width + myStick.x + coyote_time && // loptica se nalazi unutar sirine palice
                this.speedY > 0 ) { // loptica se krece prema dolje
                this.speedY = -this.speedY;

                // dodatak efekta ovisno o polozaju udarca loptice o palicu
                const hitPosition = (this.x - myStick.x) / myStick.width; // 0 (lijevo) do 1 (desno)
                this.speedX += (hitPosition - 0.5) * 2; // podesi horizontalnu brzinu na temelju pozicije udarca
            }

            // provjera za udarac o pod -> game over
            if (this.y + this.radius > myGameArea.canvas.height) {
                ballshot = false;
                isGameOver = true;
                this.speedY = 0;
                this.speedX = 0;
            }

            // provjera za sudaranje s ciglama
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

    // funkcija za provjeru kolizije s ciglom
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
    this.active = true; // cigla je vidljiva

    this.update = function(){
        if (this.active) {
            const ctx = myGameArea.context;
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent"
        }
    };
}

function createBricks() { // funkcija za stvaranje redova cigli
    const available_width = myGameArea.canvas.width - 2 * brick_margin; // dostupna sirina nakon dodavanja vanjskih margina
    const brickwidth = (available_width - (brickCols - 1) * brick_margin) / brickCols; // izracunata sirina cigle
    const brickheight = 20;
    const colors = ["#8ec07c", "#458588", "#d79921", "#cc241d", "#b16286"];

    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {

            let x = c * (brickwidth + brick_margin) + brick_margin;
            let y = r * (brickheight + brick_margin) + brick_margin + header_margin;

            bricks.push(new brick(x, y, brickwidth, brickheight, colors[r % colors.length])); // dodavanje cigle i odabir boje na temelju rednog broja retka
        }
    }

}

function gameOver() {
    // provjeri ako hiscore postoji u localstorage
    // ako postoji provjeri je li trenutni rezultat veci od dosadasnjeg najboljeg
    // -- ako jest postavi trenutni kao hiscore u localstorage
    // ako ne postoji postavi trenutni hiscore u localstorage
    hiscore = localStorage.getItem('hiscore');
    console.log("Hiscore: ", hiscore)
    if (hiscore) {
        if (score > hiscore) {
            localStorage.setItem('hiscore', score);
        }
    } else {
        localStorage.setItem('hiscore', score);
    }
    hiscore = localStorage.getItem('hiscore'); // dohvati trenutni hiscore iz localstorage
    isGameOver = true;
    clearInterval(myGameArea.interval); // zaustavi konstantno azuriranje okvirica do ponovnog pokretanja

}

function updateGameArea() { // funkcija za azuriranje okvirica
    if (win) {
        gameOver();
        myGameArea.drawWinningScreen(); // ucitaj pobjednicki ekran
    }
    else if (!isGameOver) {
        myGameArea.clear(); // ocisti canvas kako ne bi ostajali tragovi
        myStick.speedX = 0;
        if (myGameArea.key && myGameArea.key === 37) {myStick.speedX = -stick_speed; }
        if (myGameArea.key && myGameArea.key === 39) {myStick.speedX = stick_speed; }

        // azuriraj pozicije pokretnih elemenata - lopta i palica
        myStick.newPos();
        myBall.newPos();

        // ponovno renderiraj elemente
        myStick.update();
        myBall.update();
        scoreCounter();
        header();

        // azuriraj cigle
        bricks.forEach((brick) => brick.update());
    }
    else {
        gameOver();
        myGameArea.drawGameOver(); // ucitaj zavrsni ekran
    }
}