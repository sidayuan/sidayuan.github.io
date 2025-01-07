// Set up the canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function calculateDistance(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) }

function findNearbyNodes(nodes, node, radius) {
  const nearbyNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if (calculateDistance(nodes[node], nodes[i]) <= radius) { nearbyNodes.push(i); }
  }
  return nearbyNodes;
}

class Player {
  constructor(initialPosition, moveRadius) {
    this.position = initialPosition;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
  }

  setNextPosition(nextPosition, nodes) {
    if (nextPosition == null) {
      this.nextPosition = null;
      return null;
    }
    if (calculateDistance(nodes[this.position], nodes[nextPosition]) <= this.moveRadius) {
      this.nextPosition = nextPosition;
      return nextPosition;
    } else {
      return null;
    }
  }

  move() {
    if (this.nextPosition != null) {
      this.position = this.nextPosition;
      this.nextPosition = null;
    }
  }
}

class Enemy {
  constructor(initialPosition, moveRadius) {
    this.position = initialPosition;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
    this.inPursuit = true;
  }

  decideNextPosition(nodes, player) {
    const nearbyNodes = findNearbyNodes(nodes, this.position, this.moveRadius);
    if (this.inPursuit) {
      const nearbyNodesPlayer = findNearbyNodes(nodes, player.position, player.moveRadius);
      const intersectionNodes = nearbyNodes.filter(value => nearbyNodesPlayer.includes(value));
      if (intersectionNodes.length > 0) {
        this.nextPosition = intersectionNodes[Math.floor(Math.random() * intersectionNodes.length)];
      } else {
        // the following chase logic can be generalised using recursion
        const nearbyNodeSet = {}
        const paths = [];
        for (let i = 0; i < nearbyNodes.length; i++) {
          nearbyNodeSet[[i]] = findNearbyNodes(nodes, nearbyNodes[i], this.moveRadius);
          for (let j = 0; j < nearbyNodeSet[[i]].length; j++) {
            nearbyNodeSet[[i, j]] = findNearbyNodes(nodes, nearbyNodeSet[[i]][j], this.moveRadius);
              for (let k = 0; k < nearbyNodeSet[[i, j]].length; k++) {
                if ((nearbyNodeSet[[i, j]][k] != nearbyNodeSet[[i]][j]) & (nearbyNodeSet[[i, j]][k] != nearbyNodes[i]) & (nearbyNodeSet[[i, j]][k] != this.position)) {
                  paths.push([nearbyNodes[i], nearbyNodeSet[[i]][j], nearbyNodeSet[[i, j]][k]]);
                  if (player.position == nearbyNodeSet[[i, j]][k]) { break; }
                }
              }
          }
        }
        let closestIndex = 0;
        let closestDist = Infinity;
        for (let i = 0; i < paths.length; i++) {
          let newDist = calculateDistance(nodes[player.position], nodes[paths[i][2]]);
          if (newDist < closestDist) {
            closestDist = newDist;
            closestIndex = i;
          }
          if (closestDist == 0) { break; }
        }
        this.nextPosition = paths[closestIndex][0];
      }
    } else {
      this.nextPosition = nearbyNodes[Math.floor(Math.random() * nearbyNodes.length)];
    }
  }

  move() {
    this.position = this.nextPosition;
    this.nextPosition = null;
  }
}

class Game {
  constructor(
    numNodes,
    nodeRadius,
    playerMoveRadius,
    playerInitialPosition,
    enemyMoveRadius,
    enemyInitialPositions
  ) {
    this.playerColor = 'Lime';
    this.enemyColor = 'OrangeRed';
    this.safeColor = 'DeepSkyBlue';
    this.nodeColor = 'white';

    this.turn = 0;
    this.numNodes = numNodes;
    this.nodeRadius = nodeRadius;
    this.nodes = [];
    this.generateNodes();

    this.safeNode = Math.floor(Math.random() * this.numNodes);

    this.player = new Player(playerInitialPosition, playerMoveRadius);
    this.enemies = [];
    for (let i = 0; i < enemyInitialPositions.length; i++) {
      this.enemies.push(new Enemy(enemyInitialPositions[i], enemyMoveRadius[i]));
      this.enemies[i].decideNextPosition(this.nodes, this.player);
    }

    this.draw()
  }

  generateNodes() {
    for (let i = 0; i < this.numNodes; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      this.nodes.push([x, y]);
    }
  }

  drawNodes() {
    this.nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node[0], node[1], this.nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.nodeColor;
      ctx.fill();
    });
  }

  drawPlayerAndEnemies() {
    ctx.beginPath();
    ctx.arc(this.nodes[this.player.position][0], this.nodes[this.player.position][1], this.nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.playerColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.nodes[this.player.position][0], this.nodes[this.player.position][1], this.player.moveRadius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "PaleGreen";
    ctx.stroke();
    for (let i = 0; i < this.enemies.length; i++) {
      ctx.beginPath();
      ctx.arc(this.nodes[this.enemies[i].position][0], this.nodes[this.enemies[i].position][1], this.nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.enemyColor;
      ctx.fill();
    }
  }

  drawSafeNode() {
    ctx.beginPath();
    ctx.arc(this.nodes[this.safeNode][0], this.nodes[this.safeNode][1], this.nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.safeColor;
    ctx.fill();
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each time
    this.drawNodes();
    this.drawPlayerAndEnemies();
    this.drawSafeNode();
  }

  isCollision() {
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].position == this.player.position) {
        return true;
      }
    }
    return false;
  }

  isSafeNode() {
    return (this.player.position == this.safeNode);
  }

  checkGameStatus() {
    if (this.isCollision()) {
      alert(`Game Over! They've got you.`);
    } else if (this.isSafeNode()) {
      alert(`You win! You're safe now.`);
    }
  }

  isPositionNode(node, x, y) {
    const dist = calculateDistance(this.nodes[node], [x, y]);
    return (dist <= this.nodeRadius);
  }

  findNodeByPosition(x, y) {
    // simple iterative search - can be made into a binary search
    for (let i = 0; i < this.numNodes; i++) {
      if (this.isPositionNode(i, x, y)) { return i; }
    }
    return null;
  }

  nextTurn() {
    this.turn++;
    this.player.move();
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].move();
      this.enemies[i].decideNextPosition(this.nodes, this.player);
    }
    this.draw();
    this.checkGameStatus();
  }
}

let game = new Game(
  numNodes = 150,
  nodeRadius = 5,
  playerMoveRadius = 80,
  playerInitialPosition = Math.floor(Math.random() * 100),
  enemyMoveRadius = [80, 80],
  enemyInitialPositions = Array.from({ length: 2 }, () => Math.floor(Math.random() * 100))
);

document.getElementById("new-game").addEventListener("click", function () {
  let numEnemies = document.getElementById("num-enemies").value;
  game = new Game(
    numNodes = 150,
    nodeRadius = 5,
    playerMoveRadius = 80,
    playerInitialPosition = Math.floor(Math.random() * 100),
    enemyMoveRadius = Array.from({ length: numEnemies }, () => 80),
    enemyInitialPositions = Array.from({ length: numEnemies }, () => Math.floor(Math.random() * 100))
  );
});

// Listen for click events to move the player
canvas.addEventListener('click', (e) => {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  let positionClicked = game.findNodeByPosition(mouseX, mouseY);
  if (positionClicked != null) {
    game.player.setNextPosition(positionClicked, game.nodes);
    // indicate next position
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw();
    if (game.player.nextPosition != null) {
      ctx.beginPath();
      ctx.moveTo(game.nodes[game.player.position][0], game.nodes[game.player.position][1]);
      ctx.lineTo(game.nodes[game.player.nextPosition][0], game.nodes[game.player.nextPosition][1]);
      ctx.strokeStyle = game.playerColor;
      ctx.stroke();
    }
    }
});

document.getElementById("next-turn").addEventListener("click", function () {
  game.nextTurn();
});
