class Market {
    constructor({
        buyers,
        meanValuation,
        sdPropValuation,
        meanArrival,
        inventoryPlayer,
        productionCostPlayer,
        meanProductionTimePlayer,
        pricePlayer,
        moneyPlayer,
        inventoryCompetitor,
        productionCostCompetitor,
        meanProductionTimeCompetitor,
        priceCompetitor,
        moneyCompetitor,
        valuationCompetitor,
        meanParameterChangeTime,
        sdParameterChange
    }) {
        this.buyers = buyers;
        this.meanValuation = meanValuation;
        this.sdPropValuation = sdPropValuation;
        this.meanArrival = meanArrival;
        this.inventoryPlayer = inventoryPlayer;
        this.productionCostPlayer = productionCostPlayer;
        this.meanProductionTimePlayer = meanProductionTimePlayer;
        this.pricePlayer = pricePlayer;
        this.moneyPlayer = moneyPlayer;
        this.inventoryCompetitor = inventoryCompetitor;
        this.productionCostCompetitor = productionCostCompetitor;
        this.meanProductionTimeCompetitor = meanProductionTimeCompetitor;
        this.priceCompetitor = priceCompetitor;
        this.moneyCompetitor = moneyCompetitor;
        this.valuationCompetitor = valuationCompetitor;
        this.meanParameterChangeTime = meanParameterChangeTime;
        this.sdParameterChange = sdParameterChange;
        this.valuations = Array.from({ length: this.buyers }, () => d3.randomNormal(this.meanValuation, this.meanValuation * this.sdPropValuation)());
        this.meanShiftMeanValuation = 0;
        this.meanShiftMeanArrival = 0;
        this.meanShiftMeanProductionTimePlayer = 0;
        this.eventHistory = [[Date.now(), "start"]];
        this.eventQueue = new Array();
        this.isProducingPlayer = true;
        this.updateEventQueue();
    }

    generateExponential(mean) {
        return - mean * Math.log(Math.random());
    }

    generateLogNormal(mean, sd) {
        return Math.exp(mean + sd * d3.randomNormal()());
    }

    // Getter methods
    getBuyers() { return this.buyers; }
    getMeanArrival() { return this.meanArrival; }
    getMeanValuation() { return this.meanValuation; }
    getValuations() { return this.valuations; }
    getMoneyPlayer() { return this.moneyPlayer; }
    getMoneyCompetitor() { return this.moneyCompetitor; }
    getMeanProductionTimePlayer() { return this.meanProductionTimePlayer; }
    getMeanProductionTimeCompetitor() { return this.meanProductionTimeCompetitor; }
    getProductionCostPlayer() { return this.productionCostPlayer; }
    getProductionCostCompetitor() { return this.productionCostCompetitor; }
    getInventoryPlayer() { return this.inventoryPlayer; }
    getInventoryCompetitor() { return this.inventoryCompetitor; }
    getValuationCompetitor() { return this.valuationCompetitor; }
    getPricePlayer() { return this.pricePlayer; }
    getPriceCompetitor() { return this.priceCompetitor; }
    getIsProducingPlayer() { return this.isProducingPlayer; }

    // Setters and toggles
    toggleIsProducingPlayer() { this.isProducingPlayer = !this.isProducingPlayer; }
    setPricePlayer(price) { this.pricePlayer = price; }

    // Event management
    updateEventQueue() {
        let events = this.eventQueue.map(event => event[1]);
        
        if (!events.includes("arrival")) {
            this.eventQueue.push([Date.now() + 1000 * this.generateExponential(this.meanArrival), "arrival"]);
        }

        if (!events.includes("production_player") && this.isProducingPlayer && this.moneyPlayer >= this.productionCostPlayer) {
            this.eventQueue.push([Date.now() + 1000 * this.generateExponential(this.meanProductionTimePlayer), "production_player"]);
        }

        if (!events.includes("production_competitor") && this.inventoryCompetitor < 1000 && this.moneyCompetitor >= this.productionCostCompetitor) {
            this.eventQueue.push([Date.now() + 1000 * this.generateExponential(this.meanProductionTimeCompetitor), "production_competitor"]);
        }

        if (!events.includes("sale_competitor_from_player") && this.hasInventoryPlayer(1) && this.pricePlayer != null && Math.min(this.moneyCompetitor, this.valuationCompetitor) >= this.pricePlayer) {
            this.eventQueue.push([Date.now() + 1000 * this.generateExponential(10 ** (2 - (this.valuationCompetitor / this.pricePlayer))), "sale_competitor_from_player"]);
        }

        if (!events.includes("sale_buyer_from_competitor") && this.hasInventoryCompetitor(1) && this.generateTimeToPurchase(this.priceCompetitor) != null) {
            this.eventQueue.push([Date.now() + 1000 * this.generateTimeToPurchase(this.priceCompetitor), "sale_buyer_from_competitor"]);
        }

        if (!events.includes("sale_buyer_from_player") && this.hasInventoryPlayer(1) && this.pricePlayer != null && this.generateTimeToPurchase(this.pricePlayer) != null) {
            this.eventQueue.push([Date.now() + 1000 * this.generateTimeToPurchase(this.pricePlayer), "sale_buyer_from_player"]);
        }

        if (!events.includes("parameter_shift")) {
            this.eventQueue.push([Date.now() + 1000 * this.generateExponential(this.meanParameterChangeTime), "parameter_shift"]);
        }

        this.eventQueue = this.eventQueue.sort(function(a, b) { return a[0] - b[0] })
    }

    executeEvent() {
        if (this.eventQueue.length == 0 || Date.now() < this.eventQueue[0][0]) return null;
        const event = this.eventQueue.shift()[1];
        this.eventHistory.push([new Date().toISOString(), event]);

        switch (event) {
            case "arrival":
                this.incrementBuyers();
                break;
            case "production_player":
                if (this.isProducingPlayer && this.moneyPlayer >= this.productionCostPlayer) {
                    this.shiftMoneyPlayer(-Math.round(this.productionCostPlayer));
                    this.shiftInventoryPlayer(1);
                }
                break;
            case "production_competitor":
                if (this.moneyCompetitor >= this.productionCostCompetitor) {
                    this.shiftMoneyCompetitor(-Math.round(this.productionCostCompetitor));
                    this.shiftInventoryCompetitor(1);
                }
                break;
            case "sale_competitor_from_player":
                if (this.hasInventoryPlayer(1) && this.pricePlayer != null && Math.min(this.moneyCompetitor, this.valuationCompetitor) >= this.pricePlayer) {
                    this.shiftInventoryCompetitor(1);
                    this.shiftInventoryPlayer(-1);
                    this.shiftMoneyCompetitor(-this.pricePlayer);
                    this.shiftMoneyPlayer(this.pricePlayer);
                }
                break;
            case "sale_buyer_from_competitor":
                if (this.hasInventoryCompetitor(1) && this.generateTimeToPurchase(this.priceCompetitor)) {
                    this.shiftInventoryCompetitor(-1);
                    this.removeBuyer(this.whichBuyer(this.priceCompetitor));
                    this.shiftMoneyCompetitor(this.priceCompetitor);
                }
                break;
            case "sale_buyer_from_player":
                if (this.hasInventoryPlayer(1) && this.pricePlayer != null && this.generateTimeToPurchase(this.pricePlayer)) {
                    this.shiftInventoryPlayer(-1);
                    this.removeBuyer(this.whichBuyer(this.pricePlayer));
                    this.shiftMoneyPlayer(this.pricePlayer);
                }
                break;
            case "parameter_shift":
                this.handleParameterShift();
                break;
        }
    }

    incrementBuyers() {
        this.buyers += 1;
        this.valuations.push(d3.randomNormal(this.meanValuation, this.meanValuation * this.sdPropValuation)());
    }

    // Placeholder methods to simulate behaviors
    hasInventoryPlayer(amount) { return this.inventoryPlayer >= amount; }
    hasInventoryCompetitor(amount) { return this.inventoryCompetitor >= amount; }

    generateTimeToPurchase(price) {
        // uses the property that min(Exp(a), Exp(b)) ~ Exp(1 / (1 / a + 1 / b))
        // a buyer only buys if v > p
        // mean purchase time of a buyer is 10^(2 - v/p) seconds
        let meanTimesToPurchase = this.valuations.filter(valuation => valuation >= price);
        if (meanTimesToPurchase.length == 0) { return null; };
        meanTimesToPurchase = meanTimesToPurchase.map(valuation => Math.pow(10, 2 - (valuation / price)));
        const meanTime = 1 / meanTimesToPurchase.reduce((acc, value) => acc + (1 / value), 0);
        return this.generateExponential(meanTime);
    }

    whichBuyer(price) {
        // Get valid buyers: indices where valuations are greater than price
        const validBuyers = this.valuations
            .map((valuation, index) => (valuation > price ? index : -1))
            .filter(index => index !== -1);
    
        // Calculate mean_times_to_purchase: 10 ** (2 - (valuation / price))
        const meanTimesToPurchase = validBuyers.map(index => Math.pow(10, 2 - (this.valuations[index] / price)));
    
        // Calculate the probability distribution: 1 / mean_times_to_purchase
        const probabilities = meanTimesToPurchase.map(time => 1 / time);
    
        // Normalize the probabilities so they sum to 1
        const sumOfProbabilities = probabilities.reduce((acc, prob) => acc + prob, 0);
        const normalisedProbabilities = probabilities.map(prob => prob / sumOfProbabilities);
    
        // Select a buyer based on the normalized probabilities
        const randomValue = Math.random();
        let cumulativeProbability = 0;
        for (let i = 0; i < validBuyers.length; i++) {
            cumulativeProbability += normalisedProbabilities[i];
            if (randomValue <= cumulativeProbability) {
                return validBuyers[i];
            }
        }
    
        // Default return in case of error (should not reach this point)
        return null;
    }
    
    removeBuyer(index) { this.buyers -= 1; this.valuations.splice(index, 1); }
    shiftMeanArrival(prop) { this.meanArrival *= prop; }
    shiftMoneyPlayer(delta) { this.moneyPlayer = Math.max(this.moneyPlayer + delta, 0); }
    shiftInventoryPlayer(delta) { this.inventoryPlayer += delta; }
    shiftMoneyCompetitor(delta) { this.moneyCompetitor = Math.max(this.moneyCompetitor + delta, 0); }
    shiftInventoryCompetitor(delta) { this.inventoryCompetitor += delta; }
    shiftPriceCompetitor(prop) { this.priceCompetitor = Math.round(Math.max(this.priceCompetitor * prop, this.productionCostCompetitor)); }
    shiftMeanProductionTimeCompetitor(prop) { this.meanProductionTimeCompetitor *= prop; }
    shiftMeanProductionTimePlayer(prop) { this.meanProductionTimePlayer *= prop; }
    shiftMeanValuation(prop) { this.meanValuation *= prop; }
    shiftValuations(prop) { this.valuations = this.valuations.map(element => element * prop); }
    shiftValuationCompetitor(prop) { this.valuationCompetitor *= prop; }
    shiftProductionCostPlayer(prop) { this.productionCostPlayer *= prop; }
    shiftProductionCostCompetitor(prop) { this.productionCostCompetitor *= prop; }
    shiftMeanShiftProductionTimePlayer(delta) { this.meanShiftMeanProductionTimePlayer += delta; }
    shiftMeanShiftMeanArrival(delta) { this.meanShiftMeanArrival += delta; }
    shiftMeanShiftMeanValuation(delta) { this.meanShiftMeanValuation += delta; }
    shiftMeanParameterChangeTime(prop) { this.meanParameterChangeTime *= prop; }
    shiftSdParameterChange(prop) { this.sdParameterChange *= prop; }

    // Parameter shift handling (implement logic similar to Python)
    handleParameterShift() {
        const shiftEvents = [
            "shift_mean_arrival",
            "shift_price_competitor",
            "shift_mean_production_time_competitor",
            "shift_mean_production_time_player",
            "shift_valuations",
            "shift_mean_valuation",
            "shift_valuation_competitor",
            "shift_production_cost_player",
            "shift_production_cost_competitor"
        ]
        let shiftEvent = _.sample(shiftEvents);
        switch (shiftEvent) {
            case "shift_mean_arrival":
                this.shiftMeanArrival(this.generateLogNormal(this.meanShiftMeanArrival, this.sdParameterChange));
                break;
            
            case "shift_price_competitor":
                if (Math.random() < Math.min(2 / Math.sqrt(Math.max(this.inventoryCompetitor, 1)), 1)) {
                    this.shiftPriceCompetitor(this.generateLogNormal(0.165, this.sdParameterChange));
                } else if (Math.random() < Math.min(2 / Math.sqrt(Math.max(1000 - this.inventoryCompetitor, 1)), 1)) {
                    this.shiftPriceCompetitor(this.generateLogNormal(-0.165, this.sdParameterChange));
                } else {
                    this.shiftPriceCompetitor(this.generateLogNormal(0, this.sdParameterChange));
                }
                break;

            case "shift_mean_production_time_competitor":
                this.shiftMeanProductionTimeCompetitor(this.generateLogNormal(0, this.sdParameterChange));
                break;
            
            case "shift_mean_production_time_player":
                this.shiftMeanProductionTimePlayer(this.generateLogNormal(this.meanShiftMeanProductionTimePlayer, this.sdParameterChange));
                break;

            case "shift_mean_valuation":
                this.shiftMeanValuation(this.generateLogNormal(this.meanShiftMeanValuation, this.sdParameterChange));
                break;

            case "shift_valuation_competitor":
                // slightly positive to "push" low-valuation buyers
                this.shiftValuations(this.generateLogNormal(0.005, this.sdParameterChange));
                break;
            
            case "shift_valuation_competitor":
                this.shiftValuationCompetitor(this.generateLogNormal(this.meanShiftMeanValuation, this.sdParameterChange));
                this.valuationCompetitor = Math.max(Math.min(this.valuationCompetitor, this.meanValuation * 1.5), this.meanValuation / 1.5);
                break;

            case "shift_production_cost_player":
                this.shiftProductionCostPlayer(this.generateLogNormal(0, this.sdParameterChange));
                break;

            case "shift_production_cost_competitor":
                this.shiftProductionCostCompetitor(this.generateLogNormal(0, this.sdParameterChange));
                break;
        }
    }

    salePlayerFromCompetitor(amount) {
        let buyAmount = Math.min(amount, this.inventoryCompetitor);
        let price = buyAmount * this.priceCompetitor;
        if (this.moneyPlayer > price) {
            this.shiftInventoryCompetitor(-buyAmount);
            this.shiftInventoryPlayer(buyAmount);
            this.shiftMoneyCompetitor(price);
            this.shiftMoneyPlayer(-price);
        }
    }

    change_price_player(price) {
        this.setPricePlayer(price);
        this.eventQueue = this.eventQueue.filter(item => ["sale_buyer_from_player", "sale_competitor_from_player"].includes(item[1]));
    }
}


class Game {
    constructor(market) {
        this.startTime = Date.now();
        this.market = market;
        this.messageDisappearTime = 5000;
        this.moneyGoal = 1000000;
        this.moneyGoalReached = false;
        
        // Upgrade parameters
        this.supplyInfoLevel = 0; // 1 -> comp money & inventory, 2 -> production time
        this.demandInfoLevel = 0; // 1 -> arrival time & mean valuation, 2 -> valuation distribution
        this.productionTimeUpgradeCounter = 0;
        this.productionCostUpgradeCounter = 0;
        this.meanArrivalUpgradeCounter = 0;
        this.meanValuationUpgradeCounter = 0;
        this.parameterUpgradeCounter = 0;
        this.showUpgradeSupplyInfo = false;
        this.showUpgradeDemandInfo = false;
        this.upgradeSupplyInfoCost = [10000, 20000];
        this.upgradeSupplyInfoButtonText = ["Corporate espionage: $10000", "Operations research: $20000", "Supply-side upgrades unlocked"];
        this.upgradeDemandInfoCost = [30000, 50000];
        this.upgradeDemandInfoButtonText = ["Hire consultants: $30000", "Surveillance capitalism: $50000", "Demand-side upgrades unlocked"];
        
        this.dataMoneyPlayer = []; // player's money history
        this.dataValuations = [];

        this.messageQueue = []; // Queue of messages to display, in the form of (messageTime, message)

        this.init();
    }

    init() {
        // Initialize event listeners
        document.getElementById("set-price-button").addEventListener("click", this.setPricePlayer.bind(this));
        document.getElementById("toggle-production-button").addEventListener("click", this.toggleProductionPlayer.bind(this));
        document.getElementById("buy-button").addEventListener("click", this.buyFromCompetitor.bind(this));
        document.getElementById("upgrade-supply-info").addEventListener("click", this.upgradeSupplyInfo.bind(this));
        document.getElementById("upgrade-demand-info").addEventListener("click", this.upgradeDemandInfo.bind(this));
        document.getElementById("upgrade-mean-production-time").addEventListener("click", this.upgradeProductionTime.bind(this));
        document.getElementById("upgrade-production-cost").addEventListener("click", this.upgradeProductionCost.bind(this));
        document.getElementById("upgrade-mean-arrival").addEventListener("click", this.upgradeMeanArrival.bind(this));
        document.getElementById("upgrade-mean-valuation").addEventListener("click", this.upgradeMeanValuation.bind(this));
        
        setInterval(() => {
            this.updateMarket();
        }, 50);

        setInterval(() => {
            this.updateGUI();
            this.updatePlots();
        }, 100);
    }

    setPricePlayer() {
        const newPrice = Math.round(parseFloat(document.getElementById("new-price-player").value));
        if (!(newPrice <= 0 || isNaN(newPrice))) { this.market.pricePlayer = newPrice; }
    }

    toggleProductionPlayer() { this.market.toggleIsProducingPlayer(); }

    buyFromCompetitor() {
        const amountToBuy = parseInt(document.getElementById("buy-amount").value);
        if (!(isNaN(amountToBuy) || amountToBuy <= 0)) { this.market.salePlayerFromCompetitor(amountToBuy); }
    }

    upgradeSupplyInfo() {
        const price = this.upgradeSupplyInfoCost[Math.min(this.supplyInfoLevel, 1)];
        this.market.shiftMoneyPlayer(-price);
        this.supplyInfoLevel += 1;
        this.queueMessage(`Supply intel upgraded!`)
    }

    upgradeDemandInfo() {
        const price = this.upgradeDemandInfoCost[Math.min(this.demandInfoLevel, 1)];
        this.market.shiftMoneyPlayer(-price);
        this.demandInfoLevel += 1;
        this.queueMessage(`Demand intel upgraded!`)
    }

    upgradeProductionTime() {
        const price = 20000 * (2 ** this.productionTimeUpgradeCounter);
        this.market.shiftMoneyPlayer(-price);
        this.market.shiftMeanProductionTimePlayer(1 / 1.5);
        this.market.shiftMeanShiftProductionTimePlayer(-0.005);
        this.productionTimeUpgradeCounter += 1;
        this.parameterUpgradeCounter += 1;
        this.queueMessage(`New offshore production facilities established!`)
        this.increaseMarketVolatility();
    }

    upgradeProductionCost() {
        const price = 20000 * (2 ** this.productionCostUpgradeCounter);
        this.market.shiftMoneyPlayer(-price);
        this.market.shiftProductionCostPlayer(0.5);
        this.productionCostUpgradeCounter += 1;
        this.parameterUpgradeCounter += 1;
        this.queueMessage(`Consumer and labour regulations have been slashed!`)
        this.increaseMarketVolatility();
    }

    upgradeMeanArrival() {
        const price = 50000 * (2 ** this.meanArrivalUpgradeCounter);
        this.market.shiftMoneyPlayer(-price);
        this.market.shiftMeanArrival(1 / 1.5);
        this.market.shiftMeanShiftMeanArrival(-0.005);
        this.meanArrivalUpgradeCounter += 1;
        this.parameterUpgradeCounter += 1;
        this.queueMessage(`The market has artificially expanded!`)
        this.increaseMarketVolatility();
    }

    upgradeMeanValuation() {
        const price = 50000 * (2 ** this.meanValuationUpgradeCounter);
        this.market.shiftMoneyPlayer(-price);
        this.market.shiftMeanValuation(1.25);
        this.market.shiftMeanShiftMeanValuation(0.005);
        this.meanValuationUpgradeCounter += 1;
        this.parameterUpgradeCounter += 1;
        this.queueMessage(`The population has become more addicted!`)
        this.increaseMarketVolatility();
    }

    increaseMarketVolatility() {
        // half time to parameter shift and 1.5x parameter sd
        if (this.parameterUpgradeCounter % 4 == 0) {
            this.market.shiftMeanParameterChangeTime(0.5);
            this.market.shiftSdParameterChange(1.5);
            this.queueMessage(`The economy has become less stable!`)
        }
    }

    updateMarket() {
        this.market.executeEvent();
        this.market.updateEventQueue();
    }

    queueMessage(message) {
        if (this.messageQueue.length == 0) {
            this.messageQueue.push([Date.now(), Date.now() + this.messageDisappearTime, message])
        } else {
            const latestMessageEvent = this.messageQueue[this.messageQueue.length - 1];
            this.messageQueue.push([latestMessageEvent[1] + 1, latestMessageEvent[1] + this.messageDisappearTime, message])
        }

    }

    showNextMessage() {
        if (this.messageQueue.length == 0) {
            document.getElementById("message").textContent = ``;
            return null;
        }
        const messageEvent = this.messageQueue[0]
        if ((Date.now() >= messageEvent[0]) && (Date.now() < messageEvent[1])) {
            document.getElementById("message").textContent = messageEvent[2];
        } else if (Date.now() >= messageEvent[1]) {
            this.messageQueue.shift()
        }
    }

    updateGUI() {
        let elapsedTime = (Date.now() - this.startTime) / 1000; // Convert to seconds
        let hours = Math.floor(elapsedTime / 3600);
        let minutes = Math.floor((elapsedTime % 3600) / 60);
        document.getElementById("time").textContent = `${hours}h ${minutes}m`;

        // Updating info
        document.getElementById("money-player").textContent = `Your money: $${this.market.getMoneyPlayer()}`;
        document.getElementById("inventory-player").textContent = `Your inventory: ${this.market.getInventoryPlayer()}`;
        document.getElementById("mean-production-time-player").textContent = `Your mean production time: ${this.market.getMeanProductionTimePlayer().toFixed(2)}s`;
        document.getElementById("production-cost-player").textContent = `Your production cost: $${Math.round(this.market.getProductionCostPlayer())}`;
        document.getElementById("price-player").textContent = `Your price $${this.market.getPricePlayer()}`;
        document.getElementById("money-competitor").textContent = `Competitor's money: $${this.market.getMoneyCompetitor()}`;
        document.getElementById("inventory-competitor").textContent = `Competitor's inventory: ${this.market.getInventoryCompetitor()}`;
        document.getElementById("mean-production-time-competitor").textContent = `Competitor's mean production time: ${this.market.getMeanProductionTimeCompetitor().toFixed(2)}s`;
        document.getElementById("production-cost-competitor").textContent = `Competitor's production cost: $${Math.round(this.market.getProductionCostCompetitor())}`;
        document.getElementById("price-competitor").textContent = `Competitor's price: $${this.market.getPriceCompetitor()}`;
        document.getElementById("buyers").textContent = `Buyers: ${this.market.getBuyers()}`;
        document.getElementById("mean-arrival").textContent = `Mean arrival time: ${this.market.getMeanArrival().toFixed(2)}s`;
        document.getElementById("mean-valuation").textContent = `Mean valuation: $${Math.round(this.market.getMeanValuation())}`;

        if (this.market.getIsProducingPlayer()) {
            document.getElementById("toggle-production-button").textContent = `Pause production`;
        } else {
            document.getElementById("toggle-production-button").textContent = `Resume production`;
        }

        // Upgrades
        if ((!this.showUpgradeSupplyInfo) && (this.market.getMoneyPlayer() >= 5000)) {
            this.showUpgradeSupplyInfo = true;
            document.getElementById("upgrade-supply-info").style.display = 'block';
        }

        if ((!this.showDemandSupplyInfo) && (this.market.getMoneyPlayer() >= 10000)) {
            this.showUpgradeDemandInfo = true;
            document.getElementById("upgrade-demand-info").style.display = 'block';
        }

        if (this.supplyInfoLevel >= 1) {
            document.getElementById("money-competitor").style.display = 'block';
            document.getElementById("inventory-competitor").style.display = 'block';
            document.getElementById("production-cost-competitor").style.display = 'block';
        }

        if (this.supplyInfoLevel >= 2) {
            document.getElementById("mean-production-time-player").style.display = 'block';
            document.getElementById("mean-production-time-competitor").style.display = 'block';
            document.getElementById("upgrade-supply-info").style.display = 'none';
            document.getElementById("upgrade-mean-production-time").style.display = 'block';
            document.getElementById("upgrade-production-cost").style.display = 'block';
        }

        if (this.demandInfoLevel >= 1) {
            document.getElementById("mean-arrival").style.display = 'block';
            document.getElementById("mean-valuation").style.display = 'block';
        }

        if (this.demandInfoLevel >= 2) {
            document.getElementById("valuationsPlot").style.display = 'flex';
            document.getElementById("upgrade-demand-info").style.display = 'none';
            document.getElementById("upgrade-mean-arrival").style.display = 'block';
            document.getElementById("upgrade-mean-valuation").style.display = 'block';
        }

        document.getElementById("upgrade-supply-info").disabled = ((this.supplyInfoLevel >= 2) || (this.market.getMoneyPlayer() < this.upgradeSupplyInfoCost[Math.min(this.supplyInfoLevel, 1)]));
        document.getElementById("upgrade-supply-info").textContent = this.upgradeSupplyInfoButtonText[this.supplyInfoLevel];
        document.getElementById("upgrade-demand-info").disabled = ((this.demandInfoLevel >= 2) || (this.market.getMoneyPlayer() < this.upgradeDemandInfoCost[Math.min(this.demandInfoLevel, 1)]));
        document.getElementById("upgrade-demand-info").textContent = this.upgradeDemandInfoButtonText[this.demandInfoLevel];
        document.getElementById("upgrade-mean-production-time").textContent = `Offshore production: $${20000 * (2 ** this.productionTimeUpgradeCounter)}`;
        document.getElementById("upgrade-mean-production-time").disabled = this.market.getMoneyPlayer() < 20000 * (2 ** this.productionTimeUpgradeCounter);
        document.getElementById("upgrade-production-cost").textContent = `Lobby for deregulation: $${20000 * (2 ** this.productionCostUpgradeCounter)}`;
        document.getElementById("upgrade-production-cost").disabled = this.market.getMoneyPlayer() < 20000 * (2 ** this.productionCostUpgradeCounter);
        document.getElementById("upgrade-mean-arrival").textContent = `Corporate propaganda: $${50000 * (2 ** this.meanArrivalUpgradeCounter)}`;
        document.getElementById("upgrade-mean-arrival").disabled = this.market.getMoneyPlayer() < 50000 * (2 ** this.meanArrivalUpgradeCounter);
        document.getElementById("upgrade-mean-valuation").textContent = `Addictive gamification: $${50000 * (2 ** this.meanValuationUpgradeCounter)}`;
        document.getElementById("upgrade-mean-valuation").disabled = this.market.getMoneyPlayer() < 50000 * (2 ** this.meanValuationUpgradeCounter);

        // victory message
        if ((!this.moneyGoalReached) & (this.market.getMoneyPlayer() >= this.moneyGoal)) {
            this.moneyGoalReached = true;
            this.queueMessage(`Congratulations! You've reached $${this.moneyGoal}. But at what cost...?`)
            alert(`Congratulations! You've reached $${this.moneyGoal}. But at what cost...?`);
        }

        this.showNextMessage() // showing the next queued message if the timing is right
    }

    updatePlots() {
        // Update the money plot
        this.dataMoneyPlayer.push(this.market.getMoneyPlayer());

        if (this.dataMoneyPlayer.length > 1000) {this.dataMoneyPlayer.shift()}
    
       // Create x-axis labels as indices based on the length of the data
        let xValues = Array.from({ length: this.dataMoneyPlayer.length }, (_, i) => i);

        // Create a trace for the chart
        let data = [{
            x: xValues,
            y: this.dataMoneyPlayer,
            type: 'scatter',
            mode: 'lines',  // You can change this to 'lines' if you don't want markers
            name: 'Money Player',
            line: {
                color: '#0AF54E'
            }
        }];
        
        let layout = {
            title: '',
            xaxis: {
                title: '',
                showticks: false,  // Remove x-axis ticks
                showticklabels: false, // Remove tick labels
                showline: false       // Optionally, remove the axis line itself
            },
            yaxis: {
                title: '$',
                showline: false
            },
            margin: {
                l: 50,  // Left margin
                r: 50,  // Right margin (reduce to shrink space)
                t: 50,  // Top margin (reduce to shrink space)
                b: 50,  // Bottom margin (reduce to shrink space)
            },
            showlegend: false,
            displayModeBar: false,
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
        };

        // Check if 'moneyPlot' exists and then plot the data
        let moneyPlot = document.getElementById('moneyPlot');
        if (moneyPlot) {
            Plotly.newPlot(moneyPlot, data, layout);
        } else {
            console.error('Chart container with id "moneyPlot" not found.');
        }

        // Create the second plot for the density of valuations
        this.dataValuations = this.market.getValuations()

        let densityData = [{
            x: this.dataValuations,  // Assuming this is the array containing valuation data
            type: 'histogram',
            marker: {
                color: '#0AB1F5' // Set the color of the bars
              },
            histnorm: 'probability density',  // Normalize to get density
            name: 'Buyer valuations',
            nbinsx: 100,  // Number of bins, adjust as needed
            opacity: 0.75,  // Adjust opacity for better visualization
        }];
        
        let densityLayout = {
            title: '',
            xaxis: {
                title: 'Valuation',
                showticks: true,
                showticklabels: true,
                showline: true,
            },
            yaxis: {
                title: 'Density',
                showline: false,
            },
            margin: {
                l: 50,  // Left margin
                r: 50,  // Right margin (reduce to shrink space)
                t: 50,  // Top margin (reduce to shrink space)
                b: 50,  // Bottom margin (reduce to shrink space)
            },
            showlegend: false,
            displayModeBar: false,
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
        };

        // Check if 'valuationsPlot' exists and then plot the data for the density
        let valuationsPlot = document.getElementById('valuationsPlot');
        if (valuationsPlot) {
            Plotly.newPlot(valuationsPlot, densityData, densityLayout);
        } else {
            console.error('Chart container with id "valuationsPlot" not found.');
        }

    }
    


}

// Create market simulation instance
const market = new Market({
    buyers: 500,
    meanValuation: 40,
    sdPropValuation: 0.25,
    meanArrival: 1,
    inventoryPlayer: 100,
    productionCostPlayer: 20,
    meanProductionTimePlayer: 4,
    pricePlayer: 60,
    moneyPlayer: 500,
    inventoryCompetitor: 500,
    productionCostCompetitor: 10,
    meanProductionTimeCompetitor: 2,
    priceCompetitor: 60,
    moneyCompetitor: 1000,
    valuationCompetitor: 40,
    meanParameterChangeTime: 3,
    sdParameterChange: 0.05
});
const game = new Game(market);
