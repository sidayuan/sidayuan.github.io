// Set up the canvas
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');

const messageCanvas = document.getElementById('messageCanvas');
const messageCtx = messageCanvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

function calculateDistance(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) }

function findNearbyNodes(nodes, node, radius, exclude = []) {
  const nearbyNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if ((calculateDistance(nodes[node].position, nodes[i].position) <= radius) && !(exclude.includes(i))) { nearbyNodes.push(i); }
  }
  return nearbyNodes;
}

function findSanctuaryIndex(nodes) {
  let sanctuary = null;
  nodes.forEach((node, index) => {
    if (node.specialty == 'sanctuary') {
      sanctuary = index;
      return;
    }
  });
  return sanctuary;
}

function breadthFirstSearch(nodes, startingNode, radius, maxDepth = Infinity) {
  const queue = [startingNode];
  const discoveredNodes = new Set();
  const sanctuary = findSanctuaryIndex(nodes);
  discoveredNodes.add(startingNode);
  let depth = 1;
  while (queue.length > 0) {
    if (depth > maxDepth) { break; }
    const currentNode = queue.shift();
    const nearbyNodes = findNearbyNodes(nodes, currentNode, radius, Array.from(discoveredNodes).concat([sanctuary]));
    for (const neighbour of nearbyNodes) {
      if (!discoveredNodes.has(neighbour)) {
        discoveredNodes.add(neighbour);
        queue.push(neighbour);
      }
    }
    depth++;
  }
  return Array.from(discoveredNodes);
}

function shortestPath(start, end, radius, nodes, visitedOnly) {
  const nodeIndices = [];
  if (visitedOnly) {
    nodes.forEach((node, index) => { if (node.visited) { nodeIndices.push(index); } });
  } else {
    nodes.forEach((node, index) => { nodeIndices.push(index); });
  }
  const sanctuary = findSanctuaryIndex(nodes);
  const dist = {};
  const prev = {};
  const queue = [];
  for (const i of nodeIndices){
    if (i == sanctuary) { continue; }
    dist[i] = Infinity;
    prev[i] = null;
    queue.push(i);
  }
  dist[start] = 0;
  while (queue.length > 0) {
    let u = nodeIndices.reduce((minNode, node) => dist[node] < dist[minNode] ? node : minNode, nodeIndices[0]); // find node with lowest dist
    nodeIndices.splice(nodeIndices.indexOf(u), 1);
    if (u == end) { break; }
    queue.splice(queue.indexOf(u), 1); // remove from queue
    let neighbours = findNearbyNodes(nodes, u, radius).filter(node => queue.includes(node));
    for (const v of neighbours) {
      let alt = dist[u] + 10 + calculateDistance(game.nodes[u].position, game.nodes[v].position); // penality for turn and fuel costs
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
}
  path = [];
  let u = end;
  if (prev[u] != null || u == start) {
    while (u != null) {
      path.push(u);
      u = prev[u];
    }
  }
  path.pop(); // remove current node
  path.reverse();
  return path;
}

function generateRandomName() {
  // two random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 2 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  // three random digits
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Ensures 3 digits
  return `${randomLetters}-${randomDigits}`;
}

function sleep(seconds) {
  return new Promise(resolve => { setTimeout(resolve, seconds / 1000); });
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

  for (let i = 0; i < Math.min(options.length, 3); i++) {
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
  if (game.enableMissileButton) {
    const missileXLower = messageCanvas.width * 0.03 + 100 - 7;
    const missileYLower = messageCanvas.height * 0.05 + 5;
    const missileWidth = 90;
    const missileHeight = -25;
    if (mouseX >= missileXLower && mouseX <= missileXLower + missileWidth && mouseY >= missileYLower + missileHeight && mouseY <= missileYLower) {
      return 'useMissile';
    }
  }
  if (game.player.cloaks > 0) {
    const cloakXLower = messageCanvas.width * 0.03 + 2 * 100 - 7;
    const cloakYLower = messageCanvas.height * 0.05 + 5;
    const cloakWidth = 90;
    const cloakHeight = -25;
    if (mouseX >= cloakXLower && mouseX <= cloakXLower + cloakWidth && mouseY >= cloakYLower + cloakHeight && mouseY <= cloakYLower) {
      return 'useCloak';
    }
  }
}

class Player {
  constructor(moveRadius, initialFuel, initialMissiles, initialCloaks, initialMoney) {
    this.position = 0;
    this.fuel = initialFuel;
    this.missiles = initialMissiles;
    this.cloaks = initialCloaks;
    this.money = initialMoney;
    this.moveRadius = moveRadius;
    this.nextPosition = null;
    this.pathPlan = [];
    this.proposedFuelCost = null;
    this.detectableByEnemies = true;
    this.cloakedDuration = 0;
    this.sensorRadius = 3 * this.moveRadius; // can be parametrised
    this.engineLevel = 1;
    this.sensorLevel = 1;
    this.targetingLevel = 1; // influences effectiveness of missiles
    this.stealthLevel = 1;
  }

  setNextPosition(nextPosition, nodes) {
    if (nextPosition == null) {
      this.nextPosition = null;
      return null;
    }
    const proposedDistance = calculateDistance(nodes[this.position].position, nodes[nextPosition].position);
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
  constructor(position, type, specialty, effect, nodeName, visitMessage, visible) {
    this.position = position;
    this.type = type;
    this.specialty = specialty;
    this.effect = effect;
    this.name = nodeName;
    this.visitMessage = visitMessage;
    this.visible = visible;
    this.visited = false;
    this.firstVisited = null;
    this.lastVisited = null;
  }
}

class quest {
  constructor(fixer, questType, destination, reward) {
    this.fixer = fixer;
    this.questType = questType;
    this.destination = destination;
    this.reward = reward;
    this.completed = false;
  }
}

class Enemy {
  constructor(initialPosition, moveRadius) {
    this.position = initialPosition;
    this.targetPosition = null;
    this.moveRadius = moveRadius;
    this.stunDuration = 0;
    this.nextPosition = null;
    this.detectableByPlayer = true;
    this.ambushDuration = 0;
    this.detectionRadius = 2 * this.moveRadius; // can be parametrised
    this.abandonThreshold = 5; // can be parametrised
    this.lastDetectedPlayerTurn = null;
  }

  decideTargetPosition(nodes, player, sanctuary, game) {
    if (this.ambushDuration > 0) { return null; }
    if (
        (player.detectableByEnemies) &&
        (player.position != sanctuary) &&
        (nodes[player.position].effect != 'interference') &&
        (nodes[this.position].effect != 'interference') &&
        (calculateDistance(nodes[this.position].position, nodes[player.position].position) <= this.detectionRadius)
      ) {
      this.targetPosition = player.position;
      this.lastDetectedPlayerTurn = game.turn;
    }
    if ((this.position == this.targetPosition) || (game.turn - this.lastDetectedPlayerTurn > this.abandonThreshold) || (player.position == sanctuary)) { // randomly grazes if it reaches target position
      this.targetPosition = null;
    }
  }

  decideNextPosition(nodes, player, sanctuary) {
    if (this.ambushDuration > 0) { return null; }
    const nearbyNodes = findNearbyNodes(nodes, this.position, this.moveRadius, [sanctuary]);
    if (this.targetPosition != null) {
      const nearbyNodesPlayer = findNearbyNodes(nodes, player.position, player.moveRadius, [sanctuary]);
      const intersectionNodes = nearbyNodes.filter(value => nearbyNodesPlayer.includes(value));
      if ((player.detectableByEnemies) && (intersectionNodes.length > 0)) { // if it can detect player AND reach the player's vicinity, it randomly picks such a node
        this.nextPosition = intersectionNodes[Math.floor(Math.random() * intersectionNodes.length)];
      } else { // if enemy is still far from the player OR it can't detect the player, it chooses the best path towards the target node
        const path = shortestPath(this.position, this.targetPosition, this.moveRadius, nodes, false);
        this.nextPosition = path[0];
      }
    } else {
      this.nextPosition = nearbyNodes[Math.floor(Math.random() * nearbyNodes.length)];
    }
  }

  move() {
    if (this.ambushDuration > 0) {
      this.ambushDuration--;
      if (this.ambushDuration > 0) {
        return null;
      } else {
        this.detectableByPlayer = true;
      }
    } else {
      if (Math.random() < 0.005) {
        this.ambushDuration = 10 + Math.floor(Math.random() * 11); // 10 to 20
        this.targetPosition = null;
        this.nextPosition = null;
        this.detectableByPlayer = false;
        return null;
      }
    }
    if (this.stunDuration > 0) {
      this.stunDuration--;
    } else {
      if (this.nextPosition == null) { return null; }
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
    playerInitialMoney,
    enemyMoveRadius,
    numInitialEnemies
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
      specialtyNodeVisited : 'Yellow',
      specialtyNodeUnvisited : 'Gold',
      capitalVisited : 'Fuchsia',
      capitalUnvisited : 'Orchid',
      neutralMessage : 'White',
      goodMessage : 'PaleGreen',
      badMessage : 'Salmon',
      questMarker : 'Cyan',
      nodeEffect : 'MediumAquamarine',
      autopilot : 'LightSkyBlue',
      event : 'Violet'
    }

    this.turn = 0;
    this.state = ['move', null]; // a pair, where the first is state and second is reason
    this.buttonOptions = ['Next turn'];
    this.buttonOptionClicked = null; // tracking the last button clicked
    this.enableMissileButton = false;
    this.numNodes = numNodes;
    this.nodeRadius = nodeRadius;
    this.nodes = [];
    this.sanctuary = null;
    this.capital = null;
    this.quests = [];
    this.messages = [];
    this.questsCompleted = 0;
    this.notoriety = 4; // +1 max enemy ship for every +2 notoriety

    this.initialTraderParameters = {
      buySanctuaryInfoPrice : 10000,
      initialBuyFuelPriceRefinery : 100,
      initialSellMissilePriceRefinery : 250,
      initialSellCloakPriceRefinery : 500,
      maxStockRefinery : 20000,
      addStockProbabilityRefinery : 0.5,
      initialBuyMissilePriceArmsDealer : 200,
      initialSellCloakPriceArmsDealer : 600,
      initialSellFuelPriceArmsDealer : 150,
      maxStockArmsDealer : 10,
      addStockProbabilityArmsDealer : 0.5,
      initialBuyCloakPriceTechDealer : 400,
      initialSellMissilePriceTechDealer : 300,
      initialSellFuelPriceTechDealer : 150,
      maxStockTechDealer : 5,
      addStockProbabilityTechDealer : 0.25,
      initialUpgradeCost : 800,
    }

    this.randomEventParameters = {
      unvisitedNodeProbability : 0.05,
      visitedNodeProbability : 0.02,
      randomEvents : ['cartographer', 'gift', 'reported', 'framed'],
    }

    this.messageList = {
      start : [`You've heard whispers about a sanctuary hidden from the UPA. You have nothing left to lose but your own life now.`],
      winSanctuary : [`You've reached what appears to be the fabled sanctuary. The UPA ships pursuing you gradually disperse as they seem unable to detect you. The dissidents welcome you into their hidden corner of the galaxy. "The hope for a better future is not lost," they say. "A day will come when the UPA ends and a brighter chapter begins."`],
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
      ],
      detectedByEnemies : [
        `You've been detected by UPA ships!`,
        `UPA ships have found you!`,
        `Your position has been discovered by UPA ships!`,
        `Multiple UPA ships inbound!`,
        `UPA ships have set course for your position!`,
        `It looks like UPA ships have noticed you!`
      ],
      ambushed : [
        `It's an ambush!`,
        `They were waiting for you this whole time!`,
        `They were expecting you!`,
        `It's a set up!`,
        `They knew you were going to be here!`
      ],
      singleShipCollision : [
        `A UPA ship is about to enter missile range!`,
        `A UPA ship is closing in fast!`,
        `A UPA ship is on your tail!`,
        `A UPA ship has locked onto you!`
      ],
      multipleShipsCollision(n) {
        return [
          `There are ${n} UPA ships in your vicinity.`,
          `There are ${n} UPA ships surrounding you.`,
          `There are ${n} UPA ships on top of you.`,
          `There are ${n} UPA ships approaching you.`
        ]
      },
      destroyedEnemy : [
        `The UPA ship explodes into harmless shrapnel.`,
        `The UPA ship splits in half.`,
        `The UPA ship becomes yet another space junk.`,
        `The UPA ship loses all signs of life.`
      ],
      stunnedEnemy : [
        `The UPA ship is disabled for now.`,
        `The UPA ship has gone cold for now.`,
        `The UPA ship drifts harmlessly for now.`,
        `The UPA ship is stunned for now.`
      ],
      missedEnemy : [
        `Your missile missed!`,
        `The UPA ship evaded your missile!`,
        `Your missile was intercepted!`,
        `Your missile uselessly struck a piece of space junk!`
      ],
      ignoreStunnedEnemy : [
        `You ignore the helpless UPA ship for now. But they'll be back.`,
        `You turn your attention away from the temporarily disabled UPA ship.`,
        `You move on from the stunned UPA ship.`,
        `You fly passed the knocked out UPA ship.`
      ],
      startedCloak : [
        `You've activated cloak.`,
        `You're temporarily invisible.`
      ],
      cloakFailed : [
        `Cloak was ineffective! They saw you just as you activated cloak.`,
        `Cloak was defective!`,
        `Cloak malfunctioned!`,
        `Cloaking device was unresponsive!`
      ],
      fleeSuccessful : [
        `You just managed to get away from them.`,
        `You can't believe that trick worked.`,
        `You got very lucky.`,
        `That was too close for comfort.`
      ],
      enterDataBank : [
        `You approach a UPA data bank. It processes every line of communication from every day over and over. Surely it's heard something useful?`,
        `You come across a UPA data bank. It processes every byte of data from every second at the power consumption that a single star couldn't provide. Surely it's useful for something?`
      ],
      enterFixer : [
        `You arrive at a space station that seems to be merely the extension of the dingy bar that's inside it. Inside the bar, the tables are sticky, the air is thick with poison, and someone is passed out—or dead—on the floor.`,
        `You arrive at a bar that seems to be the only thing this space station houses. Eyes follow you dispassionately as you walk, but that's not why you feel watched. This isn't a place you want to stay long in.`,
        `You enter the heart of the space station—a shitty bar with shittier drinks, none of which are served from branded bottles. You're not here for sordid pleasure, and the sooner you leave the better.`,
        `You're greeted by the pungent smell of bootleg methanol as you enter the abysmal excuse of a bar. It's loud with conversation, comprised of a hundred whispered exchanges that you can't make out. A hundred ways things can go wrong.`
      ],
      enterArsenal : [
        `You approach an arsenal world owned by some UPA defense company.`,
        `You come across an arsenal world run by one of the big UPA defense companies.`
      ],
      enterHyperconductorFactory : [
        `You approach a company world owned by some UPA defense company set up as a hyperconductor factory.`,
        `You come across a production world run by some UPA defense company to produce hyperconductors.`
      ],
      enterRefinery : [
        `You approach a refinery world owned by a large UPA energy conglomerate.`,
        `You come across a company world owned by run by some UPA energy company to produce interstellar fuel.`
      ],
      enterShipyard : [
        `You approach a shipyard owned by the largest UPA shipbuilding company.`,
        `You come across a shipyard run by one of the big UPA shipbuilding companies.`
      ],
      enterCapital : [
        `You enter the Capital world of the UPA. You think you've made a mistake.`,
        `You approach the capital world of the UPA. Every fibre in your body is telling you to run.`
      ],
      enterJunction : [
        `You approach the junction node. Nothing here but fellow travellers.`,
        `You approach the junction node. This one's particularly run down.`,
        `You reach the junction node. A lot of homeless people—probably dumped here by debt sharks.`,
        `You reach the junction node. There's a dead body that everybody else is also ignoring.`,
        `You reach the junction node. Near it is a graveyard of one of the larger battles.`
      ],
      enterCommonSystem : [
        `You approach a quiet planetary system. There used to be people living here, but that was before the war.`,
        `You approach a cold planetary system. You've seen junction nodes more liveable than this.`,
        `You reach a small planetary system. The only thing that greets you is a transmission telling you to stay away on repeat.`,
        `You reach a system with only gas giants. You'd rather be in the mines than here.`,
        `You reach a planetary system with some traffic. You don't understand the language of the locals.`,
        `You approach a planetary system that has decent traffic. It's a peaceful world—only because it bends over for the UPA.`,
        `You approach a system that appears to have large craters on almost every planet. Footprints of the UPA.`,
        `You reach a system colonised by the UPA.`,
        `You reach a planetary system that orbits a black hole.`,
        `You reach a system of a few rogue planets orbiting each other.`,
        `You reach a system orbiting a neutron star`,
        `You reach a small planetary system. You hear an unfamiliar religious prayer over the broadcast.`
      ],
      enterCommonStation : [
        `You approach a small space station. It appears to be a mining operation.`,
        `You approach an old space station. It looks like it's held together by tape and prayers.`,
        `You reach a city-sized station. You see UPA military personnel, so you keep to yourself.`,
        `You reach an oddly-shaped space station.`,
        `You approach the station. It seems to harbour a lot of refugees and not a lot of sympathy.`,
        `You approach a large station. A rebel was captured here not long ago.`,
        `You reach a tiny station. You've seen junction nodes larger than this.`,
        `You reach an abandoned space station. Only a couple ships aside from you are passing by.`,
        `You approach a large space station. Half of the station is pristine while the other half looks barely liveable. Guess which one you can't afford.`,
        `You approach a familiar space station. You remember reading about its capture a long time ago.`
      ],
      infoBrokerOffer : [
        `You hear a digitised voice coming from your interface. "I know who you are, and I know what you want," it says. "I'll tell you where it is for $${this.initialTraderParameters.buySanctuaryInfoPrice}."`,
        `I KNOW WHERE YOU WANT TO GO. $${this.initialTraderParameters.buySanctuaryInfoPrice}.`
      ],
      infoBrokerAfterOffer : [
        `All you hear is static. The information broker has nothing more to say.`,
        `...`
      ],
      rewardFixer(money) {
        return [
          `"Good job kid," the fixer says. "Here's the $${money} I promised."`,
          `"Clean and simple," the fixer remarks with a grin. "I like that. Here's the $${money}."`,
          `"Back already?" The fixer looks genuinely surprised. "Well done mate. Here's $${money}."`,
          `"I guess a deal's a deal," the fixer nods. "Here's $${money}."`
        ]
      },
      fixerAlreadyHasQuest : [
        `The fixer looks annoyed. "Didn't I give you a job already? Get out of here."`,
        `"It's a bad idea to come back empty-handed," the fixer says menacingly.`,
        `The fixer looks disappointed. "Damn, you got me excited for nothing. Go do your job."`,
        `"Are you slow?" the fixer asks impatiently. "'Cause I don't like to repeat myself."`
      ],
      smuggleQuest : [
        `"I have a job for ya," the fixer says as he nods to a person sitting alone at the bar. "I need you to take them somewhere. No questions asked."`,
        `"Mate, you're just the person I needed," the fixer says enthusiastically. "I need you to pick up some goods for me. And before you ask, yes. They're extremely illegal."`,
        `"You need some cash?" the fixer asks rhetorically. "I need you to deliver something for me. And no peeking. Trust me kid, you're better off not knowing."`,
        `"You look like someone who needs to be put to work," the fixer grinned. "I need you to pick someone up and bring them back here. They'll be expecting you, but don't talk to them. Understand?."`
      ],
      seekQuest : [
        `"I have a job for you," the fixer says. "There's a bastard who owes me money. You need to hunt him down for me. Go get 'em tiger."`,
        `"You're just the person I needed," the fixer says. "There's a missing cargo that should've arrived a month ago. Find it for me."`
      ],
      huntQuest(numTargets) {
        return [
          `"Hey kid, you don't like the UPA right?" the fixer asks. "I have a client who wants less UPA ships in the sky and is willing to pay to make it happen. Go shoot down ${numTargets} UPA ships."`
        ]
      },
      newQuestMarkerAdded : ['New destination marked.'],
      questCompleted : [
        `You've done your job. It's time to collect your reward.`,
        `Job completed. You hope the fixer lives up to their word.`
      ],
      refineryOffer(buyFuelprice, sellMissilePrice, sellCloakPrice, stock) {
        return [
          `The anaemic fuel trader taps the sign. SELLING: 100 Fuel $${buyFuelprice}, ${stock} left. BUYING: Missile $${sellMissilePrice}, Cloak $${sellCloakPrice}.`,
          `The mute child points to the cracked screen. SELLING: 100 Fuel $${buyFuelprice}, ${stock} left. BUYING: Missile $${sellMissilePrice}, Cloak $${sellCloakPrice}.`
        ]
      },
      armsDealerOffer(buyMissilePrice, sellFuelPrice, sellCloakPrice, stock) {
        return [
          `The arms dealer points to the writing on the wall with the only arm he has left. SELLING: Missile $${buyMissilePrice}, ${stock} left. BUYING: 100 fuel $${sellFuelPrice}, Cloak $${sellCloakPrice}.`,
          `The slender arms dealer coughs into a dirty cloth as he passes you a note. SELLING: Missile $${buyMissilePrice}, ${stock} left. BUYING: 100 fuel $${sellFuelPrice}, Cloak $${sellCloakPrice}.`
        ]
      },
      techDealerOffer(buyCloakPrice, sellFuelPrice, sellMissilePrice, stock) {
        return [
          `The tech dealer's rusty mechanical arm projects a hologram in front of you. SELLING: Cloak $${buyCloakPrice}, ${stock} left. BUYING: 100 fuel $${sellFuelPrice}, Missile $${sellMissilePrice}.`,
          `The feeble child shows you the interface in their forearm. SELLING: Cloak $${buyCloakPrice}, ${stock} left. BUYING: 100 fuel $${sellFuelPrice}, Missile $${sellMissilePrice}.`
        ]
      },
      mechanicOffer(upgradePrice) {
        return [
          `The sickly mechanic glances at your ship. She thinks for what seems too long, until, "I can customise your ship for $${upgradePrice}."`,
          `The elderly mechanic scratches at the blister on her arm. "I can help you," she says, "if you'll help me. $${upgradePrice} and I'll improve your ship."`
        ]
      },
      noStockLeft : [`No more stock left. Come back later.`],
      upgradedEngine : [
        `Your engine is upgraded. It will take you further.`,
        `Your engine is upgraded. It's faster now.`
      ],
      upgradedSensor : [
        `Your sensor is upgraded. It's harder to surprise you now.`,
        `Your sensor is upgraded. You can now see them from another lightyear away.`
      ],
      upgradedTargeting : [
        `Your missile targeting system is upgraded. Hopefully this means you won't miss from now on.`,
        `Your missile targeting system is upgraded. The problem definitely wasn't you.`
      ],
      upgradedStealth : [
        `Your stealth generator is upgraded. They won't know you were ever there.`,
        `Your stealth generator is upgraded. Hopefully it extends your life by another cycle or two.`
      ],
      enterWormhole : [
        `You stumble upon a wormhole that appears to stretch on infinitely. You recall hearing that a ship with a powerful enough engine may be able to enter it unscathed.`,
        `You feel your sanity slipping as you gaze into the abyss of the wormhole. You've heard that a powerful enough engine may be able to take a ship through it.`
      ],
      traverseWormhole : [
        `You enter the wormhole. You can't tell whether the lights you saw were real or just your eyes playing tricks.`,
        `You enter the wormhole. Like a bad night's sleep, you dip in and out of consciousness over what feels like a cycle.`,
        `You enter the wormhole. You try to close your eyes to preserve your sanity.`,
        `You enter the wormhole. It feels like your mind stuttered forwards—or backwards?—in time.`
      ],
      enterInterference : [
        `You enter a region of cosmic interference. Ships outside of this node can't detect you.`,
        `There is mild cosmic interference here. You can't be detected from the outside.`
      ],
      autopilotEngaged : [`Autopilot engaged.`],
      autopilotCompleted : [`Your destination has arrived. Autopilot disengaged.`],
      autopilotEndedLowFuel : [`Low fuel. Autopilot disengaged.`],
      autopilotEndedEnemy : [`Enemy sensor ping detected. Autopilot disengaged.`],
      autopilotEndedEvent : [`Autopilot prematurely disengaged.`],
      cartographerOffer(price) {
        if (price == 0) {
          return [
            `A nomad notices you in the corner of the eatery. "Hey buddy, you look a little lost," he says. "I don't know where you're headed, but maybe this will help you."`,
            `At a noodle shop, you overhear a group of malnourished workers talking about a location that sounds potentially useful.`,
            `You sit beside a friendly looking old nomad labourer. You ask them if there's anywhere worth visiting.`,
            `At you exit your ship, you see a large feed in the hangar bay promoting relocation to a particular node.`
          ]
        } else {
          return [
            `As you line up for food, the guy in front of you turns around. "I, uh, need some cash," he says. "I'll tell you somewhere worth visiting in exchange for $${price}."`,
            `At the bar, a stranger with a funny hat sits next to you unprompted. "Hey mate," he says. "I can tell a fellow traveller when I see one. I know a place worth your time. $${price} and I'll yell ya."`,
            `"I'm a famous cartographer." The shady man must have waited outside your ship since you landed. "I can give you a valuable location for a low low price of $${price}."`,
            `"I've been seeing ships come and go for 30 years," the old cleaner says in a gruffy voice. "And most of them are all going to one place. I can tell you where for $${price}."`
          ]
        }
      },
      giftMoney(amount) {
        return [
          `While walking through the hangar bay facility, you notice a loose vent cover. Curiosity gets the better of you and you open it. +$${amount}.`,
          `While using the bathroom at a bar, you notice a poorly hidden briefcase at the very end of the stalls. +$${amount}.`,
          `While walking down one of the lesser used corridors, you witness a couple of youths hacking a banking terminal. One of them notices you and reaches for something in his jacket. The older one halts him. "Here's some cash," she said. "Now kindly fuck off." +$${amount}.`,
          `You stumble upon a dead body. He has money in his pocket. Unlike the previous crime, the one you're committing is victimless. +$${amount}.`
        ]
      },
      giftFuel(amount) {
        return [
          `"Hey sir," a young hangar bay worker approaches you. "You're the UPA delivery contractor, right?" "Uh—" "You're a bit early," the worker gestures to the fuel containers behind him. "Sure," you say. +${amount} Fuel.`,
          `You've been eyeing that fuel container for hours. No one has come to collect it. It's guaranteed to be stolen at this point. Practically victimless. +${amount} Fuel.`,
          `"Hey!" You turnaround, adrenaline filling your veins. "You're the one that's been giving UPA trouble, right?" Your silence is answer enough. "I'm glad someone's sticking it up to them," he says. "Here, I think this will do you more good than me." +${amount} Fuel.`,
          `You watch as a gang of children run away with containers of fuel. The security struggles to keep up as they all disappear around a corner. You notice one of the stolen containers left behind. +${amount} Fuel.`
        ]
      },
      giftMissiles(amount) {
        return [
          `You tried your luck scavenging the site of a space battle that happened a while back. +${amount} Missiles.`,
          `The owner of the hangar bay sents you a priority message. "Look, I don't know who you are but I need you to take these munitions off my hands", he says in a desperate voice. "I'll be in deep shit if the UPA finds these here. And you seem like someone who wouldn't mind having these." +${amount} Missiles.`,
          `You notice a container floating in space. It appears to have fallen from a munitions transport ship. +${amount} Missiles.`,
          `You stumble upon an unmistakably unfolding crime scene in an alleyway. "This one deserved it," the one left standing tells you. "You can help yourself to his storage if you forget about what you see here." +${amount} Missiles.`
        ]
      },
      giftCloaks(amount) {
        return [
          `You find a little child outside your ship looking for food. You spare him a cycle's worth of food. He smiles and gives you something that he doesn't understand. +${amount} Cloaks.`,
          `You almost missed it, but you notice an abandoned stealth ship behind a rock. You scavenge what you can from it. +${amount} Cloaks.`,
          `You notice someone staring at you from across the bar. "I know who you are," she says. You notice a rebel faction tattoo barely hidden behind the collar of her shirt. A remnant of the past. "I want you to make good use of this." +${amount} Cloaks.`,
          `You caught a thief trying to siphon your fuel. "Don't do anything rash," he says. "Why not?" you ask. The thief hands you a container and leaves before you can say anything else. +${amount} Cloaks.`
        ]
      },
      reported : [
        `You've noticed someone following you for a while now. When you turn around, you see them speaking through their comms device. UPA ships are probably already closing in on your location.`,
        `As you walk approach the hangar bay exit, you notice the guard frowning at you. When the recognition hits her like a freight, you dash towards your ship. They know where you are now.`,
        `You were enjoying your cheap slop at the eatery when your face appears on the news feed. You immediately get up to leave. Your location has definitely been alerted to the UPA authorities.`,
        `You see the bartender getting harassed by a drunk. You intervene. That was your mistake. "Oi, I know you," the drunk smirked. "Oh you're in—" You clocked him in the nose before leaving a tip for the bartender. UPA ships will be closing in on you soon.`
      ],
      framed : [
        `You see your name appear on the news feed. Something about committing wire fraud. "The fuck?" you exclaim. "That wasn't even me!" It doesn't matter. The UPA will be sending another ship after you.`,
        `It's not often you check the most wanted list. Your name went up in the rankings, but to your surprise, it was for a crime in a planet that you've never even heard of. You've been framed, and they'll be sending yet another ship after you.`,
        `You hear a lot of chatter in the waves. Your name came up, but for human trafficking? You're someone's scapegoat. And you're now the target for yet another UPA ship.`,
        `You stumble across a dead body. And somebody else stumbles across you stumbling across the dead body. Wrong place at the wrong time. The crime now has your face on it, and so does yet another UPA ship.`
      ]
    };

    this.player = new Player(playerMoveRadius, playerInitialFuel, playerInitialMissiles, playerInitialCloaks, playerInitialMoney);

    // the following code guarantees that necessary nodes are initially reachable
    let mechanicReachable = false;
    let refineryReachable = false;
    let dealerReachable = false;
    let capitalReachable = false;
    let reachableNodes = null;
    while (!(mechanicReachable && refineryReachable && dealerReachable && capitalReachable)) {
      mechanicReachable = false;
      refineryReachable = false;
      dealerReachable = false;
      capitalReachable = false;
      this.generateNodes();
      reachableNodes = breadthFirstSearch(this.nodes, 0, this.player.moveRadius);
      for (const node of reachableNodes) {
        if (this.nodes[node].specialty == 'mechanic') { mechanicReachable = true; }
        if (this.nodes[node].specialty == 'refinery') { refineryReachable = true; }
        if (['armsDealer', 'techDealer'].includes(this.nodes[node].specialty)) { dealerReachable = true; }
        if (this.nodes[node].specialty == 'capital') { capitalReachable = true; }
      }
    }
    this.nodes[this.player.position].visited = true;
    this.nodes[this.player.position].firstVisited = this.turn;
    this.nodes[this.player.position].lastVisited = this.turn;
    this.enemies = [];
    for (let i = 0; i < numInitialEnemies; i++) {
      this.enemies.push(new Enemy(2 + Math.floor(Math.random() * (this.numNodes - 2)), enemyMoveRadius)); // subtracting player and sanctuary positions
      this.enemies[i].decideNextPosition(this.nodes, this.player, this.sanctuary);
    }

    this.appendMessage(this.messageList.start);
    this.appendMessage([this.nodes[this.player.position].visitMessage]);
    this.processGameState();
    this.draw();
  }

  appendMessage(messageArray, colour = this.colorMap.neutralMessage) {
    this.messages.push([this.turn, messageArray[Math.floor(Math.random() * messageArray.length)], colour]);
  }

  drawStatus() {
    messageCtx.clearRect(0, 0, messageCanvas.width, 30);
    messageCtx.fillStyle = 'white';
    messageCtx.font = "bold 14px Arial";
    messageCtx.fillText(`$${this.player.money}`, messageCanvas.width * 0.03 + 3 * 100, messageCanvas.height * 0.05);
    if ((this.player.proposedFuelCost == null) || (Math.round(this.player.proposedFuelCost / 10 == 0))) {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    } else {
      messageCtx.fillText(`Fuel: ${Math.round(this.player.fuel / 10)} - ${Math.round(this.player.proposedFuelCost / 10)}`, messageCanvas.width * 0.03, messageCanvas.height * 0.05);
    }
    if (this.player.missiles > 0) {
      if (this.enableMissileButton) {
        messageCtx.fillStyle = 'white';
        messageCtx.fillRect(messageCanvas.width * 0.03 + 100 - 7, messageCanvas.height * 0.05 + 3, 90, -23);
        messageCtx.fillStyle = 'black';
        messageCtx.fillText(`Missiles: ${Math.round(this.player.missiles)}`, messageCanvas.width * 0.03 + 100, messageCanvas.height * 0.05);
      } else {
        messageCtx.fillStyle = 'white';
        messageCtx.fillText(`Missiles: ${Math.round(this.player.missiles)}`, messageCanvas.width * 0.03 + 100, messageCanvas.height * 0.05);
      }
    }
    if (this.player.cloaks > 0) {
      messageCtx.fillStyle = 'white';
      messageCtx.fillRect(messageCanvas.width * 0.03 + 2 * 100 - 7, messageCanvas.height * 0.05 + 3, 90, -23);
      messageCtx.fillStyle = 'black';
      messageCtx.fillText(`Cloaks: ${Math.round(this.player.cloaks)}`, messageCanvas.width * 0.03 + 2 * 100, messageCanvas.height * 0.05);
    }
  }

  drawMessage() {
    messageCtx.clearRect(0, 20, messageCanvas.width, messageCanvas.height);
    generateText(messageCtx, this.messages, this.turn, messageCanvas.width * 0.03, messageCanvas.height * 0.05, messageCanvas.width * 0.85, 20);
    this.drawStatus();
  }

  generateNodes() {
    this.nodes = [];
    this.nodes.push(new Node( // starting node
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'junction',
      null,
      null,
      `Junction Node ${generateRandomName()}`,
      this.messageList.enterJunction[Math.floor(Math.random() * this.messageList.enterJunction.length)],
      true
    ));
    this.nodes.push(new Node( // sanctuary
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'station',
      'sanctuary',
      null,
      `Sanctuary`,
      null,
      false
    ));
    this.sanctuary = this.nodes.length - 1;
    this.nodes.push(new Node( // fixer
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'station',
      'fixer',
      null,
      `The ${['Den', 'Lounge', 'Tavern', 'Alley', 'Saloon', 'Hotel', 'Club', 'Parlour', 'House', 'Fix'][Math.floor(Math.random() * 10)]} ${generateRandomName()}`,
      this.messageList.enterFixer[Math.floor(Math.random() * this.messageList.enterFixer.length)],
      true
    ));
    this.nodes.push(new Node( // information broker
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      ['system', 'station'][Math.floor(Math.random() * 2)],
      'infoBroker',
      null,
      `Data Bank ${generateRandomName()}`,
      this.messageList.enterDataBank[Math.floor(Math.random() * this.messageList.enterDataBank.length)],
      true
    ));
    this.nodes.push(new Node( // arms dealer
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      'armsDealer',
      null,
      `Arsenal World ${generateRandomName()}`,
      this.messageList.enterArsenal[Math.floor(Math.random() * this.messageList.enterArsenal.length)],
      true
    ));
    this.nodes.push(new Node( // tech dealer
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      'techDealer',
      null,
      `Hyperconductor Production World ${generateRandomName()}`,
      this.messageList.enterHyperconductorFactory[Math.floor(Math.random() * this.messageList.enterHyperconductorFactory.length)],
      true
    ));
    this.nodes.push(new Node( // refinery
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      'refinery',
      null,
      `Refinery World ${generateRandomName()}`,
      this.messageList.enterRefinery[Math.floor(Math.random() * this.messageList.enterRefinery.length)],
      true
    ));
    this.nodes.push(new Node( // mechanic
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'station',
      'mechanic',
      null,
      `Shipyard Station ${generateRandomName()}`,
      this.messageList.enterShipyard[Math.floor(Math.random() * this.messageList.enterShipyard.length)],
      true
    ));
    this.nodes.push(new Node( // capital
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      'capital',
      null,
      `Centralis`,
      this.messageList.enterCapital[Math.floor(Math.random() * this.messageList.enterCapital.length)],
      true
    ));
    this.capital = this.nodes.length - 1;
    this.nodes.push(new Node( // wormhole A
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      null,
      'wormhole',
      `Wormhole System ${generateRandomName()}`,
      this.messageList.enterWormhole[Math.floor(Math.random() * this.messageList.enterWormhole.length)],
      true
    ));
    this.nodes.push(new Node( // wormhole B
      [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
      'system',
      null,
      'wormhole',
      `Wormhole System ${generateRandomName()}`,
      this.messageList.enterWormhole[Math.floor(Math.random() * this.messageList.enterWormhole.length)],
      true
    ));
    this.nodes[this.nodes.length - 2].wormholeEndPosition = this.nodes.length - 1;
    this.nodes[this.nodes.length - 1].wormholeEndPosition = this.nodes.length - 2;

    const nodesSet = this.nodes.length;
    for (let i = nodesSet; i < this.numNodes; i++) {
      let nodeType = ['system', 'station', 'junction'][Math.floor(Math.random() * 3)];
      let nodeSpecialty = null;
      let nodeEffect = null;
      let nodeName = null;
      let visitMessage = null;
      if (nodeType == 'system') {
        if (Math.random() < 0.01) {
          nodeSpecialty = ['armsDealer', 'techDealer', 'refinery'][Math.floor(Math.random() * 3)];
          if (nodeSpecialty == 'armsDealer') {
            nodeName = `Arsenal World ${generateRandomName()}`;
            visitMessage = this.messageList.enterArsenal[Math.floor(Math.random() * this.messageList.enterArsenal.length)]
          };
          if (nodeSpecialty == 'techDealer') {
            nodeName = `Hyperconductor Production World ${generateRandomName()}`;
            visitMessage = this.messageList.enterHyperconductorFactory[Math.floor(Math.random() * this.messageList.enterHyperconductorFactory.length)]
          }
          if (nodeSpecialty == 'refinery') {
            nodeName = `Refinery World ${generateRandomName()}`;
            visitMessage = this.messageList.enterRefinery[Math.floor(Math.random() * this.messageList.enterRefinery.length)]
          }
        } else {
          nodeName = `Planetary System ${generateRandomName()}`;
          visitMessage = this.messageList.enterCommonSystem[Math.floor(Math.random() * this.messageList.enterCommonSystem.length)]
        }
      } else if (nodeType == 'station') {
        if (Math.random() < 0.01) {
          nodeSpecialty = ['fixer', 'mechanic'][Math.floor(Math.random() * 2)];
          if (nodeSpecialty == 'fixer') {
            nodeName = `The ${['Den', 'Lounge', 'Tavern', 'Alley', 'Saloon', 'Hotel', 'Club', 'Parlour', 'House', 'Fix'][Math.floor(Math.random() * 10)]} ${generateRandomName()}`;
            visitMessage = this.messageList.enterFixer[Math.floor(Math.random() * this.messageList.enterFixer.length)]
          } else if (nodeSpecialty == 'mechanic') {
            nodeName = `Shipyard Station ${generateRandomName()}`;
            visitMessage = this.messageList.enterShipyard[Math.floor(Math.random() * this.messageList.enterShipyard.length)]
          }
        } else {
          nodeName = `Space Station ${generateRandomName()}`;
          visitMessage = this.messageList.enterCommonStation[Math.floor(Math.random() * this.messageList.enterCommonStation.length)]
        }
      } else if (nodeType == 'junction') {
        nodeName = `Junction Node ${generateRandomName()}`;
        visitMessage = this.messageList.enterJunction[Math.floor(Math.random() * this.messageList.enterJunction.length)]
      }
      if (nodeSpecialty == null) {
        if (Math.random() < 0.02) { nodeEffect = 'interference'; }
      }
      this.nodes.push(new Node(
        [Math.random() * gameCanvas.width, Math.random() * gameCanvas.height],
        nodeType,
        nodeSpecialty,
        nodeEffect,
        nodeName,
        visitMessage,
        true
      ));
    }
  }

  drawNodes() {
    this.nodes.slice().reverse().filter((node) => node.visible).forEach((node) => {
      gameCtx.beginPath();
      gameCtx.arc(node.position[0], node.position[1], this.nodeRadius, 0, Math.PI * 2);
      if (node.visited) {
        if (node.specialty == 'capital') {
          gameCtx.fillStyle = this.colorMap.capitalVisited;
        } else if (node.specialty != null) {
          gameCtx.fillStyle = this.colorMap.specialtyNodeVisited;
        } else if (node.effect != null) {
          gameCtx.fillStyle = this.colorMap.nodeEffect;
        } else {
          gameCtx.fillStyle = this.colorMap.nodeVisited;
        }
      } else {
        if (node.specialty == 'capital' && calculateDistance(node.position, this.nodes[this.player.position].position) <= this.player.moveRadius) {
          gameCtx.fillStyle = this.colorMap.capitalUnvisited;
        } else if (node.specialty != null && calculateDistance(node.position, this.nodes[this.player.position].position) <= this.player.moveRadius) {
          gameCtx.fillStyle = this.colorMap.specialtyNodeUnvisited;
        } else {
          gameCtx.fillStyle = this.colorMap.nodeUnvisited;
        }
      }
      let relevantQuests = this.quests.filter((quest) => (quest.questType != 'hunt' && !quest.completed && this.nodes[quest.destination].position == node.position));
      if (relevantQuests.length > 0) { gameCtx.fillStyle = this.colorMap.questMarker; }
      if (node.specialty == 'sanctuary') { gameCtx.fillStyle = this.colorMap.safe; }
      gameCtx.fill();
    });
  }

  drawPlayerAndEnemies() {
    gameCtx.beginPath();
    gameCtx.arc(this.nodes[this.player.position].position[0], this.nodes[this.player.position].position[1], this.nodeRadius, 0, Math.PI * 2);
    if (this.player.detectableByEnemies) {
      gameCtx.fillStyle = this.colorMap.player;
    } else {
      gameCtx.fillStyle = this.colorMap.playerUndetectable;
    }
    gameCtx.fill();
    if (this.state[0] == 'move') {
      gameCtx.beginPath();
      gameCtx.arc(this.nodes[this.player.position].position[0], this.nodes[this.player.position].position[1], Math.min(this.player.moveRadius, this.player.fuel), 0, Math.PI * 2);
      gameCtx.lineWidth = 1;
      gameCtx.strokeStyle = this.colorMap.playerMovementRadius;
      gameCtx.stroke();
    }
    if (this.player.nextPosition != null) { // indicate next position
      gameCtx.beginPath();
      gameCtx.moveTo(this.nodes[this.player.position].position[0], this.nodes[this.player.position].position[1]);
      gameCtx.lineTo(this.nodes[this.player.nextPosition].position[0], this.nodes[this.player.nextPosition].position[1]);
      gameCtx.strokeStyle = this.colorMap.player;
      gameCtx.stroke();
    }
    if (this.player.pathPlan.length > 0) { // indicate path plan
      for (let i = 0; i < this.player.pathPlan.length - 1; i++) {
        gameCtx.beginPath();
        gameCtx.moveTo(this.nodes[this.player.pathPlan[i]].position[0], this.nodes[this.player.pathPlan[i]].position[1]);
        gameCtx.lineTo(this.nodes[this.player.pathPlan[i + 1]].position[0], this.nodes[this.player.pathPlan[i + 1]].position[1]);
        gameCtx.strokeStyle = this.colorMap.autopilot;
        gameCtx.stroke();
      }
    }
    this.drawStatus();
    for (let i = 0; i < this.enemies.length; i++) {
      if (
          (calculateDistance(this.nodes[this.enemies[i].position].position, this.nodes[this.player.position].position) > this.player.sensorRadius) ||
          (!this.enemies[i].detectableByPlayer && this.player.sensorLevel < 3) ||
          (this.nodes[this.player.position].effect == 'interference' && this.enemies[i].position != this.player.position && this.player.sensorLevel < 2) ||
          (this.nodes[this.enemies[i].position].effect == 'interference' && this.enemies[i].position != this.player.position && this.player.sensorLevel < 2)
        ) { continue; }
      gameCtx.beginPath();
      gameCtx.arc(this.nodes[this.enemies[i].position].position[0], this.nodes[this.enemies[i].position].position[1], this.nodeRadius, 0, Math.PI * 2);
      if (this.enemies[i].targetPosition == null) {
        gameCtx.fillStyle = this.colorMap.enemyPassive;
      } else {
        gameCtx.fillStyle = this.colorMap.enemyActive;
      }
      gameCtx.fill();
    }
  }

  draw() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    this.drawStatus()
    this.drawNodes();
    this.drawPlayerAndEnemies();
    this.drawMessage();
    generateButtons(this.buttonOptions);
  }

  useCloak() {
    if (this.player.cloaks > 0) {
      this.player.detectableByEnemies = false;
      this.player.cloakedDuration += this.player.stealthLevel;
      this.player.cloaks--;
      this.draw();
    }
  }

  missileOutcome() {
    let rng = Math.random();
    if (rng < 0.8 + 0.05 * this.player.targetingLevel) {
      rng = Math.random();
      if (rng < 0.5 + 0.05 * this.player.targetingLevel) {
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
    this.buttonOptions = ['Flee'];
    if ((this.buttonOptionClicked == "Missile") && (this.player.missiles > 0)) {
      this.player.missiles--;
      let outcome = this.missileOutcome();
      if ((outcome == "destroyed") || (this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration > 0)) {
        this.enemies.splice(collidedEnemiesIndices.pop(), 1);
        this.state[1] = collidedEnemiesIndices;
        this.notoriety++;
        this.appendMessage(this.messageList.destroyedEnemy, this.colorMap.goodMessage);
        this.quests.filter((quest) => (quest.questType == 'hunt')).forEach((quest) => {
          if (quest.destination > 0) {
            quest.destination--;
            if (quest.destination == 0) {
              quest.completed = true;
              this.notoriety++;
              this.appendMessage(this.messageList.questCompleted, this.colorMap.goodMessage);
            }
          }
        }) // update quest
      } else if (outcome == "stunned") {
        this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration++;
        this.appendMessage(this.messageList.stunnedEnemy, this.colorMap.goodMessage);
      } else if (outcome == "missed") {
        this.appendMessage(this.messageList.missedEnemy, this.colorMap.badMessage);
      }
    } else if ((this.buttonOptionClicked == "Cloak") && (this.player.cloaks > 0)) {
      if (Math.random() < 0.5 + this.player.stealthLevel * 0.05) {
        this.useCloak();
        this.appendMessage(this.messageList.startedCloak, this.colorMap.goodMessage);
        this.state = ["move", "afterCollisionCloaked"];
        this.processGameState();
        this.draw();
        return null;
      }
      else {
        this.player.cloaks--;
        this.appendMessage(this.messageList.cloakFailed, this.colorMap.badMessage);
      }
    } else if (this.buttonOptionClicked == "Move on") {
      collidedEnemiesIndices.pop();
      this.appendMessage(this.messageList.ignoreStunnedEnemy);
    } else if (this.buttonOptionClicked == "Flee") {
      if (Math.random() < Math.min(Math.max(0.1 * this.player.engineLevel / collidedEnemiesIndices.length, 0.05), 0.4)) {
        this.state = ['move', 'fleed'];
        this.appendMessage(this.messageList.fleeSuccessful, this.colorMap.goodMessage);
      } else {
        this.state = ['lose', 'collision'];
      }
      this.processGameState();
      this.draw();
      return null;
    }

    if (this.player.missiles > 0 && collidedEnemiesIndices.length > 0) {
      this.enableMissileButton = true;
    } else {
      this.enableMissileButton = false;
    }

    // checking for ambush
    if ((collidedEnemiesIndices.length > 0) && (this.buttonOptionClicked == 'Next turn')) {
      let ambushed = false;
      for (let i = 0; i < collidedEnemiesIndices.length; i++) {
        if (this.enemies[collidedEnemiesIndices[i]].ambushDuration > 0) {
          this.enemies[collidedEnemiesIndices[i]].ambushDuration = 0;
          ambushed = true;
        }
      }
      if (ambushed) {
        this.appendMessage(this.messageList.ambushed, this.colorMap.badMessage);
      }
    }

    if ((collidedEnemiesIndices.length > 1) && (this.buttonOptionClicked == 'Next turn')) {
      this.appendMessage(this.messageList.multipleShipsCollision(collidedEnemiesIndices.length), this.colorMap.badMessage);
    }
    if ((collidedEnemiesIndices.length > 0) && (this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration == 0)) {
      this.appendMessage(this.messageList.singleShipCollision, this.colorMap.badMessage);
    } else {
      this.buttonOptions.push("Move on")
    }

    if (collidedEnemiesIndices.length == 0) {
      this.state = ['move', this.nodes[this.player.position].specialty];
      this.processGameState();
    }

    this.draw();
  }

  isSanctuary() {
    return (this.player.position == this.sanctuary);
  }

  infoBroker() {
    if (!this.nodes[this.sanctuary].visible) {
      if (this.buttonOptionClicked == 'Buy') {
        this.nodes[this.sanctuary].visible = true;
        this.player.money -= this.initialTraderParameters.buySanctuaryInfoPrice;
      } else {
        if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
          this.appendMessage(this.messageList.infoBrokerOffer, this.colorMap.specialtyNodeUnvisited);
        }
        if (this.player.money >= this.initialTraderParameters.buySanctuaryInfoPrice) {
          this.buttonOptions.push('Buy')
        }
      }
    } else {
      if (this.nodes[this.player.position].lastVisited < this.turn - 1) {
        this.appendMessage(this.messageList.infoBrokerAfterOffer, this.colorMap.specialtyNodeUnvisited);
      }
    }

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  randomNonspecialistNode() {
    let choice = Math.floor(Math.random() * this.nodes.length);
    while (this.nodes[choice].specialty != null) { choice = Math.round(Math.random() * this.nodes.length); }
    return choice;
  }

  fixer() {
    let questList = this.quests.filter((quest) => (quest.fixer == this.player.position));
    const completedQuest = questList.filter((quest) => (quest.completed));
    if (completedQuest.length > 0) {
      this.player.money += completedQuest[0].reward;
      questList = [];
      this.quests = this.quests.filter((quest) => (quest.fixer != this.player.position));
      this.appendMessage(this.messageList.rewardFixer(completedQuest[0].reward), this.colorMap.goodMessage);
    }

    if (questList.length == 0) {
      const newQuest = ['smuggle', 'hunt', 'seek'][Math.floor(Math.random() * 3)];
      if (newQuest == 'smuggle') { // go to a particular point
        const newDestination = this.randomNonspecialistNode();
        const reward = 200 + Math.round(calculateDistance(this.nodes[this.player.position].position, this.nodes[newDestination].position) * 1.5 / 100 ) * 100;
        this.quests.push(new quest(this.player.position, newQuest, newDestination, reward));
        this.appendMessage(this.messageList.smuggleQuest, this.colorMap.specialtyNodeUnvisited);
        this.appendMessage(this.messageList.newQuestMarkerAdded, this.colorMap.questMarker);
      } else if (newQuest == 'hunt') { // destroy N UPA ships
        const numTargets = 2 + Math.floor(Math.random() * 3);
        const reward = 600 * numTargets;
        this.quests.push(new quest(this.player.position, newQuest, numTargets, reward));
        this.appendMessage(this.messageList.huntQuest(numTargets), this.colorMap.specialtyNodeUnvisited);
      } else if (newQuest == 'seek') { // go to a particular point, but may arbitrarily extend
        const newDestination = this.randomNonspecialistNode();
        const reward = 200 + Math.round(calculateDistance(this.nodes[this.player.position].position, this.nodes[newDestination].position) * 1.5 / 100 ) * 100;
        this.quests.push(new quest(this.player.position, newQuest, newDestination, reward));
        this.appendMessage(this.messageList.seekQuest, this.colorMap.specialtyNodeUnvisited);
        this.appendMessage(this.messageList.newQuestMarkerAdded, this.colorMap.questMarker);
      }
    } else {
      if (this.nodes[this.player.position].lastVisited < this.turn - 1) {
        this.appendMessage(this.messageList.fixerAlreadyHasQuest, this.colorMap.specialtyNodeUnvisited);
      }
    }

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw()
  }

  sell() {
    this.buttonOptions = [];
    if (this.buttonOptionClicked == 'Sell missile') {
      this.player.missiles--;
      this.player.money += this.nodes[this.player.position].sellMissilePrice;
    } else if (this.buttonOptionClicked == 'Sell cloak') {
      this.player.cloaks--;
      this.player.money += this.nodes[this.player.position].sellCloakPrice;
    } else if (this.buttonOptionClicked == 'Sell 100 fuel') {
      this.player.fuel -= 1000;
      this.player.money += this.nodes[this.player.position].sellFuelPrice;
    } else if (this.buttonOptionClicked == 'Back') {
      this.state = ['move', this.state[1]];
      this.processGameState();
      this.draw();
      return null;
    }
    if (this.state[1] == 'refinery') {
      if (this.player.missiles > 0) { this.buttonOptions.push('Sell missile'); }
      if (this.player.cloaks > 0) { this.buttonOptions.push('Sell cloak'); }
    } else if (this.state[1] == 'armsDealer') {
      if (this.player.fuel > 1000) { this.buttonOptions.push('Sell 100 fuel'); }
      if (this.player.cloaks > 0) { this.buttonOptions.push('Sell cloak'); }
    } else if (this.state[1] == 'techDealer') {
      if (this.player.fuel > 1000) { this.buttonOptions.push('Sell 100 fuel'); }
      if (this.player.missiles > 0) { this.buttonOptions.push('Sell missile'); }
    }
    this.buttonOptions.push('Back');
    this.draw();
  }

  stockAndPricing(stockUnit) {
    if (this.nodes[this.player.position].lastVisited != null && this.nodes[this.player.position].lastVisited < this.turn - 1) {
      let additionalStock = 0;
      for (let i = 0; i < this.turn - 1 - this.nodes[this.player.position].lastVisited; i++) { // stock generation
        if (Math.random() < this.nodes[this.player.position].addStockProbability) { additionalStock += stockUnit; }
      }
      this.nodes[this.player.position].stock = Math.min(this.nodes[this.player.position].stock + additionalStock, this.nodes[this.player.position].maxStock);
      if (this.nodes[this.player.position].stock < this.nodes[this.player.position].maxStock / 2) { // dynamic pricing
        this.nodes[this.player.position].buyPrice = Math.round((this.nodes[this.player.position].initialBuyPrice *
          Math.round((1.5 - Math.max(this.nodes[this.player.position].stock, stockUnit) / this.nodes[this.player.position].maxStock) * 10) / 10) / 10) * 10;
      } else {
        this.nodes[this.player.position].buyPrice = this.nodes[this.player.position].initialBuyPrice;
      }
    }
  }

  refinery() {
    if (this.nodes[this.player.position].lastVisited == null) {
      this.nodes[this.player.position].initialBuyPrice = this.initialTraderParameters.initialBuyFuelPriceRefinery;
      this.nodes[this.player.position].buyPrice = this.initialTraderParameters.initialBuyFuelPriceRefinery;
      this.nodes[this.player.position].sellMissilePrice = this.initialTraderParameters.initialSellMissilePriceRefinery;
      this.nodes[this.player.position].sellCloakPrice = this.initialTraderParameters.initialSellCloakPriceRefinery;
      this.nodes[this.player.position].maxStock = this.initialTraderParameters.maxStockRefinery;
      this.nodes[this.player.position].stock = this.initialTraderParameters.maxStockRefinery;
      this.nodes[this.player.position].addStockProbability = this.initialTraderParameters.addStockProbabilityRefinery;
    }
    this.stockAndPricing(1000);
    if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
      this.appendMessage(this.messageList.refineryOffer(
        this.nodes[this.player.position].buyPrice,
        this.nodes[this.player.position].sellMissilePrice,
        this.nodes[this.player.position].sellCloakPrice,
        this.nodes[this.player.position].stock / 10
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.fuel += 1000;
      this.nodes[this.player.position].stock -= 1000;
      this.player.money -= this.nodes[this.player.position].buyPrice;
      if (this.nodes[this.player.position].stock == 0) {
        this.appendMessage(this.messageList.noStockLeft, this.colorMap.specialtyNodeUnvisited);
      }
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'refinery'];
      this.processGameState();
      return null;
    }
    if (this.player.money >= this.nodes[this.player.position].buyPrice && this.nodes[this.player.position].stock > 0) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  armsDealer() {
    if (this.nodes[this.player.position].lastVisited == null) {
      this.nodes[this.player.position].initialBuyPrice = this.initialTraderParameters.initialBuyMissilePriceArmsDealer;
      this.nodes[this.player.position].buyPrice = this.initialTraderParameters.initialBuyMissilePriceArmsDealer;
      this.nodes[this.player.position].sellFuelPrice = this.initialTraderParameters.initialSellFuelPriceArmsDealer;
      this.nodes[this.player.position].sellCloakPrice = this.initialTraderParameters.initialSellCloakPriceArmsDealer;
      this.nodes[this.player.position].maxStock = this.initialTraderParameters.maxStockArmsDealer;
      this.nodes[this.player.position].stock = this.initialTraderParameters.maxStockArmsDealer;
      this.nodes[this.player.position].addStockProbability = this.initialTraderParameters.addStockProbabilityArmsDealer;
    }
    this.stockAndPricing(1);
    if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
      this.appendMessage(this.messageList.armsDealerOffer(
        this.nodes[this.player.position].buyPrice,
        this.nodes[this.player.position].sellFuelPrice,
        this.nodes[this.player.position].sellCloakPrice,
        this.nodes[this.player.position].stock
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.missiles++;
      this.nodes[this.player.position].stock--;
      this.player.money -= this.nodes[this.player.position].buyPrice;
      if (this.nodes[this.player.position].stock == 0) {
        this.appendMessage(this.messageList.noStockLeft, this.colorMap.specialtyNodeUnvisited);
      }
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'armsDealer'];
      this.processGameState();
      return null;
    }
    if (this.player.money >= this.nodes[this.player.position].buyPrice && this.nodes[this.player.position].stock > 0) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  techDealer() {
    if (this.nodes[this.player.position].lastVisited == null) {
      this.nodes[this.player.position].initialBuyPrice = this.initialTraderParameters.initialBuyCloakPriceTechDealer;
      this.nodes[this.player.position].buyPrice = this.initialTraderParameters.initialBuyCloakPriceTechDealer;
      this.nodes[this.player.position].sellFuelPrice = this.initialTraderParameters.initialSellFuelPriceTechDealer;
      this.nodes[this.player.position].sellMissilePrice = this.initialTraderParameters.initialSellMissilePriceTechDealer;
      this.nodes[this.player.position].maxStock = this.initialTraderParameters.maxStockTechDealer;
      this.nodes[this.player.position].stock = this.initialTraderParameters.maxStockTechDealer;
      this.nodes[this.player.position].addStockProbability = this.initialTraderParameters.addStockProbabilityTechDealer;
    }
    this.stockAndPricing(1);
    if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
      this.appendMessage(this.messageList.techDealerOffer(
        this.nodes[this.player.position].buyPrice,
        this.nodes[this.player.position].sellFuelPrice,
        this.nodes[this.player.position].sellMissilePrice,
        this.nodes[this.player.position].stock
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.cloaks++;
      this.nodes[this.player.position].stock--;
      this.player.money -= this.nodes[this.player.position].buyPrice;
      if (this.nodes[this.player.position].stock == 0) {
        this.appendMessage(this.messageList.noStockLeft, this.colorMap.specialtyNodeUnvisited);
      }
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'techDealer'];
      this.processGameState();
      return null;
    }
    if (this.player.money >= this.nodes[this.player.position].buyPrice && this.nodes[this.player.position].stock > 0) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  };

  mechanic() {
    if (this.nodes[this.player.position].lastVisited == null) {
      this.nodes[this.player.position].upgradeCount = 0;
    }
    const upgradePrice = Math.floor(this.initialTraderParameters.initialUpgradeCost * (1.5 ** this.nodes[this.player.position].upgradeCount) / 100 ) * 100;
    if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
      this.appendMessage(this.messageList.mechanicOffer(upgradePrice), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Ship upgrades') {
      this.buttonOptions = ['Engine', 'Sensor', 'Back'];
    } else if (this.buttonOptionClicked == 'Tech upgrades') {
      this.buttonOptions = ['Targeting', 'Stealth', 'Back'];
    } else if (this.buttonOptionClicked == 'Engine') {
      this.player.moveRadius += 10;
      this.player.engineLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedEngine, this.colorMap.goodMessage);
      this.draw();
      return null;
    } else if (this.buttonOptionClicked == 'Sensor') {
      this.player.sensorRadius += 3 * 20;
      this.player.sensorLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedSensor, this.colorMap.goodMessage);
      this.draw();
      return null;
    } else if (this.buttonOptionClicked == 'Targeting') {
      this.player.targetingLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedTargeting, this.colorMap.goodMessage);
      this.draw();
      return null;
    } else if (this.buttonOptionClicked == 'Stealth') {
      this.player.stealthLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedStealth, this.colorMap.goodMessage);
      this.draw();
      return null;
    }
    if (!['Ship upgrades', 'Tech upgrades'].includes(this.buttonOptionClicked) && this.player.money >= upgradePrice) {
      this.buttonOptions.push('Ship upgrades');
      this.buttonOptions.push('Tech upgrades');
    }

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  wormhole() {
    if (this.player.engineLevel > 2 && this.player.fuel >= 200) {
      if (!this.nodes[this.nodes[this.player.position].wormholeEndPosition].visited) {
        this.nodes[this.nodes[this.player.position].wormholeEndPosition].visited = true;
      }
      this.buttonOptions.push('Traverse');
    }
    if (this.buttonOptionClicked == 'Traverse') {
      this.buttonOptionClicked = null;
      this.player.nextPosition = this.nodes[this.player.position].wormholeEndPosition;
      this.player.position = this.nodes[this.player.position].wormholeEndPosition;
      this.player.fuel -= 200;
      this.appendMessage(this.messageList.traverseWormhole, this.colorMap.nodeEffect);
      this.move();
    }

    this.draw();
  }

  cartographer() {
    this.buttonOptions = [];
    let offeredNode = null;
    const unvisitedNodes = [];
    this.nodes.forEach((node, index) => {
      if (!node.visited && node.visible && node.specialty != null && node.specialty != 'capital' &&
        calculateDistance(this.nodes[this.player.position].position, node.position) > this.player.moveRadius
      ) { unvisitedNodes.push(index); }
    });
    if (unvisitedNodes.length == 0) {
      this.nodes.forEach((node, index) => {
        if (!node.visited && node.visible && node.effect != null) { unvisitedNodes.push(index); }
      });
    }
    if (unvisitedNodes.length == 0) {
      this.state = ['move', null];
      this.processGameState();
      this.draw();
      return null;
    }
    offeredNode = unvisitedNodes[Math.floor(unvisitedNodes.length * Math.random())];
    let price = 0;
    if (this.player.money >= 1000) {
      price = 500;
    } else if (this.player.money >= 400) {
      price = 200;
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.buttonOptionClicked = null;
      this.nodes[offeredNode].visited = true;
      this.player.money -= price;
      this.state = ['move', null];
      this.buttonOptions = ['Next turn']
      if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
    } else if (this.buttonOptionClicked == 'Move on') {
      this.buttonOptionClicked = null;
      if (price == 0) { this.nodes[offeredNode].visited = true; }
      this.state = ['move', null];
      this.buttonOptions = ['Next turn']
      if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
    } else {
      this.appendMessage(this.messageList.cartographerOffer(price), this.colorMap.event);
      if (price > 0) { this.buttonOptions.push('Buy'); }
      this.buttonOptions.push('Move on');
    }

    this.draw();
  }

  gift() {
    const giftTypes = ['money', 'fuel', 'missiles', 'cloaks'];
    const giftType = giftTypes[Math.floor(giftTypes.length * Math.random())];
    let giftAmount = 0;
    if (giftType == 'money') {
      giftAmount = 200 + Math.floor(9 * Math.random()) * 100; // $200 to $1000
      this.player.money += giftAmount;
      this.appendMessage(this.messageList.giftMoney(giftAmount), this.colorMap.event);
    } else if (giftType == 'fuel') {
      giftAmount = 1000 + Math.floor(6 * Math.random()) * 1000; // 100 to 600 fuel
      this.player.fuel += giftAmount;
      this.appendMessage(this.messageList.giftFuel(giftAmount / 10), this.colorMap.event);
    } else if (giftType == 'missiles') {
      giftAmount = 2 + Math.floor(3 * Math.random()); // 2 to 4 missiles
      this.player.missiles += giftAmount;
      this.appendMessage(this.messageList.giftMissiles(giftAmount), this.colorMap.event);
    } else if (giftType == 'cloaks') {
      giftAmount = 2 + Math.floor(2 * Math.random()); // 2 to 3 cloaks
      this.player.cloaks += giftAmount;
      this.appendMessage(this.messageList.giftCloaks(giftAmount), this.colorMap.event);
    }
    this.state = ['move', null];
    this.buttonOptions = ['Next turn'];
    if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
    this.draw();
  }

  reported() {
    this.enemies.forEach(enemy => {
      enemy.targetPosition = this.player.position;
      enemy.lastDetectedPlayerTurn = this.turn;
      enemy.decideNextPosition(this.nodes, this.player, this.sanctuary);
    });
    this.appendMessage(this.messageList.reported, this.colorMap.event);
    this.state = ['move', null];
    this.buttonOptions = ['Next turn'];
    if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
    this.draw();
  }

  framed() {
    this.notoriety += 2;
    this.appendMessage(this.messageList.framed, this.colorMap.event);
    this.state = ['move', null];
    this.buttonOptions = ['Next turn'];
    if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
    this.draw();
  }

  // this function should be used immediately after a state change
  processGameState() {
    if (this.state[0] == "lose") {
      this.buttonOptions = [];
      this.player.missiles = 0;
      this.player.cloaks = 0;
      if (this.state[1] == "collision") {
        this.appendMessage(this.messageList.loseCollision, this.colorMap.badMessage);
        this.draw()
      }
    } else if (this.state[0] == "win") {
      this.player.detectableByEnemies = false;
      this.buttonOptions = [];
      this.player.missiles = 0;
      this.player.cloaks = 0;
      if (this.state[1] == "sanctuary") {
        this.appendMessage(this.messageList.winSanctuary, this.colorMap.safe);
        this.draw()
      }
    } else if (this.state[0] == "move") {
      this.buttonOptions = ['Next turn'];
      this.visit();
      
      if (this.state[1] == 'infoBroker') {
        this.infoBroker();
      } else if (this.state[1] == 'fixer') {
        this.fixer();
      } else if (this.state[1] == "refinery") {
        this.refinery();
      } else if (this.state[1] == "armsDealer") {
        this.armsDealer();
      } else if (this.state[1] == "techDealer") {
        this.techDealer();
      } else if (this.state[1] == "mechanic") {
        this.mechanic();
      } else if (this.state[1] == "wormhole") {
        this.wormhole();
      }
    } else if (this.state[0] == 'autopilot') {
      this.autopilot();
    } else if (this.state[0] == "collision") {
      this.collision();
    } else if (this.state[0] == 'sell') {
      this.sell();
    } else if (this.state[0] == 'event') {
      if (this.state[1] == 'cartographer') {
        this.cartographer();
      } else if (this.state[1] == 'gift') {
        this.gift();
      } else if (this.state[1] == 'reported') {
        this.reported();
      } else if (this.state[1] == 'framed') {
        this.framed();
      }
    } else { // temp: for dealing with incomplete states
      this.state = ['move', null];
      this.buttonOptions = ['Next turn'];
    }
  }

  isPositionNode(node, x, y) {
    const dist = calculateDistance(this.nodes[node].position, [x, y]);
    return (dist <= this.nodeRadius + 1);
  }

  generateEnemy() {
    const maxEnemies = Math.min(Math.floor(this.notoriety / 2), 40);
    const prob = (maxEnemies - this.enemies.length) / (2 * maxEnemies);
    if (Math.random() < prob) {
      this.enemies.push(new Enemy(this.capital, enemyMoveRadius));
      this.enemies[this.enemies.length - 1].decideNextPosition(this.nodes, this.player, this.sanctuary);
    }
  }

  sampleRandomEvent() {
    let randomEventTriggered = false;
    let randomEvent = null;
    if (this.nodes[this.player.position].firstVisited < this.turn) {
      if (Math.random() < this.randomEventParameters.visitedNodeProbability) { randomEventTriggered = true;}
    } else {
      if (Math.random() < this.randomEventParameters.unvisitedNodeProbability) { randomEventTriggered = true;}
    }
    if (randomEventTriggered) {
      randomEvent = this.randomEventParameters.randomEvents[Math.floor(this.randomEventParameters.randomEvents.length * Math.random())];
    }
    return randomEvent;
  }

  findNodeByPosition(x, y) {
    // simple iterative search - can be made into a binary search
    for (let i = 0; i < this.numNodes; i++) {
      if (this.isPositionNode(i, x, y)) { return i; }
    }
    return null;
  }

  visit() {
    // first visit
    if (!this.nodes[this.player.position].visited || this.nodes[this.player.position].lastVisited == null) {
      this.nodes[this.player.position].visited = true;
      this.nodes[this.player.position].firstVisited = this.turn;
      if (this.nodes[this.player.position].visitMessage != null && this.state != 'win') {
        let messageColour = this.colorMap.neutralMessage;
        if (this.nodes[this.player.position].specialty != null) {
          if (this.nodes[this.player.position].specialty == 'sanctuary') {
            this.state = ['win', 'sanctuary'];
            this.processGameState();
            messageColour = this.colorMap.safe;
          } else if (this.nodes[this.player.position].specialty == 'capital') {
            messageColour = this.colorMap.capitalUnvisited;
          } else {
            messageColour = this.colorMap.specialtyNodeUnvisited;
          }
        }
        if (this.nodes[this.player.position].effect == 'wormhole') { messageColour = this.colorMap.nodeEffect; }
        this.appendMessage([this.nodes[this.player.position].visitMessage], messageColour);
      }
    }

    // update quest
    const relevantQuests = this.quests.filter((quest) => (quest.questType != 'hunt' && quest.destination == this.player.position));
    for (let i = 0; i < relevantQuests.length; i++) {
      if (relevantQuests[i].questType == 'smuggle') {
        relevantQuests[i].completed = true;
        relevantQuests[i].destination = null;
        this.notoriety++;
        this.appendMessage(this.messageList.questCompleted, this.colorMap.goodMessage);
      } else if (relevantQuests[i].questType == 'seek') {
        if (Math.random() > 0.5) {
          relevantQuests[i].completed = true;
          relevantQuests[i].destination = null;
          this.notoriety++;
          this.appendMessage(this.messageList.questCompleted, this.colorMap.goodMessage);
        } else {
          relevantQuests[i].destination = this.randomNonspecialistNode();
          relevantQuests[i].reward += Math.round(calculateDistance(this.nodes[this.player.position].position, this.nodes[relevantQuests[i].destination].position) / 10) * 10;
          this.appendMessage(this.messageList.newQuestMarkerAdded, this.colorMap.questMarker);
        }
      }
    }

    // specialty nodes
    if (this.isSanctuary()) {
      this.state = ['win', 'sanctuary'];
      this.processGameState();
    } else if (this.nodes[this.player.position].specialty == 'capital') {
      //this.state = ['capital', null]; // using this line would force the player to stay at Centralis for a turn
      this.state = ['move', this.nodes[this.player.position].specialty];
    } else if (this.nodes[this.player.position].specialty != null) {
      this.state = ['move', this.nodes[this.player.position].specialty];
    } else if (this.nodes[this.player.position].effect != null) {
      this.state = ['move', this.nodes[this.player.position].effect];
    } else {
      this.state = ['move', null];
    }
    
    // random events
    if (this.nodes[this.player.position].specialty == null && this.nodes[this.player.position].effect == null) {
      const randomEvent = this.sampleRandomEvent();
      if (randomEvent != null) {
        this.state = ['event', randomEvent];
        this.processGameState();
      }
      this.nodes[this.player.position].lastVisited = this.turn;
    }
  }

  move() {
    this.turn++;
    if (this.player.nextPosition != null) {
      this.player.move();
      this.player.pathPlan.shift();
    }
    if (this.player.pathPlan.length > 0) { this.player.setNextPosition(this.player.pathPlan[0], this.nodes); }
    if (this.player.nextPosition == null) {
      this.player.pathPlan = [];
    }
    if (this.isSanctuary()) {
      this.state = ['win', 'sanctuary'];
    }
    if (this.player.cloakedDuration > 0) {
      this.player.cloakedDuration--;
    } else if ((this.player.cloakedDuration == 0) && (!this.player.detectableByEnemies)) {
      this.player.detectableByEnemies = true;
    }

    if (this.nodes[this.player.position].effect == 'interference') {
      if (this.nodes[this.player.position].lastVisited == null || this.nodes[this.player.position].lastVisited < this.turn - 1) {
        this.appendMessage(this.messageList.enterInterference, this.colorMap.nodeEffect);
      }
      this.nodes[this.player.position].lastVisited = this.turn;
    }

    // enemy movement
    let ambushingEnemies = 0;
    const numPursuingEnemiesBefore = this.enemies.filter(enemy => enemy.targetPosition != null).length;
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.nodes[this.enemies[i].position].effect == 'wormhole' && this.enemies[i].lastDetectedPlayerTurn < this.turn - 1) { // if enemy didn't detect the player the previous turn
        if (Math.random() < 0.5) {
          this.enemies[i].nextPosition = this.nodes[this.enemies[i].position].wormholeEndPosition;
        }
      }
      this.enemies[i].move();
      this.enemies[i].decideTargetPosition(this.nodes, this.player, this.sanctuary, this);
      this.enemies[i].decideNextPosition(this.nodes, this.player, this.sanctuary);
      if (this.enemies[i].ambushDuration > 0) { ambushingEnemies++; }
    }
    //console.log(`Ambushing enemies: ${ambushingEnemies}`);
    this.generateEnemy();
    const numPursuingEnemiesAfter = this.enemies.filter(enemy => enemy.targetPosition != null).length;

    if (numPursuingEnemiesAfter > numPursuingEnemiesBefore + 1) { // not perfect, as it'll be incorrect for when an enemy stops pursuing while another starts
      this.appendMessage(this.messageList.detectedByEnemies);
    } else if (numPursuingEnemiesAfter == numPursuingEnemiesBefore + 1) {
      this.appendMessage(this.messageList.detectedByEnemy);
    }

    // checking for collision
    const collidedEnemiesIndices = this.findCollidedEnemies();
    if ((collidedEnemiesIndices.length > 0) && (this.player.detectableByEnemies)) {
      this.state = ['collision', collidedEnemiesIndices];
      this.processGameState();
      this.draw();
    }
    
    if (this.state[0] == 'move') {
      this.processGameState();
      if (this.player.pathPlan.length > 1) { this.buttonOptions.push('Autopilot'); }
      this.draw();
    }
  }

  endAutopilot() {
    //this.player.pathPlan = [];
    if (this.state[0] == 'autopilot') { 
      this.state = ['move', null]; 
    }
    this.processGameState();
    this.draw();
  }
  
  autopilot() {
    this.appendMessage(this.messageList.autopilotEngaged, this.colorMap.autopilot);
    this.buttonOptions = [];
    const interval = setInterval(() => {
      if (this.state[0] == 'autopilot' && this.player.pathPlan.length > 0) {
        this.move();
        this.draw();
        // random events
        let randomEvent = null;
        if (this.nodes[this.player.position].specialty == null && this.nodes[this.player.position].effect == null) {
          randomEvent = this.sampleRandomEvent();
        }
        // pursuing enemies detected within player's sensor range
        const numEnemies = this.enemies.filter(enemy => enemy.lastDetectedPlayerTurn >= this.turn - 1 &&
          calculateDistance(this.nodes[enemy.position].position, this.nodes[this.player.position].position) <= this.player.sensorRadius).length;
        if (this.player.pathPlan.length == 0) {
          this.appendMessage(this.messageList.autopilotCompleted, this.colorMap.autopilot);
          this.endAutopilot();
          clearInterval(interval);
          return null;
        } else if (this.player.fuel < 300) {
          this.appendMessage(this.messageList.autopilotEndedLowFuel, this.colorMap.autopilot);
          this.endAutopilot();
          clearInterval(interval);
          return null;
        } else if (numEnemies > 0) {
          this.appendMessage(this.messageList.autopilotEndedEnemy, this.colorMap.autopilot);
          this.endAutopilot();
          clearInterval(interval);
          return null;
        } else if (randomEvent != null) {
          this.appendMessage(this.messageList.autopilotEndedEvent, this.colorMap.autopilot);
          this.state = ['event', randomEvent];
          this.endAutopilot();
          clearInterval(interval);
          return null;
        }
      } else { // redundant
        this.endAutopilot();
        clearInterval(interval);
        return null;
      }
    }, 250);
  }
}
  

let game = new Game(
  numNodes = 150,
  nodeRadius = 5,
  playerMoveRadius = 80,
  playerInitialFuel = 5000,
  playerInitialMissiles = 0,
  playerInitialCloaks = 0,
  playerInitialMoney = 500,
  enemyMoveRadius = 80,
  numInitialEnemies = 0
);

document.getElementById("new-game").addEventListener("click", function () {
  game = new Game(
    numNodes = 150,
    nodeRadius = 5,
    playerMoveRadius = 80,
    playerInitialFuel = 5000,
    playerInitialMissiles = 0,
    playerInitialCloaks = 0,
    playerInitialMoney = 500,
    enemyMoveRadius = 80,
    numInitialEnemies = 0
  );
});

// listen for click events to move the player
gameCanvas.addEventListener('click', (event) => {
  if (game.state[0] != 'move') { return null; }
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;
  const positionClicked = game.findNodeByPosition(mouseX, mouseY);
  if (positionClicked != null && !(positionClicked == game.sanctuary && !game.nodes[game.sanctuary].visible) &&
    game.nodes[positionClicked].visited &&
    calculateDistance(game.nodes[positionClicked].position, game.nodes[game.player.position].position) > game.player.moveRadius) { // set autopilot plan
    game.player.pathPlan = shortestPath(game.player.position, positionClicked, game.player.moveRadius, game.nodes, true);
    game.player.setNextPosition(game.player.pathPlan[0], game.nodes);
    if (game.player.nextPosition == null) { game.player.pathPlan = []; }
    if (!game.buttonOptions.includes('Autopilot') && game.player.fuel > 300 && game.buttonOptions.length < 3 &&
      game.enemies.filter(enemy => enemy.lastDetectedPlayerTurn > game.turn - 1).length == 0) {
      game.buttonOptions.push('Autopilot');
    }
  } else if (positionClicked != null && !(positionClicked == game.sanctuary && !game.nodes[game.sanctuary].visible)) { // set next position
    game.player.setNextPosition(positionClicked, game.nodes);
    game.player.pathPlan = [positionClicked];
  }
  if (game.buttonOptions.indexOf('Autopilot') > -1 && game.player.pathPlan.length <= 1) { // remove redundant autopilot button
    game.buttonOptions.splice(game.buttonOptions.indexOf('Autopilot'), 1);
  }
  game.draw();
});

function processButtonOptionClick() {
  if (game.buttonOptionClicked == 'Next turn') {
    game.move();
  } else if (game.buttonOptionClicked == 'Autopilot') {
    game.state = ['autopilot', null];
    game.processGameState();
  } else if (['Missile', 'Cloak', 'Move on', 'Buy', 'Sell', 'Sell missile',
      'Sell cloak', 'Sell 100 fuel', 'Ship upgrades', 'Tech upgrades', 'Back',
      'Engine', 'Sensor', 'Targeting', 'Stealth', 'Traverse', 'Flee'].includes(game.buttonOptionClicked)) {
    game.processGameState();
  }
}

messageCanvas.addEventListener('click', (event) => {
  const result = checkMessageButtonClick(event);
  if (result == 'useCloak') {
    if (game.state[0] == 'collision') {
      game.buttonOptionClicked = 'Cloak';
    } else {
      game.buttonOptionClicked = 'useCloak';
      game.appendMessage(game.messageList.startedCloak, game.colorMap.goodMessage);
      game.useCloak();
    }
  } else if (result == 'useMissile') {
    game.buttonOptionClicked = 'Missile';
  } else if (result != null) {
    game.buttonOptionClicked = game.buttonOptions[result];
  } else {
    return null;
  }
  processButtonOptionClick();
});

let keyIsPressed = false;
document.addEventListener('keydown', function(event) {
  if (keyIsPressed) return null; // prevent spam
  keyIsPressed = true;
  if (event.key == ' ') {
    if (game.buttonOptions.includes('Next turn')) {
      game.buttonOptionClicked = 'Next turn';
      game.move();
    }
  } else if ([1, 2, 3].includes(parseInt(event.key))) {
    if (parseInt(event.key) <= game.buttonOptions.length) {
      game.buttonOptionClicked = game.buttonOptions[parseInt(event.key) - 1];
      processButtonOptionClick();
    }
  }
});

document.addEventListener('keyup', function() {
  keyIsPressed = false;
});

gameCanvas.addEventListener('mousemove', (event) => {
  const canvasRect = gameCanvas.getBoundingClientRect();
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;
  tooltip.innerHTML = ``;
  const hoveredNode = game.nodes[game.findNodeByPosition(mouseX, mouseY)];
  if (hoveredNode) {
    const numEnemies = game.enemies.filter(enemy => game.nodes[enemy.position].position == hoveredNode.position &&
      calculateDistance(game.nodes[enemy.position].position, game.nodes[game.player.position].position) <= game.player.sensorRadius &&
      !(game.nodes[game.player.position].effect == 'interference' && game.player.position != enemy.position && game.player.sensorLevel < 2) &&
      !(game.nodes[enemy.position].effect == 'interference' && game.player.position != enemy.position && game.player.sensorLevel < 2) &&
      !(!enemy.detectableByPlayer && game.player.sensorLevel < 3)
    ).length;
    const isDestination = game.quests.filter(quest => quest.questType != 'hunt' && quest.destination != null && game.nodes[quest.destination].position == hoveredNode.position).length > 0;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
    let htmlString = ``;
    if (hoveredNode.specialty == 'sanctuary' && hoveredNode.visible) {
      htmlString += `<span style="color:${game.colorMap.safe}">${hoveredNode.name}</span>`;
    } else if (hoveredNode.specialty == 'capital' && (hoveredNode.visited || calculateDistance(hoveredNode.position, game.nodes[game.player.position].position) <= game.player.moveRadius)) {
      htmlString += `<span style="color:${game.colorMap.capitalVisited}">${hoveredNode.name}</span>`;
    } else if (hoveredNode.visited) {
      if (hoveredNode.specialty == null) {
        if (hoveredNode.effect == 'wormhole') {
          htmlString += `<span style="color:${game.colorMap.nodeEffect}">${hoveredNode.name}</span>`;
        } else {
          htmlString += `<span style="color:${game.colorMap.nodeVisited}">${hoveredNode.name}</span>`;
        }
      } else {
        htmlString += `<span style="color:${game.colorMap.specialtyNodeVisited}">${hoveredNode.name}</span>`;
      }
    } else if (numEnemies == 0 && !isDestination) {
      tooltip.style.display = 'none';
    }
    if (hoveredNode.effect == 'interference') {
      htmlString += `<p><span style="color:${game.colorMap.nodeEffect}">Cosmic interference</span>`;
    }
    if (isDestination) {
      htmlString += `<p><span style="color:${game.colorMap.questMarker}">Destination</span>`;
    }
    if (game.nodes[game.player.position].position == hoveredNode.position) {
      htmlString += `<p><span style="color:${game.colorMap.player}">You</span>`;
    }
    if (numEnemies > 0) {
      htmlString += `<p><span style="color:${game.colorMap.enemyPassive}">Enemies: ${numEnemies}</span>`;
    }
    tooltip.innerHTML = htmlString;
  } else {
    tooltip.style.display = 'none';
  }
});
