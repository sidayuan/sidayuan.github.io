// Set up the canvas
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');

const messageCanvas = document.getElementById('messageCanvas');
const messageCtx = messageCanvas.getContext('2d');

function calculateDistance(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) }

function findNearbyNodes(nodes, node, radius, exclude) {
  const nearbyNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if ((calculateDistance(nodes[node], nodes[i]) <= radius) && !(exclude.includes(i))) { nearbyNodes.push(i); }
  }
  return nearbyNodes;
}

function generateText(context, messages, turn, x, y, maxWidth, lineHeight) {
  messageCtx.fillStyle = "white";
  messageCtx.font = "14px Arial";
  messageCtx.textAlign = 'left';
  messageCtx.textBaseline = 'bottom';
  const maxHeight = messageCanvas.height * 0.9;
  const maxLines = Math.floor(maxHeight / lineHeight) - 1;
  let lineCount = 3; // leaving room for buttons
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = '> ' + messages[i][1]
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = context.measureText(testLine).width;

      // check if the test line is within the maxWidth
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' '; // start a new line with the current word
      } else {
        line = testLine;
      }
    }

    lines.push(line);

    if (turn == messages[i][0]) {
      messageCtx.font = "bold 14px Arial";
    } else {
      messageCtx.font = "14px Arial";
    }

    // draw each line on the canvas
    for (let j = lines.length - 1; j >= 0; j--) {
      context.fillText(lines[j], x + 13 * Math.min(j, 1), y + (maxLines - lineCount) * lineHeight);
      lineCount++;
    }

    context.fillText('', x + 13 * Math.min(i, 1), y + (maxLines - lineCount) * lineHeight)
    lineCount++;
    if (lineCount > maxLines) { break; }
  }
}

function generateButtons(options, lineHeight) {
  const maxHeight = messageCanvas.height * 0.96;
  const buttonHeight = 30;
  const buttonWidth = 120;
  const padding = 5;

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const x = messageCanvas.width * 0.035 + i * (buttonWidth + padding);
    const y = maxHeight - lineHeight;

    // draw rectangle
    messageCtx.fillStyle = "white";
    messageCtx.fillRect(x, y, buttonWidth, buttonHeight);

    messageCtx.fillStyle = "black";
    messageCtx.font = "bold 14px Arial";
    messageCtx.textAlign = 'center';
    messageCtx.textBaseline = 'middle';
    messageCtx.fillText(option, x + buttonWidth / 2, y + buttonHeight/2);
  }  
}

function checkMessageButtonClick(event) {
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;
  const maxHeight = messageCanvas.height * 0.96;
  const buttonHeight = 30;
  const buttonWidth = 120;
  const padding = 5;
  yLower = maxHeight - 20;
  yUpper = yLower + buttonHeight;
  xLower = Array.from([0, 1, 2], (i) => messageCanvas.width * 0.035 + i * (buttonWidth + padding));
  xUpper = Array.from(xLower, (x) => x + buttonWidth);
  for (let i = 0; i < 3; i++) {
    if (mouseX >= xLower[i] && mouseX <= xUpper[i] && mouseY >= yLower && mouseY <= yUpper) {
      //console.log(`${i} clicked!`);
      return i;
    }
  }
}

class Player {
  constructor(initialPosition, initialFuel, moveRadius) {
    this.position = initialPosition;
    this.fuel = initialFuel;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
    this.proposedFuelCost = null;
    this.detectableByEnemies = true;
    this.radarRadius = 3 * this.moveRadius; // can be parametrised
  }

  setNextPosition(nextPosition, nodes) {
    if (nextPosition == null) {
      this.nextPosition = null;
      return null;
    }
    const proposedDistance = calculateDistance(nodes[this.position], nodes[nextPosition]);
    if ((proposedDistance <= this.moveRadius) && (proposedDistance <= this.fuel)) {
      this.proposedFuelCost = proposedDistance;
      this.nextPosition = nextPosition;
      return nextPosition;
    } else {
      return null;
    }
  }

  move() {
    if ((this.nextPosition != null) && (this.proposedFuelCost != null)) {
      this.position = this.nextPosition;
      this.nextPosition = null;
      this.fuel -= this.proposedFuelCost;
      this.proposedFuelCost = null;
    }
  }
}

class Enemy {
  constructor(initialPosition, moveRadius) {
    this.position = initialPosition;
    this.targetPosition = null;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
    this.detectableByPlayer = false;
    this.detectionRadius = 2 * this.moveRadius; // can be parametrised
    this.abandonThreshold = 5; // can be parametrised
    this.lastDetectedPlayerTurn = null;
  }

  decideTargetPosition(nodes, player, safeNode, game) {
    const targetPositionWasNull = this.targetPosition == null;
    if ((player.detectableByEnemies) && (player.position != safeNode) && (calculateDistance(nodes[this.position], nodes[player.position]) <= this.detectionRadius)) {
      if (targetPositionWasNull) { game.appendMessage(game.messageList.detectedByEnemy); }
      this.targetPosition = nodes[player.position];
      this.lastDetectedPlayerTurn = game.turn;
    }
    if ((this.position == this.targetPosition) || (game.turn - this.lastDetectedPlayerTurn > this.abandonThreshold) || (player.position == safeNode)) { // randomly grazes if it reaches target position
      this.targetPosition = null;
    }
  }

  decideNextPosition(nodes, player, safeNode) {
    const nearbyNodes = findNearbyNodes(nodes, this.position, this.moveRadius, [safeNode]);
    if (this.targetPosition != null) {
      const nearbyNodesPlayer = findNearbyNodes(nodes, player.position, player.moveRadius, [safeNode]);
      const intersectionNodes = nearbyNodes.filter(value => nearbyNodesPlayer.includes(value));
      if ((player.detectableByEnemies) && (intersectionNodes.length > 0)) { // if it can detect player AND reach the player's vicinity, it randomly picks such a node
        this.nextPosition = intersectionNodes[Math.floor(Math.random() * intersectionNodes.length)];
      } else { // if enemy is still far from the player OR it can't detect the player, it chooses the approximate best path towards the target node
        // the following chase logic can be generalised using recursion
        const nearbyNodeSet = {}
        const paths = [];
        for (let i = 0; i < nearbyNodes.length; i++) {
          nearbyNodeSet[[i]] = findNearbyNodes(nodes, nearbyNodes[i], this.moveRadius, [safeNode]);
          for (let j = 0; j < nearbyNodeSet[[i]].length; j++) {
            nearbyNodeSet[[i, j]] = findNearbyNodes(nodes, nearbyNodeSet[[i]][j], this.moveRadius, [safeNode]);
              for (let k = 0; k < nearbyNodeSet[[i, j]].length; k++) {
                if ((nearbyNodeSet[[i, j]][k] != nearbyNodeSet[[i]][j]) && (nearbyNodeSet[[i, j]][k] != nearbyNodes[i]) && (nearbyNodeSet[[i, j]][k] != this.position)) {
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
    playerInitialFuel,
    playerInitialPosition,
    enemyMoveRadius,
    enemyInitialPositions
  ) {
    this.colorMap = {
      player : 'Lime',
      playerMovementRadius : 'LimeGreen',
      enemyPassive : 'LightCoral',
      enemyActive : 'OrangeRed',
      safe : 'DeepSkyBlue',
      nodeVisited : 'White',
      nodeUnvisited : 'Gray'
    }

    this.turn = 0;
    this.numNodes = numNodes;
    this.nodeRadius = nodeRadius;
    this.nodes = [];
    this.visitedNodes = [playerInitialPosition];
    this.generateNodes();

    this.safeNode = Math.floor(Math.random() * this.numNodes);
    this.safeNodeVisible = true;

    this.messageList = {
      start : [`You've heard whispers about a sanctuary hidden from the UPA. You have nothing left to lose but your own life now.`],
      win : [`You've reached what appears to be the fabled sanctuary. The UPA ships pursuing you gradually disperse as they seem unable to detect you. The dissidents welcome you into their hidden corner of the galaxy. "The hope for a better future is not lost," they say. "A day will come when the UPA ends and a brighter chapter begins."`],
      loseCollision : [
        `You tried your best, but the UPA corvette has tethered your ship. Only imprisonment or execution awaits you, and you're not sure which is worse.`,
        `Your ship has been struck. The interstellar engine is malfunctioning. "I tried my best," you say in your last moments. "I tried my—"`,
        `You see the missile from the cockpit of your ship growing larger and larger. Until, nothing.`
      ],
      detectedByEnemy : [
        `You've been detected by a UPA ship!`,
        `A UPA ship has found you!`,
        `Your position has been discovered by a UPA ship!`,
        `A UPA ship is inbound!`,
        `A UPA ship has set course for your position!`,
        `It looks like a UPA ship has noticed you!`
      ]
    };
    this.messages = [];

    this.player = new Player(playerInitialPosition, playerInitialFuel, playerMoveRadius);
    this.enemies = [];
    for (let i = 0; i < enemyInitialPositions.length; i++) {
      this.enemies.push(new Enemy(enemyInitialPositions[i], enemyMoveRadius[i]));
      this.enemies[i].decideNextPosition(this.nodes, this.player);
    }

    this.appendMessage(this.messageList.start);
    this.draw();
    this.drawMessage();
    //generateButtons(['Option 1', 'Option 2', 'Option 3'], 20); // testing
  }

  appendMessage(messageArray) {
    this.messages.push([this.turn, messageArray[Math.floor(Math.random() * messageArray.length)]]);
  }

  drawStatus() {
    messageCtx.clearRect(0, 0, messageCanvas.width, 30);
    messageCtx.font = "bold 14px Arial";
    if ((this.player.proposedFuelCost == null) || (Math.round(this.player.proposedFuelCost / 10 == 0))) {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    } else {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)} - ${Math.round(this.player.proposedFuelCost / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    }
  }

  drawMessage() {
    messageCtx.clearRect(0, 20, messageCanvas.width, messageCanvas.height);
    generateText(messageCtx, this.messages, this.turn, messageCanvas.width * 0.03, messageCanvas.height * 0.05, messageCanvas.width * 0.85, 20);
    this.drawStatus();
  }

  generateNodes() {
    for (let i = 0; i < this.numNodes; i++) {
      const x = Math.random() * gameCanvas.width;
      const y = Math.random() * gameCanvas.height;
      this.nodes.push([x, y]);
    }
  }

  drawNodes() {
    this.nodes.forEach((node, index) => {
      gameCtx.beginPath();
      gameCtx.arc(node[0], node[1], this.nodeRadius, 0, Math.PI * 2);
      if (this.visitedNodes.includes(index)) {
        gameCtx.fillStyle = this.colorMap.nodeVisited;
      } else {
        gameCtx.fillStyle = this.colorMap.nodeUnvisited;
      }
      gameCtx.fill();
    });
  }

  drawPlayerAndEnemies() {
    gameCtx.beginPath();
    gameCtx.arc(this.nodes[this.player.position][0], this.nodes[this.player.position][1], this.nodeRadius, 0, Math.PI * 2);
    gameCtx.fillStyle = this.colorMap.player;
    gameCtx.fill();
    gameCtx.beginPath();
    gameCtx.arc(this.nodes[this.player.position][0], this.nodes[this.player.position][1], Math.min(this.player.moveRadius, this.player.fuel), 0, Math.PI * 2);
    gameCtx.lineWidth = 1;
    gameCtx.strokeStyle = this.colorMap.playerMovementRadius;
    gameCtx.stroke();
    this.drawStatus();
    for (let i = 0; i < this.enemies.length; i++) {
      if (calculateDistance(this.nodes[this.enemies[i].position], this.nodes[this.player.position]) > this.player.radarRadius) { continue; }
      gameCtx.beginPath();
      gameCtx.arc(this.nodes[this.enemies[i].position][0], this.nodes[this.enemies[i].position][1], this.nodeRadius, 0, Math.PI * 2);
      if (this.enemies[i].targetPosition == null) {
        gameCtx.fillStyle = this.colorMap.enemyPassive;
      } else {
        gameCtx.fillStyle = this.colorMap.enemyActive;
      }
      gameCtx.fill();
    }
  }

  drawSafeNode() {
    if (this.safeNodeVisible) {
      gameCtx.beginPath();
      gameCtx.arc(this.nodes[this.safeNode][0], this.nodes[this.safeNode][1], this.nodeRadius, 0, Math.PI * 2);
      gameCtx.fillStyle = this.colorMap.safe;
      gameCtx.fill();
    }
  }

  draw() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // omitting the first line
    this.drawStatus()
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
      this.appendMessage(this.messageList.loseCollision);
      alert(`Game Over! They've got you.`);
    } else if (this.isSafeNode()) {
      this.player.detectableByEnemies = false;
      this.appendMessage(this.messageList.win);
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
    if (!this.visitedNodes.includes(this.player.position)) { this.visitedNodes.push(this.player.position); }
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].move();
      this.enemies[i].decideTargetPosition(this.nodes, this.player, this.safeNode, this);
      this.enemies[i].decideNextPosition(this.nodes, this.player, this.safeNode);
    }
    this.draw();
    this.checkGameStatus();
    this.drawMessage();
  }
}

let game = new Game(
  numNodes = 150,
  nodeRadius = 5,
  playerMoveRadius = 80,
  playerInitialFuel = 2000,
  playerInitialPosition = Math.floor(Math.random() * 150),
  enemyMoveRadius = [80, 80],
  enemyInitialPositions = Array.from({ length: 2 }, () => Math.floor(Math.random() * 150))
);

document.getElementById("new-game").addEventListener("click", function () {
  let numEnemies = document.getElementById("num-enemies").value;
  game = new Game(
    numNodes = 150,
    nodeRadius = 5,
    playerMoveRadius = 80,
    playerInitialFuel = 2000,
    playerInitialPosition = Math.floor(Math.random() * 150),
    enemyMoveRadius = Array.from({ length: numEnemies }, () => 80),
    enemyInitialPositions = Array.from({ length: numEnemies }, () => Math.floor(Math.random() * 150))
  );
});

// listen for click events to move the player
gameCanvas.addEventListener('click', (e) => {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  let positionClicked = game.findNodeByPosition(mouseX, mouseY);
  if (positionClicked != null) {
    game.player.setNextPosition(positionClicked, game.nodes);
    // indicate next position
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    game.draw();
    if (game.player.nextPosition != null) {
      gameCtx.beginPath();
      gameCtx.moveTo(game.nodes[game.player.position][0], game.nodes[game.player.position][1]);
      gameCtx.lineTo(game.nodes[game.player.nextPosition][0], game.nodes[game.player.nextPosition][1]);
      gameCtx.strokeStyle = game.colorMap.player;
      gameCtx.stroke();
    }
    }
});

// listen for click events for message canvas buttons
messageCanvas.addEventListener('click', (event) => {
  checkMessageButtonClick(event);
  // TO-DO: logic for processing button click result
});

document.getElementById("next-turn").addEventListener("click", function () {
  game.nextTurn();
});
