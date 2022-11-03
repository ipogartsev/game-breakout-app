const socket = io.connect()

const player = {
  host: false,
  roomId: null,
  username: '',
  socketId: '',
  paddleX: 0,
  paddleY: 0,
}

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const roomId = urlParams.get('room')

const brickRowCount = 8
const brickColumnCount = 8

let paddles = []
let bricks = []
let balls = []
let bonuses = []
let particles = []
let score
let lives
let paddleWidth = 75
let paddleHeight = 20
let done = true
let hue
let timer
let level

const usernameSpan = document.querySelector('#username')

const gameCard = document.querySelector('#game-card')
const notificationCard = document.querySelector('#notification-card')
const startArea = document.querySelector('#start-area')
const restartArea = document.querySelector('#restart-area')
const waitingArea = document.querySelector('#waiting-area')
const notificationMsg = document.querySelector('#notification-message')
const container = document.querySelector('.content--canvas')
const liveText = document.querySelector('.live-text')
const scoreText = document.querySelector('.score-text')
const levelText = document.querySelector('.level-text')
const timerText = document.querySelector('.timer-text')

const shopCard = document.querySelector('#shop-card')

let canvas = {
  a: document.createElement('canvas'),
}

canvas.a.width = 720
canvas.a.height = 480
canvas.a.style = `
         display: block;
		 width: 100%;
		 height: 100%;
		 box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px, rgb(51, 51, 51) 0px 0px 0px 3px;
		 background-color:#1b1b1b;
	`
container.appendChild(canvas.a)
let ctx = {
  a: canvas.a.getContext('2d'),
}

let paddleX = (canvas.a.width - paddleWidth) / 2
let paddleY = canvas.a.height - paddleHeight

document.addEventListener('mousemove', mouseMoveHandler, false)

$('#startGame').click(function (e) {
  e.preventDefault()
  player.username = usernameSpan.textContent
  player.paddleX = paddleX
  player.paddleY = paddleY

  if (roomId) {
    player.roomId = roomId
  } else {
    player.host = true
  }

  player.socketId = socket.id
  startArea.hidden = true

  gameCard.classList.remove('d-none')
  startArea.classList.add('d-none')
  done = false

  socket.emit('playerData', player)
})

$('#restartGame').click(function (e) {
  e.preventDefault()
  restartArea.classList.add('d-none')
  notificationCard.classList.add('d-none')

  gameCard.classList.remove('d-none')
  done = false

  socket.emit('play again', player)
})

$('#nextGame').click(function (e) {
  e.preventDefault()
  waitingArea.classList.add('d-none')
  notificationCard.classList.add('d-none')

  gameCard.classList.remove('d-none')
  done = false

  socket.emit('next level', player)
})

socket.on('join room', (roomId) => {
  player.roomId = roomId
  player.paddleX = paddleX
  player.paddleY = paddleY
})

socket.on('play', (player, game) => {
  paddles = game.paddles
  bricks = game.bricks
  balls = game.balls
  bonuses = game.bonuses
  particles = game.particles
  lives = game.lives
  score = game.score
  paddleWidth = game.paddleWidth
  paddleHeight = game.paddleHeight
  hue = game.hue
  timer = game.timer
  level = game.level

  if (game.win) {
    showWaitingArea()
  }

  if (!game.lives) {
    showRestartArea()
  }

  if (!done) {
    requestAnimationFrame(draw)
  }
})

socket.on('play again waiting area', () => {
  restartArea.classList.remove('d-none')
})

socket.on('waiting area', () => {
  shopCard.classList.remove('d-none')
})


function mouseMoveHandler(e) {
  const relativeX = (e.clientX - canvas.a.getBoundingClientRect().left) * e.target.width  / canvas.a.clientWidth;

  if (
      relativeX > (paddleWidth / 2) &&
      relativeX < canvas.a.width - (paddleWidth / 2)
  ) {
    player.paddleX = relativeX - paddleWidth / 2
  }
}

function showRestartArea() {
  done = true

  if (player.host) {
    gameCard.classList.add('d-none')
    notificationCard.classList.remove('d-none')
    //restartArea.classList.remove('d-none')
    setNotificationMessage(
        'alert-success',
        'alert-danger',
        'Tu as perdu la partie ' + player.username + ' !',
    )

    socket.emit('play again waiting area', player)
  }
}

function showWaitingArea() {
  done = true

  if (player.host) {
    gameCard.classList.add('d-none')
    notificationCard.classList.remove('d-none')
    waitingArea.classList.remove('d-none')
    setNotificationMessage(
        'alert-danger',
        'alert-success',
        'Félicitations, tu as gagné la partie ' + player.username + ' !',
    )
  }
}

function setNotificationMessage(classToRemove, classToAdd, html) {
  notificationMsg.classList.remove(classToRemove)
  notificationMsg.classList.add(classToAdd)
  notificationMsg.innerHTML = html
}

function drawSprite(sprite) {
  ctx.a.save()
  ctx.a.translate(
      sprite.position.x + sprite.width / 2,
      sprite.position.y + sprite.height / 2,
  )
  ctx.a.rotate(sprite.rotation)
  ctx.a.translate(
      -sprite.position.x - sprite.width / 2,
      -sprite.position.y - sprite.height / 2,
  )
  ctx.a.globalAlpha = sprite.opacity

  ctx.a.scale(sprite.scale, sprite.scale)

  const image = new Image()
  image.src = sprite.src

  ctx.a.drawImage(
      image,
      sprite.frames.val * (image.width / sprite.frames.max),
      0,
      image.width / sprite.frames.max,
      image.height,
      sprite.position.x,
      sprite.position.y,
      sprite.width,
      sprite.height,
  )
  ctx.a.restore()
}

function drawBalls() {
  balls.forEach((ball) => {
    drawSprite(ball.sprite)
  })
}

function drawPaddle() {
  paddles.forEach((paddle) => {
    drawSprite(paddle.sprite)
  })
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status > 0) {
        drawSprite(bricks[c][r].sprite)
      }
    }
  }
}

function drawBonuses() {
  bonuses.forEach((bonus) => {
    drawSprite(bonus.sprite)
  })
}

function drawScore() {
  scoreText.innerHTML= score
}

function drawLives() {
  liveText.innerHTML= lives
}

function drawLevel() {
  levelText.innerHTML= level
}

function drawTimer() {
  timerText.innerHTML= Math.round(parseFloat(timer)).toString()
}

function drawParticles() {
  ctx.a.fillStyle = `hsla(${hue}, 50%, 50%, 1)`
  particles.forEach((p) => {
    ctx.a.fillRect(p.pos.x, p.pos.y, p.size, p.size)
  })
}

function draw() {
  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height)

  drawParticles()
  drawBricks()
  drawBalls()
  drawPaddle()
  drawBonuses()
  drawScore()
  drawLives()
  drawLevel()
  drawTimer()

  socket.emit('collision detection', player)
}
