/** @param {NS} ns **/
//import {defaultServerList} from "serverList.js"
var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})

// These options are needed to round to whole numbers if that's what you want.
//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)

const buy_money = false

export async function main(ns) {
    ns.disableLog("sleep")
    
    while (true) {
        ns.clearLog()
        if(buy_money)ns.hacknet.spendHashes("Sell for Money");
        ns.print("this script is not yet fully tested")
        ns.print("you own: " + ns.hacknet.numNodes() + " of " + ns.hacknet.maxNumNodes() + " possible nodes.")
        ns.print("currently stored hashes: " + ns.hacknet.numHashes() + " capacity: " + ns.hacknet.hashCapacity())
        if (ns.hacknet.maxNumNodes == 0) exitScript(ns, 1)
        let upgrade = bestServerAndUpgrade(ns)
        ns.print("Server ID: " + upgrade.id)
        ns.print("Upgrade type: " + upgrade.upgrade.type)
        ns.print("Upgrade cost: " + formatter.format(upgrade.upgrade.price))
        ns.print("Upgrade cost per 1 hash/sec: " + formatter.format(upgrade.upgrade.costPerHash))
        await buyUpgrade(ns, upgrade)
        await ns.sleep(1000)
    }
}
function buyUpgrade(ns, upgrade) {
    if (upgrade.id == -1) exitScript(ns, 2)
    else if (upgrade.upgrade.type == "buy_new_server") ns.hacknet.purchaseNode()
    else if (upgrade.upgrade.type == "core")ns.hacknet.upgradeCore(upgrade.id, 1)
    else if (upgrade.upgrade.type == "level") ns.hacknet.upgradeLevel(upgrade.id, 1)
    else if (upgrade.upgrade.type == "ram") ns.hacknet.upgradeRam(upgrade.id, 1);
}

function exitScript(ns, exitCode) {
    if (exitCode == 1) ns.print("there are no hacknet nodes allowed on this run!");
    if (exitCode == 2) ns.tprint("no more upgrades availible exiting advHacknet.js");

    exit();
}
function bestServerAndUpgrade(ns) {
    let bestServer = {}
    bestServer.id = -1
    bestServer.upgrade = {}
    bestServer.upgrade.type = ""
    bestServer.upgrade.price = Infinity
    bestServer.upgrade.costPerHash = Infinity

    if (ns.hacknet.numNodes() == 0 )ns.hacknet.purchaseNode()
    if (ns.hacknet.numNodes() <  ns.hacknet.maxNumNodes()) {
        bestServer.id = -2
        bestServer.upgrade.type = "buy_new_server"
        bestServer.upgrade.price = getNewServCost(ns)
        bestServer.upgrade.costPerHash = getNewServCost(ns) / newServerHashRate(ns)
    }
    for (let i = 0; i < ns.hacknet.numNodes(); i++){
        let tempServer = {}
        tempServer.id = i;
        tempServer.upgrade = getBestUpgrade(ns, ns.hacknet.getNodeStats(i))
        if (tempServer.upgrade.costPerHash < bestServer.upgrade.costPerHash) bestServer = tempServer;
    }
    return bestServer
}

function getNewServCost(ns) {
    let n = ns.hacknet.numNodes()+1
    //ns.print("getting new server cost for server: " + n)
    return ns.formulas.hacknetServers.hacknetServerCost(n, ns.getPlayer().hacknet_node_purchase_cost_mult)
}

function getBestUpgrade(ns, hacknetNodeStats) {
    let bestUpgrade = {}
    bestUpgrade.type = ""
    bestUpgrade.price = Infinity
    bestUpgrade.costPerHash = Infinity

    let corePricePerHash = CoreUpgradePricePerHash(ns, hacknetNodeStats)
    //ns.print("CorePricePerHash: " + formatter.format(corePricePerHash))
    if (corePricePerHash < bestUpgrade.costPerHash) {
        bestUpgrade.type = "core"
        bestUpgrade.price = coreUpgradePrice(ns, hacknetNodeStats)
        bestUpgrade.costPerHash = corePricePerHash
    }

    let lvlPricePerHash = LevelUpgradePricePerHash(ns, hacknetNodeStats)
    //ns.print("lvlPricePerHash: " + formatter.format(lvlPricePerHash))
    if (lvlPricePerHash < bestUpgrade.costPerHash) {
        bestUpgrade.type = "level"
        bestUpgrade.price = levelUpgradePrice(ns,hacknetNodeStats)
        bestUpgrade.costPerHash = lvlPricePerHash
    }

    let ramPricePerHash = RamUpgradePricePerHash(ns, hacknetNodeStats)
    //ns.print("ramPricePerHash: " + formatter.format(ramPricePerHash))
    if (ramPricePerHash < bestUpgrade.costPerHash) {
        bestUpgrade.type = "ram"
        bestUpgrade.price = ramUpgradePrice(ns,hacknetNodeStats)
        bestUpgrade.costPerHash = ramPricePerHash
    }
    return bestUpgrade
}
//need to check price == infinity
function coreUpgradePrice(ns, hacknetNodeStats) {
    return ns.formulas.hacknetServers.coreUpgradeCost(hacknetNodeStats.cores, 1, ns.getPlayer().hacknet_node_core_cost_mult)
}
function CoreUpgradePricePerHash(ns, hacknetNodeStats) {

    let current = CurrentHashRate(ns, hacknetNodeStats)
    let price = coreUpgradePrice(ns,hacknetNodeStats)
    let newHash = ns.formulas.hacknetServers.hashGainRate(
        hacknetNodeStats.level,
        hacknetNodeStats.ramUsed,
        hacknetNodeStats.ram,
        hacknetNodeStats.cores + 1,
        ns.getPlayer().hacknet_node_money_mult
    )
    let change = newHash - current;
    return price / change
}

function levelUpgradePrice(ns, hacknetNodeStats) {
    return ns.formulas.hacknetServers.levelUpgradeCost(hacknetNodeStats.level, 1, ns.getPlayer().hacknet_node_level_cost_mult)
}
function LevelUpgradePricePerHash(ns, hacknetNodeStats) {
    let current = CurrentHashRate(ns, hacknetNodeStats)
    let price = levelUpgradePrice(ns,hacknetNodeStats)
    let newHash = ns.formulas.hacknetServers.hashGainRate(
        hacknetNodeStats.level + 1,
        hacknetNodeStats.ramUsed,
        hacknetNodeStats.ram,
        hacknetNodeStats.cores,
        ns.getPlayer().hacknet_node_money_mult
    )
    let change = newHash - current;
    return price / change
}

function ramUpgradePrice(ns, hacknetNodeStats) {
    return ns.formulas.hacknetServers.ramUpgradeCost(hacknetNodeStats.ram, 1, ns.getPlayer().hacknet_node_ram_cost_mult)
}
function RamUpgradePricePerHash(ns, hacknetNodeStats) {
    let current = CurrentHashRate(ns, hacknetNodeStats)
    let price = ramUpgradePrice(ns, hacknetNodeStats)
    let newHash = ns.formulas.hacknetServers.hashGainRate(
        hacknetNodeStats.level,
        hacknetNodeStats.ramUsed,
        hacknetNodeStats.ram * 2,
        hacknetNodeStats.cores,
        ns.getPlayer().hacknet_node_money_mult
    )
    let change = newHash - current;
    return price / change
}

function CurrentHashRate(ns, hacknetNodeStats) {
    return ns.formulas.hacknetServers.hashGainRate(
        hacknetNodeStats.level,
        hacknetNodeStats.ramUsed,
        hacknetNodeStats.ram,
        hacknetNodeStats.cores,
        ns.getPlayer().hacknet_node_money_mult
    )
}
function newServerHashRate(ns) {
    return ns.formulas.hacknetServers.hashGainRate(1,0,1,1,ns.getPlayer().hacknet_node_money_mult)
}