const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game settings and variables
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 16;
const PADDLE_SPEED = 6;
const PADDLE_RADIUS = 7;
const PADDLE_VERTICAL_MARGIN = 10;

// Score and pause elements
let leftScore = 0;
let rightScore = 0;
const leftScoreSpan = document.getElementById('left-score');
const rightScoreSpan = document.getElementById('right-score');
let paused = false;
const pauseHint = document.getElementById('pause-hint');

// Persistent settings functions
function getSetting(key, fallback) {
  const value = localStorage.getItem(key);
  return value !== null ? Number(value) : fallback;
}
function setSetting(key, value) {
  localStorage.setItem(key, String(value));
}

// Initial game settings from storage
let BALL_SPEED = getSetting('ballSpeed', 5);
let AI_SPEED = getSetting('botDifficulty', 4);
BALL_SPEED = Math.max(1, Math.min(10, BALL_SPEED));
AI_SPEED = Math.max(1, Math.min(10, AI_SPEED));

// Paddle and ball objects
let leftPaddle = {
  x: 10,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};
let rightPaddle = {
  x: WIDTH - PADDLE_WIDTH - 10,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};
let ball = {
  x: WIDTH / 2 - BALL_SIZE / 2,
  y: HEIGHT / 2 - BALL_SIZE / 2,
  vx: 0,
  vy: 0
};

// Ball velocity helpers
function setBallVelocityFromAngle(angle, speed) {
  ball.vx = speed * Math.cos(angle);
  ball.vy = speed * Math.sin(angle);
}
function getRandomBallAngle() {
  let minAngle = (Math.PI / 9);
  let maxAngle = (Math.PI / 3.5);
  let angle = minAngle + Math.random() * (maxAngle - minAngle);
  if (Math.random() < 0.5) angle = -angle;
  if (Math.random() < 0.5) angle = Math.PI - angle;
  return angle;
}
setBallVelocityFromAngle(getRandomBallAngle(), BALL_SPEED);

// Settings panel controls
const ballSpeedSlider = document.getElementById('ball-speed-slider');
const ballSpeedValue = document.getElementById('ball-speed-value');
const botDifficultySlider = document.getElementById('bot-difficulty-slider');
const botDifficultyValue = document.getElementById('bot-difficulty-value');

ballSpeedSlider.value = BALL_SPEED;
botDifficultySlider.value = AI_SPEED;
ballSpeedValue.textContent = BALL_SPEED;
botDifficultyValue.textContent = AI_SPEED;

ballSpeedSlider.addEventListener('input', function() {
  BALL_SPEED = parseInt(ballSpeedSlider.value);
  ballSpeedValue.textContent = BALL_SPEED;
  setSetting('ballSpeed', BALL_SPEED);
  let angle = Math.atan2(ball.vy, ball.vx);
  setBallVelocityFromAngle(angle, BALL_SPEED);
});
botDifficultySlider.addEventListener('input', function() {
  AI_SPEED = parseInt(botDifficultySlider.value);
  botDifficultyValue.textContent = AI_SPEED;
  setSetting('botDifficulty', AI_SPEED);
});

// Paddle movement
document.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  let mouseY = e.clientY - rect.top;
  leftPaddle.y = mouseY - leftPaddle.height / 2;
  leftPaddle.y = Math.max(PADDLE_VERTICAL_MARGIN, Math.min(HEIGHT - PADDLE_HEIGHT - PADDLE_VERTICAL_MARGIN, leftPaddle.y));
});

// Pause logic
function updatePauseHint() {
  pauseHint.textContent = paused ? "Press Space to Unpause" : "Press Space to Pause";
}
updatePauseHint();
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    paused = !paused;
    updatePauseHint();
    if (e.preventDefault) e.preventDefault();
  }
});

// Drawing functions
function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  drawRoundedRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, PADDLE_RADIUS);
  drawRoundedRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, PADDLE_RADIUS);
  ctx.beginPath();
  ctx.arc(ball.x + BALL_SIZE / 2, ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

// Game update logic
function update() {
  if (paused) return;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Ball collision with walls
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy *= -1;
  }
  if (ball.y + BALL_SIZE >= HEIGHT) {
    ball.y = HEIGHT - BALL_SIZE;
    ball.vy *= -1;
  }

  // Ball collision with paddles
  if (
    ball.x <= leftPaddle.x + leftPaddle.width &&
    ball.y + BALL_SIZE >= leftPaddle.y &&
    ball.y <= leftPaddle.y + leftPaddle.height
  ) {
    ball.x = leftPaddle.x + leftPaddle.width;
    let relativeIntersectY = (leftPaddle.y + leftPaddle.height / 2) - (ball.y + BALL_SIZE / 2);
    let normalizedIntersectY = relativeIntersectY / (leftPaddle.height / 2);
    let bounceAngle = normalizedIntersectY * (Math.PI / 3);
    setBallVelocityFromAngle(bounceAngle, BALL_SPEED);
    if (ball.vx < 0) ball.vx = Math.abs(ball.vx);
  }
  if (
    ball.x + BALL_SIZE >= rightPaddle.x &&
    ball.y + BALL_SIZE >= rightPaddle.y &&
    ball.y <= rightPaddle.y + rightPaddle.height
  ) {
    ball.x = rightPaddle.x - BALL_SIZE;
    let relativeIntersectY = (rightPaddle.y + rightPaddle.height / 2) - (ball.y + BALL_SIZE / 2);
    let normalizedIntersectY = relativeIntersectY / (rightPaddle.height / 2);
    let bounceAngle = Math.PI - (normalizedIntersectY * (Math.PI / 3));
    setBallVelocityFromAngle(bounceAngle, BALL_SPEED);
    if (ball.vx > 0) ball.vx = -Math.abs(ball.vx);
  }

  // Ball out of bounds and score update
  if (ball.x < 0) {
    rightScore++;
    rightScoreSpan.textContent = rightScore;
    resetBall();
  } else if (ball.x > WIDTH) {
    leftScore++;
    leftScoreSpan.textContent = leftScore;
    resetBall();
  }

  // AI paddle movement
  let aiTarget = ball.y + BALL_SIZE / 2 - rightPaddle.height / 2;
  if (aiTarget > rightPaddle.y) {
    rightPaddle.y += AI_SPEED;
  } else if (aiTarget < rightPaddle.y) {
    rightPaddle.y -= AI_SPEED;
  }
  rightPaddle.y = Math.max(PADDLE_VERTICAL_MARGIN, Math.min(HEIGHT - rightPaddle.height - PADDLE_VERTICAL_MARGIN, rightPaddle.y));
}

// Utility
function resetBall() {
  ball.x = WIDTH / 2 - BALL_SIZE / 2;
  ball.y = HEIGHT / 2 - BALL_SIZE / 2;
  let angle = getRandomBallAngle();
  setBallVelocityFromAngle(angle, BALL_SPEED);
}

// Main loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();