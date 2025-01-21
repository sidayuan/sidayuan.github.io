// Set up the canvas
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');

const messageCanvas = document.getElementById('messageCanvas');
const messageCtx = messageCanvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

function calculateDistance(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) }

function findNearbyNodes(nodes, node, radius, exclude) {
  const nearbyNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if ((calculateDistance(nodes[node].position, nodes[i].position) <= radius) && !(exclude.includes(i))) { nearbyNodes.push(i); }
  }
  return nearbyNodes;
}

function generateRandomName() {
  // two random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 2 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  // three random digits
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Ensures 3 digits
  return `${randomLetters}-${randomDigits}`;
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
    this.detectableByPlayer = false;
    this.detectionRadius = 2 * this.moveRadius; // can be parametrised
    this.abandonThreshold = 5; // can be parametrised
    this.lastDetectedPlayerTurn = null;
  }

  decideTargetPosition(nodes, player, sanctuary, game) {
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
    const nearbyNodes = findNearbyNodes(nodes, this.position, this.moveRadius, [sanctuary]);
    if (this.targetPosition != null) {
      const nearbyNodesPlayer = findNearbyNodes(nodes, player.position, player.moveRadius, [sanctuary]);
      const intersectionNodes = nearbyNodes.filter(value => nearbyNodesPlayer.includes(value));
      if ((player.detectableByEnemies) && (intersectionNodes.length > 0)) { // if it can detect player AND reach the player's vicinity, it randomly picks such a node
        this.nextPosition = intersectionNodes[Math.floor(Math.random() * intersectionNodes.length)];
      } else { // if enemy is still far from the player OR it can't detect the player, it chooses the approximate best path towards the target node
        // the following chase logic can be generalised using recursion
        const nearbyNodeSet = {}
        const paths = [[this.position, this.position, this.position]];
        for (let i = 0; i < nearbyNodes.length; i++) {
          nearbyNodeSet[[i]] = findNearbyNodes(nodes, nearbyNodes[i], this.moveRadius, [sanctuary]);
          for (let j = 0; j < nearbyNodeSet[[i]].length; j++) {
            nearbyNodeSet[[i, j]] = findNearbyNodes(nodes, nearbyNodeSet[[i]][j], this.moveRadius, [sanctuary]);
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
          let newDist = calculateDistance(nodes[player.position].position, nodes[paths[i][2]].position);
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
      questMarker : `Cyan`,
      nodeEffect : 'MediumAquamarine'
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

    this.initialPrices = {
      buySanctuaryInfoPrice : 10000,
      initialBuyFuelPriceRefinery : 100,
      initialSellMissilePriceRefinery : 250,
      initialSellCloakPriceRefinery : 625,
      initialBuyMissilePriceArmsDealer : 200,
      initialSellCloakPriceArmsDealer : 750,
      initialSellFuelPriceArmsDealer : 150,
      initialBuyCloakPriceTechDealer : 500,
      initialSellMissilePriceTechDealer : 300,
      initialSellFuelPriceTechDealer : 150,
      initialUpgradeCost : 800,
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
        `You hear a digitised voice coming from your interface. "I know who you are, and I know what you want," it says. "I'll tell you where it is for $${this.initialPrices.buySanctuaryInfoPrice}."`,
        `I KNOW WHERE YOU WANT TO GO. $${this.initialPrices.buySanctuaryInfoPrice}.`
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
        `"You need some cash?" the fixer asks rhetorically. "I need you to deliver something for me. And don't peek into it. Trust me kid, you're better off not knowing."`,
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
      refineryOffer(buyFuelprice, sellMissilePrice, sellCloakPrice) {
        return [
          `The anaemic fuel trader taps the sign. SELLING: 100 Fuel $${buyFuelprice}. BUYING: Missile $${sellMissilePrice}, Cloak $${sellCloakPrice}.`,
          `The mute child points to the cracked screen. SELLING: 100 Fuel $${buyFuelprice}. BUYING: Missile $${sellMissilePrice}, Cloak $${sellCloakPrice}.`
        ]
      },
      armsDealerOffer(buyMissilePrice, sellFuelPrice, sellCloakPrice) {
        return [
          `The arms dealer points to the writing on the wall with the only arm he has left. SELLING: Missile $${buyMissilePrice}. BUYING: 100 fuel $${sellFuelPrice}, Cloak $${sellCloakPrice}.`,
          `The slender arms dealer coughs into a dirty cloth as he passes you a note. SELLING: Missile $${buyMissilePrice}. BUYING: 100 fuel $${sellFuelPrice}, Cloak $${sellCloakPrice}.`
        ]
      },
      techDealerOffer(buyCloakPrice, sellFuelPrice, sellMissilePrice) {
        return [
          `The tech dealer's rusty mechanical arm projects a hologram in front of you. SELLING: Cloak $${buyCloakPrice}. BUYING: 100 fuel $${sellFuelPrice}, Missile $${sellMissilePrice}.`,
          `The feeble child shows you the interface in their forearm. SELLING: Cloak $${buyCloakPrice}. BUYING: 100 fuel $${sellFuelPrice}, Missile $${sellMissilePrice}.`
        ]
      },
      mechanicOffer(upgradePrice) {
        return [
          `The sickly mechanic glances at your ship. She thinks for what seems too long, until, "I can customise your ship for $${upgradePrice}."`,
          `The elderly mechanic scratches at the blister on her arm. "I can help you," she says, "if you'll help me. $${upgradePrice} and I'll improve your ship."`
        ]
      },
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
      ]
    };

    this.generateNodes();

    this.player = new Player(playerMoveRadius, playerInitialFuel, playerInitialMissiles, playerInitialCloaks, playerInitialMoney);
    this.nodes[this.player.position].visited = true;
    this.enemies = [];
    for (let i = 0; i < numInitialEnemies; i++) {
      this.enemies.push(new Enemy(2 + Math.floor(Math.random() * (this.numNodes - 2)), enemyMoveRadius)); // subtracting player and sanctuary positions
      this.enemies[i].decideNextPosition(this.nodes, this.player);
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
    this.nodes.filter((node) => node.visible).forEach((node) => {
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
    this.drawStatus();
    for (let i = 0; i < this.enemies.length; i++) {
      if (
          (calculateDistance(this.nodes[this.enemies[i].position].position, this.nodes[this.player.position].position) > this.player.sensorRadius) ||
          (this.nodes[this.player.position].effect == 'interference' && this.enemies[i].position != this.player.position && this.player.sensorLevel < 3) ||
          (this.nodes[this.enemies[i].position].effect == 'interference' && this.enemies[i].position != this.player.position && this.player.sensorLevel < 3)
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
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // omitting the first line
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
      if (rng < 0.5 + 0.05 + this.player.targetingLevel) {
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
    }

    if (this.player.missiles > 0 && collidedEnemiesIndices.length > 0) {
      this.enableMissileButton = true;
    } else {
      this.enableMissileButton = false;
    }

    if ((collidedEnemiesIndices.length > 0) && (this.enemies[collidedEnemiesIndices[collidedEnemiesIndices.length - 1]].stunDuration == 0) && (this.player.missiles == 0) && (this.player.cloaks == 0)) {
      this.state = ["lose", "collision"];
      this.processGameState();
      this.draw();
      return null;
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
        this.player.money -= this.initialPrices.buySanctuaryInfoPrice;
      } else {
        this.appendMessage(this.messageList.infoBrokerOffer, this.colorMap.specialtyNodeUnvisited);
        if (this.player.money >= this.initialPrices.buySanctuaryInfoPrice) {
          this.buttonOptions.push('Buy')
        }
      }
    }
    if (this.nodes[this.sanctuary].visible) {
      this.appendMessage(this.messageList.infoBrokerAfterOffer, this.colorMap.specialtyNodeUnvisited);
    }
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
      this.appendMessage(this.messageList.fixerAlreadyHasQuest, this.colorMap.specialtyNodeUnvisited);
    }

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

  refinery() {
    if (!('lastVisited' in this.nodes[this.player.position])) {
      this.nodes[this.player.position].buyFuelPrice = this.initialPrices.initialBuyFuelPriceRefinery;
      this.nodes[this.player.position].sellMissilePrice = this.initialPrices.initialSellMissilePriceRefinery;
      this.nodes[this.player.position].sellCloakPrice = this.initialPrices.initialSellCloakPriceRefinery;
    }
    if (!('lastVisited' in this.nodes[this.player.position]) || this.turn - this.nodes[this.player.position].lastVisited > 0) {
      this.appendMessage(this.messageList.refineryOffer(
        this.nodes[this.player.position].buyFuelPrice,
        this.nodes[this.player.position].sellMissilePrice,
        this.nodes[this.player.position].sellCloakPrice
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.fuel += 1000;
      this.player.money -= this.nodes[this.player.position].buyFuelPrice;
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'refinery'];
      this.processGameState();
    }
    if (this.player.money >= this.nodes[this.player.position].buyFuelPrice) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  armsDealer() {
    if (!('lastVisited' in this.nodes[this.player.position])) {
      this.nodes[this.player.position].buyMissilePrice = this.initialPrices.initialBuyMissilePriceArmsDealer;
      this.nodes[this.player.position].sellFuelPrice = this.initialPrices.initialSellFuelPriceArmsDealer;
      this.nodes[this.player.position].sellCloakPrice = this.initialPrices.initialSellCloakPriceArmsDealer;
    }
    if (!('lastVisited' in this.nodes[this.player.position]) || this.turn - this.nodes[this.player.position].lastVisited > 0) {
      this.appendMessage(this.messageList.armsDealerOffer(
        this.nodes[this.player.position].buyMissilePrice,
        this.nodes[this.player.position].sellFuelPrice,
        this.nodes[this.player.position].sellCloakPrice
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.missiles++;
      this.player.money -= this.nodes[this.player.position].buyMissilePrice;
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'armsDealer'];
      this.processGameState();
    }
    if (this.player.money >= this.nodes[this.player.position].buyMissilePrice) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  }

  techDealer() {
    if (!('lastVisited' in this.nodes[this.player.position])) {
      this.nodes[this.player.position].buyCloakPrice = this.initialPrices.initialBuyCloakPriceTechDealer;
      this.nodes[this.player.position].sellFuelPrice = this.initialPrices.initialSellFuelPriceTechDealer;
      this.nodes[this.player.position].sellMissilePrice = this.initialPrices.initialSellMissilePriceTechDealer;
    }
    if (!('lastVisited' in this.nodes[this.player.position]) || this.turn - this.nodes[this.player.position].lastVisited > 0) {
      this.appendMessage(this.messageList.techDealerOffer(
        this.nodes[this.player.position].buyCloakPrice,
        this.nodes[this.player.position].sellFuelPrice,
        this.nodes[this.player.position].sellMissilePrice
      ), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Buy') {
      this.player.cloaks++;
      this.player.money -= this.nodes[this.player.position].buyCloakPrice;
    } else if (this.buttonOptionClicked == 'Sell') {
      this.state = ['sell', 'techDealer'];
      this.processGameState();
    }
    if (this.player.money >= this.nodes[this.player.position].buyCloakPrice) {
      this.buttonOptions.push('Buy');
    }
    this.buttonOptions.push('Sell');

    this.nodes[this.player.position].lastVisited = this.turn;
    this.draw();
  };

  mechanic() {
    if (!('lastVisited' in this.nodes[this.player.position])) {
      this.nodes[this.player.position].upgradeCount = 0;
    }
    const upgradePrice = Math.floor(this.initialPrices.initialUpgradeCost * (1.5 ** this.nodes[this.player.position].upgradeCount) / 100 ) * 100;
    if (!('lastVisited' in this.nodes[this.player.position]) || this.turn - this.nodes[this.player.position].lastVisited > 0) {
      this.appendMessage(this.messageList.mechanicOffer(upgradePrice), this.colorMap.specialtyNodeUnvisited);
    }
    if (this.buttonOptionClicked == 'Ship upgrades') {
      this.buttonOptions = ['Engine', 'Sensor', 'Back'];
    } else if (this.buttonOptionClicked == 'Tech upgrades') {
      this.buttonOptions = ['Targeting', 'Stealth', 'Back'];
    } else if (this.buttonOptionClicked == 'Engine') {
      this.player.moveRadius += 20;
      this.player.engineLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedEngine, this.colorMap.goodMessage);
    } else if (this.buttonOptionClicked == 'Sensor') {
      this.player.sensorRadius += 3 * 20;
      this.player.sensorLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedSensor, this.colorMap.goodMessage);
    } else if (this.buttonOptionClicked == 'Targeting') {
      this.player.targetingLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedTargeting, this.colorMap.goodMessage);
    } else if (this.buttonOptionClicked == 'Stealth') {
      this.player.stealthLevel++;
      this.player.money -= upgradePrice;
      this.nodes[this.player.position].upgradeCount++;
      this.player.nextPosition = this.player.position;
      this.buttonOptionClicked = null;
      this.move();
      this.appendMessage(this.messageList.upgradedStealth, this.colorMap.goodMessage);
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

  // this function should be used immediately after a state change
  processGameState() {
    if (this.state[0] == "lose") {
      this.buttonOptions = [];
      if (this.state[1] == "collision") {
        this.appendMessage(this.messageList.loseCollision, this.colorMap.badMessage);
        this.draw()
      }
    } else if (this.state[0] == "win") {
      this.player.detectableByEnemies = false;
      this.buttonOptions = [];
      if (this.state[1] == "sanctuary") {
        this.appendMessage(this.messageList.winSanctuary, this.colorMap.safe);
        this.draw()
      }
    } else if (this.state[0] == "move") {
      this.visit();
      this.buttonOptions = ['Next turn'];
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
    } else if (this.state[0] == "collision") {
      this.collision();
    } else if (this.state[0] == "sell") {
      this.sell();
    } else { // temp: for dealing with incomplete states
      this.state = ['move', null];
      this.buttonOptions = ['Next turn'];
    }
  }

  isPositionNode(node, x, y) {
    const dist = calculateDistance(this.nodes[node].position, [x, y]);
    return (dist <= this.nodeRadius);
  }

  generateEnemy() {
    const maxEnemies = Math.min(Math.floor(this.notoriety / 2), 40);
    const prob = (maxEnemies - this.enemies.length) / (2 * maxEnemies);
    if (Math.random() < prob) {
      this.enemies.push(new Enemy(this.capital, enemyMoveRadius));
      this.enemies[this.enemies.length - 1].decideNextPosition(this.nodes, this.player);
    }
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
    if (!this.nodes[this.player.position].visited) {
      this.nodes[this.player.position].visited = true;
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
        this.notoriety++;
        this.appendMessage(this.messageList.questCompleted, this.colorMap.goodMessage);
      } else if (relevantQuests[i].questType == 'seek') {
        if (Math.random() > 0.5) {
          relevantQuests[i].completed = true;
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
  }

  move() {
    this.turn++;
    this.player.move();
    if (this.player.cloakedDuration > 0) {
      this.player.cloakedDuration--;
    } else if ((this.player.cloakedDuration == 0) && (!this.player.detectableByEnemies)) {
      this.player.detectableByEnemies = true;
    }

    if (this.nodes[this.player.position].effect == 'interference') {
      if (!('lastVisited' in this.nodes[this.player.position]) || this.nodes[this.player.position].lastVisited < this.turn - 1) {
        this.appendMessage(this.messageList.enterInterference, this.colorMap.nodeEffect);
      }
      this.nodes[this.player.position].lastVisited = this.turn;
    }

    // enemy movement
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
    }
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
    }

    this.processGameState();
    this.draw();
  }
}

let game = new Game(
  numNodes = 150,
  nodeRadius = 5,
  playerMoveRadius = 80,
  playerInitialFuel = 5000,
  playerInitialMissiles = 10,
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
gameCanvas.addEventListener('click', (e) => {
  if (game.state[0] != 'move') { return null; }
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  let positionClicked = game.findNodeByPosition(mouseX, mouseY);
  if (positionClicked != null && !(positionClicked == game.sanctuary && !game.nodes[game.sanctuary].visible)) {
    game.player.setNextPosition(positionClicked, game.nodes);
    // indicate next position
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    game.draw();
    if (game.player.nextPosition != null) {
      gameCtx.beginPath();
      gameCtx.moveTo(game.nodes[game.player.position].position[0], game.nodes[game.player.position].position[1]);
      gameCtx.lineTo(game.nodes[game.player.nextPosition].position[0], game.nodes[game.player.nextPosition].position[1]);
      gameCtx.strokeStyle = game.colorMap.player;
      gameCtx.stroke();
    }
    }
});

function processButtonOptionClick() {
  if (game.buttonOptionClicked == 'Next turn') {
    game.move();
  } else if (['Missile', 'Cloak', 'Move on', 'Buy', 'Sell', 'Sell missile',
      'Sell cloak', 'Sell 100 fuel', 'Ship upgrades', 'Tech upgrades', 'Back',
      'Engine', 'Sensor', 'Targeting', 'Stealth', 'Traverse'].includes(game.buttonOptionClicked)) {
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
  if (keyIsPressed) return; // prevent spam
  keyIsPressed = true;
  if (event.key == ' ') {
    if (game.buttonOptions.includes('Next turn')) {
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

// function to check if the mouse is over a node
function isMouseOverNode(mouseX, mouseY, nodePosition) {
  return calculateDistance([mouseX, mouseY], nodePosition) <= game.nodeRadius;
}

gameCanvas.addEventListener('mousemove', (event) => {
  const canvasRect = gameCanvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;
  tooltip.innerHTML = ``;
  let hoveredNode = null;
  game.nodes.forEach(node => {
    if (isMouseOverNode(mouseX, mouseY, node.position) && node.visible) { hoveredNode = node; }
  });
  let numEnemies = 0;
  if (hoveredNode) {
    numEnemies = game.enemies.filter((enemy) => (game.nodes[enemy.position].position == hoveredNode.position)).length;
  }
  if (hoveredNode) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
    let htmlString = ``;
    if (hoveredNode.specialty == 'sanctuary') {
      htmlString += `<span style="color:${game.colorMap.safe}">${hoveredNode.name}</span>`;
    } else if (hoveredNode.specialty == 'capital' && (hoveredNode.visited || calculateDistance(hoveredNode.position, game.nodes[game.player.position].position) <= game.player.moveRadius)) {
      htmlString += `<span style="color:${game.colorMap.capitalVisited}">${hoveredNode.name}</span>`;
    } else if (hoveredNode.visited) {
      if (hoveredNode.specialty == null) {
        if (hoveredNode.effect != null) {
          htmlString += `<span style="color:${game.colorMap.nodeEffect}">${hoveredNode.name}</span>`;
        } else {
          htmlString += `<span style="color:${game.colorMap.nodeVisited}">${hoveredNode.name}</span>`;
        }
      } else {
        htmlString += `<span style="color:${game.colorMap.specialtyNodeVisited}">${hoveredNode.name}</span>`;
      }
    } else if (numEnemies == 0) {
      tooltip.style.display = 'none';
    }
    if (game.nodes[game.player.position].position == hoveredNode.position) {
      htmlString += `<p><span style="color:${game.colorMap.player}">You</span>`
    }
    if (numEnemies > 0) {
      htmlString += `<p><span style="color:${game.colorMap.enemyPassive}">Enemies: ${numEnemies}</span>`
    }
    tooltip.innerHTML = htmlString;
  } else {
    tooltip.style.display = 'none';
  }
});
