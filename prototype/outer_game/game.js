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
  messageCtx.font = "14px Arial";
  messageCtx.textAlign = 'left';
  messageCtx.textBaseline = 'bottom';
  const maxHeight = messageCanvas.height * 0.9;
  const maxLines = Math.floor(maxHeight / lineHeight) - 1;
  let lineCount = 3; // leaving room for buttons
  for (let i = messages.length - 1; i >= 0; i--) {
    messageCtx.fillStyle = messages[i][2];
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

function generateButtons(options) {
  const lineHeight = 20;
  const maxHeight = messageCanvas.height * 0.96;
  const buttonHeight = 30;
  const buttonWidth = 120;
  const padding = 5;

  messageCtx.clearRect(0, maxHeight - lineHeight, buttonWidth, buttonHeight);

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
      return i;
    }
  }
  const cloakXLower = messageCanvas.width * 0.03 + 2 * 120 - 10;
  const cloakYLower = messageCanvas.height * 0.05 + 5;
  const cloakWidth = 90;
  const cloakHeight = -25;
  if (mouseX >= cloakXLower && mouseX <= cloakXLower + cloakWidth && mouseY >= cloakYLower + cloakHeight && mouseY <= cloakYLower) {
    return 'useCloak';
  }
}

class Player {
  constructor(initialPosition, moveRadius, initialFuel, initialMissiles, initialCloaks) {
    this.position = initialPosition;
    this.fuel = initialFuel;
    this.missiles = initialMissiles;
    this.cloaks = initialCloaks;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
    this.proposedFuelCost = null;
    this.detectableByEnemies = true;
    this.cloakedDuration = 0;
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

class Node {
  constructor(position, type, visitMessage) {
    this.position = position;
    this.type = type;
    this.visitMessage = visitMessage;
    this.visited = false;
  }
}

class Enemy {
  constructor(initialPosition, moveRadius) {
    this.position = initialPosition;
    this.targetPosition = null;
    this.moveRadius = moveRadius;
    this.stunDuration = 0;
    this.nextPosition = null;
    this.detectableByPlayer = false;
    this.detectionRadius = 2 * this.moveRadius; // can be parametrised
    this.abandonThreshold = 5; // can be parametrised
    this.lastDetectedPlayerTurn = null;
  }

  decideTargetPosition(nodes, player, safeNode, game) {
    if ((player.detectableByEnemies) && (player.position != safeNode) && (calculateDistance(nodes[this.position], nodes[player.position]) <= this.detectionRadius)) {
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
    if (this.stunDuration > 0) {
      this.stunDuration--;
    } else {
      this.position = this.nextPosition;
      this.nextPosition = null;
    }
  }
}

class Game {
  constructor(
    numNodes,
    nodeRadius,
    playerMoveRadius,
    playerInitialFuel,
    playerInitialMissiles,
    playerInitialCloaks,
    playerInitialPosition,
    enemyMoveRadius,
    enemyInitialPositions
  ) {
    this.colorMap = {
      player : 'Lime',
      playerUndetectable : 'LightGreen',
      playerMovementRadius : 'LimeGreen',
      enemyPassive : 'LightCoral',
      enemyActive : 'OrangeRed',
      safe : 'DeepSkyBlue',
      nodeVisited : 'White',
      nodeUnvisited : 'Gray',
      neutralMessage : 'White',
      goodMessage : 'PaleGreen',
      badMessage : 'Salmon'
    }

    this.turn = 0;
    this.state = ['move', null]; // a pair, where the first is state and second is reason
    this.buttonOptions = ['Next turn'];
    this.buttonOptionClicked = null; // tracking the last button clicked
    this.numNodes = numNodes;
    this.nodeRadius = nodeRadius;
    this.nodes = [];
    this.visitedNodes = [playerInitialPosition];
    this.generateNodes();

    this.safeNode = Math.floor(Math.random() * this.numNodes);
    this.safeNodeVisible = true;

    this.messageList = {
      start : [[`You've heard whispers about a sanctuary hidden from the UPA. You have nothing left to lose but your own life now.`], this.colorMap.neutralMessage],
      winSanctuary : [[`You've reached what appears to be the fabled sanctuary. The UPA ships pursuing you gradually disperse as they seem unable to detect you. The dissidents welcome you into their hidden corner of the galaxy. "The hope for a better future is not lost," they say. "A day will come when the UPA ends and a brighter chapter begins."`], this.colorMap.safe],
      loseCollision : [[
        `You tried your best, but the UPA corvette has tethered your ship. Only imprisonment or execution awaits you, and you're not sure which is worse.`,
        `Your ship has been struck. The interstellar engine is malfunctioning. "I tried my best," you say in your last moments. "I tried my—"`,
        `You see the missile from the cockpit of your ship growing larger and larger. Until, nothing.`
      ], this.colorMap.badMessage],
      detectedByEnemy : [[
        `You've been detected by a UPA ship!`,
        `A UPA ship has found you!`,
        `Your position has been discovered by a UPA ship!`,
        `A UPA ship is inbound!`,
        `A UPA ship has set course for your position!`,
        `It looks like a UPA ship has noticed you!`
      ], this.colorMap.neutralMessage],
      detectedByEnemies : [[
        `You've been detected by UPA ships!`,
        `UPA ships have found you!`,
        `Your position has been discovered by UPA ships!`,
        `Multiple UPA ships inbound!`,
        `UPA ships have set course for your position!`,
        `It looks like UPA ships have noticed you!`
      ], this.colorMap.neutralMessage],
      singleShipCollision : [[
        `A UPA ship is about to enter missile range!`,
        `A UPA ship is closing in fast!`,
        `A UPA ship is on your tail!`,
        `A UPA ship has locked onto you!`
      ], this.colorMap.badMessage],
      multipleShipsCollision(n) {
        return [[
          `There are ${n} UPA ships in your vicinity.`,
          `There are ${n} UPA ships surrounding you.`,
          `There are ${n} UPA ships on top of you.`,
          `There are ${n} UPA ships approaching you.`
        ], this.colorMap.badMessage]
      },
      destroyedEnemy : [[
        `The UPA ship explodes into harmless shrapnel.`,
        `The UPA ship splits in half.`,
        `The UPA ship becomes yet another space junk.`,
        `The UPA ship loses all signs of life.`
      ], this.colorMap.goodMessage],
      stunnedEnemy : [[
        `The UPA ship is disabled for now.`,
        `The UPA ship has gone cold for now.`,
        `The UPA ship drifts harmlessly for now.`,
        `The UPA ship is stunned for now.`
      ], this.colorMap.goodMessage],
      missedEnemy : [[
        `Your missile missed!`,
        `The UPA ship evaded your missile!`,
        `Your missile was intercepted!`,
        `Your missile uselessly struck a piece of space junk!`
      ], this.colorMap.badMessage],
      ignoreStunnedEnemy : [[
        `You ignore the helpless UPA ship for now. But they'll be back.`,
        `You turn your attention away from the temporarily disabled UPA ship.`,
        `You move on from the stunned UPA ship.`,
        `You fly passed the knocked out UPA ship.`
      ], this.colorMap.neutralMessage],
      startedCloak : [[
        `You've activated cloak.`,
        `You're temporarily invisible.`
      ], this.colorMap.goodMessage],
      cloakFailed : [[
        `Cloak was ineffective! They saw you just as you activated cloak.`,
        `Cloak was defective!`,
        `Cloak malfunctioned!`,
        `Cloaking device was unresponsive!`
      ], this.colorMap.badMessage]
    };
    this.messages = [];

    this.player = new Player(playerInitialPosition, playerMoveRadius, playerInitialFuel, playerInitialMissiles, playerInitialCloaks);
    this.enemies = [];
    for (let i = 0; i < enemyInitialPositions.length; i++) {
      this.enemies.push(new Enemy(enemyInitialPositions[i], enemyMoveRadius[i]));
      this.enemies[i].decideNextPosition(this.nodes, this.player);
    }

    this.appendMessage(this.messageList.start);
    this.processGameState();
    this.draw();
  }

  appendMessage(messageArray) {
    this.messages.push([this.turn, messageArray[0][Math.floor(Math.random() * messageArray[0].length)], messageArray[1]]);
  }

  drawStatus() {
    messageCtx.clearRect(0, 0, messageCanvas.width, 30);
    messageCtx.font = "bold 14px Arial";
    if ((this.player.proposedFuelCost == null) || (Math.round(this.player.proposedFuelCost / 10 == 0))) {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    } else {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)} - ${Math.round(this.player.proposedFuelCost / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    }
    if (this.player.missiles > 0) {
      messageCtx.fillText(`Missiles: ${Math.round(this.player.missiles)}`, messageCanvas.width * 0.03 + 120, messageCanvas.height * 0.05);
    }
    if (this.player.cloaks > 0) {
      messageCtx.fillStyle = 'white';
      messageCtx.fillRect(messageCanvas.width * 0.03 + 2 * 120 - 10, messageCanvas.height * 0.05 + 3, 90, -23);
      messageCtx.fillStyle = 'black';
      messageCtx.fillText(`Cloaks: ${Math.round(this.player.cloaks)}`, messageCanvas.width * 0.03 + 2 * 120, messageCanvas.height * 0.05);
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
    if (this.player.detectableByEnemies) {
      gameCtx.fillStyle = this.colorMap.player;
    } else {
      gameCtx.fillStyle = this.colorMap.playerUndetectable;
    }
    gameCtx.fill();
    if (this.state[0] == 'move') {
      gameCtx.beginPath();
      gameCtx.arc(this.nodes[this.player.position][0], this.nodes[this.player.position][1], Math.min(this.player.moveRadius, this.player.fuel), 0, Math.PI * 2);
      gameCtx.lineWidth = 1;
      gameCtx.strokeStyle = this.colorMap.playerMovementRadius;
      gameCtx.stroke();
    }
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
    this.drawMessage();
    generateButtons(this.buttonOptions);
  }

  useCloak() {
    if (this.player.cloaks > 0) {
      this.player.detectableByEnemies = false;
      this.player.cloakedDuration++;
      this.player.cloaks--;
      this.draw();
    }
  }

  missileOutcome() {
    let rng = Math.random();
    if (rng < 0.8) {
      rng = Math.random();
      if (rng < 0.5) {
        return "destroyed";
      } else {
        return "stunned";
      }
    } else {
      return "missed";
    }
  }

  findCollidedEnemies() {
    const collidedEnemiesIndices = [];
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].position == this.player.position) {
        collidedEnemiesIndices.push(i)
      }
    }
    return collidedEnemiesIndices;
  }

  collision() {
    if (this.buttonOptionClicked != 'Next turn') { this.turn++; }
    const collidedEnemiesIndices = this.state[1];
    this.buttonOptions = [];
    if ((this.buttonOptionClicked == "Missile") && (this.player.missiles > 0)) {
      this.player.missiles--;
      let outcome = this.missileOutcome();
      if ((outcome == "destroyed") || ((this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration > 0) && (outcome == "stunned"))) {
        this.enemies.splice(collidedEnemiesIndices.pop(), 1);
        this.state[1] = collidedEnemiesIndices;
        this.appendMessage(this.messageList.destroyedEnemy);
      } else if (outcome == "stunned") {
        this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration++;
        this.appendMessage(this.messageList.stunnedEnemy);
      } else if (outcome == "missed") {
        this.appendMessage(this.messageList.missedEnemy);
      }
    } else if ((this.buttonOptionClicked == "Cloak") && (this.player.cloaks > 0)) {
      if (Math.random() > 0.5) {
        this.useCloak();
        this.appendMessage(this.messageList.startedCloak);
        this.state = ["move", "afterCollisionCloaked"];
        this.processGameState();
        this.draw();
        return null;
      }
      else {
        this.player.cloaks--;
        this.appendMessage(this.messageList.cloakFailed);
      }
    } else if (this.buttonOptionClicked == "Move on") {
      collidedEnemiesIndices.pop();
      this.appendMessage(this.messageList.ignoreStunnedEnemy);
    }

    if (this.player.missiles > 0) { this.buttonOptions.push("Missile"); }
    if (this.player.cloaks > 0) { this.buttonOptions.push("Cloak"); }

    if ((collidedEnemiesIndices.length > 0) && (this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration == 0) && (this.player.missiles == 0) && (this.player.cloaks == 0)) {
      this.state = ["lose", "collision"];
      this.processGameState();
      this.draw();
      return null;
    }

    if ((collidedEnemiesIndices.length > 1) && (this.buttonOptionClicked == 'Next turn')) {
      this.appendMessage(this.messageList.multipleShipsCollision(collidedEnemiesIndices.length));
    }
    if ((collidedEnemiesIndices.length > 0) && (this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration == 0)) {
      this.appendMessage(this.messageList.singleShipCollision);
    } else {
      this.buttonOptions.push("Move on")
    }

    if (collidedEnemiesIndices.length == 0) {
      this.state = ['move', 'afterCollision'];
      this.processGameState();
    }

    this.draw();
  }

  isSafeNode() {
    return (this.player.position == this.safeNode);
  }

  // this function should be used immediately after a state change
  processGameState() {
    if (this.state[0] == "lose") {
      this.buttonOptions = [];
      if (this.state[1] == "collision")
        this.appendMessage(this.messageList.loseCollision);
    } else if (this.state[0] == "win") {
      this.player.detectableByEnemies = false;
      this.buttonOptions = [];
      if (this.state[1] == "sanctuary")
        this.appendMessage(this.messageList.winSanctuary);
    } else if (this.state[0] == "move") {
      this.buttonOptions = ['Next turn'];
    } else if (this.state[0] == "collision") {
      this.collision();
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
    if (this.player.cloakedDuration > 0) {
      this.player.cloakedDuration--;
    } else if ((this.player.cloakedDuration == 0) && (!this.player.detectableByEnemies)) {
      this.player.detectableByEnemies = true;
    }
    if (!this.visitedNodes.includes(this.player.position)) { this.visitedNodes.push(this.player.position); }
    if (this.isSafeNode()) { this.state = ["win", "sanctuary"]; }

    // enemy movement
    const numPursuingEnemiesBefore = this.enemies.filter(enemy => enemy.targetPosition != null).length;
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].move();
      this.enemies[i].decideTargetPosition(this.nodes, this.player, this.safeNode, this);
      this.enemies[i].decideNextPosition(this.nodes, this.player, this.safeNode);
    }
    const numPursuingEnemiesAfter = this.enemies.filter(enemy => enemy.targetPosition != null).length;

    if (numPursuingEnemiesAfter > numPursuingEnemiesBefore + 1) {
      this.appendMessage(this.messageList.detectedByEnemies);
    } else if (numPursuingEnemiesAfter == numPursuingEnemiesBefore + 1) {
      this.appendMessage(this.messageList.detectedByEnemy);
    }

    // checking for collision
    const collidedEnemiesIndices = this.findCollidedEnemies();
    if ((collidedEnemiesIndices.length > 0) && (this.player.detectableByEnemies)) { this.state = ['collision', collidedEnemiesIndices]; }

    this.processGameState();
    this.draw();
  }
}

let game = new Game(
  numNodes = 150,
  nodeRadius = 5,
  playerMoveRadius = 80,
  playerInitialFuel = 2000,
  playerInitialMissiles = 2,
  playerInitialCloaks = 1,
  playerInitialPosition = 0,
  enemyMoveRadius = [80, 80],
  enemyInitialPositions = Array.from({ length: 2 }, () => 1 + Math.floor(Math.random() * (150 - 1)))
);

document.getElementById("new-game").addEventListener("click", function () {
  let numEnemies = document.getElementById("num-enemies").value;
  game = new Game(
    numNodes = 150,
    nodeRadius = 5,
    playerMoveRadius = 80,
    playerInitialFuel = 2000,
    playerInitialMissiles = 2,
    playerInitialCloaks = 1,
    playerInitialPosition = 0,
    enemyMoveRadius = Array.from({ length: numEnemies }, () => 80),
    enemyInitialPositions = Array.from({ length: numEnemies }, () => 1 + Math.floor(Math.random() * (150 - 1)))
  );
});

// listen for click events to move the player
gameCanvas.addEventListener('click', (e) => {
  if (game.state[0] != 'move') { return null; }
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

messageCanvas.addEventListener('click', (event) => {
  const result = checkMessageButtonClick(event);
  if (game.state[0] == 'move' && result == 'useCloak') {
    game.buttonOptionClicked = 'useCloak';
    game.appendMessage(game.messageList.startedCloak);
    game.useCloak();
  } else if (result != null) {
    game.buttonOptionClicked = game.buttonOptions[result];
  } else {
    return null;
  }
  if (game.buttonOptionClicked == 'Next turn') {
    game.nextTurn();
  } else if (game.state[0] == 'collision' && result == 'useCloak') {
    game.buttonOptionClicked = 'Cloak';
    game.processGameState();
  }
  else if (['Missile', 'Cloak', 'Move on'].includes(game.buttonOptionClicked)) {
    game.processGameState();
  }
});
