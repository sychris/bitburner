/** @param {NS} ns **/
//import {defaultServerList} from "serverList.js"
var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });
  export async function main(ns) {
      ns.print("this script is not yet finished and will not work")
      ns.print(getBestUpgrade(ns,ns.hacknet.getNodeStats(0)))
  }
  function getBestUpgrade(ns,hacknetNodeStats){
      let bestUpgrade = "Core"
      let bestUpgradePricePerHash = calcCoreUpgradePricePerHash(ns,hacknetNodeStats)
      ns.print("CorePricePerHash: "+ formatter.format(bestUpgradePricePerHash))
      let lvlPricePerHash = calcLevelUpgradePricePerHash(ns,hacknetNodeStats)
      ns.print("lvlPricePerHash: "+formatter.format(lvlPricePerHash))
      if(lvlPricePerHash < bestUpgradePricePerHash){
          bestUpgrade = "Level"
          bestUpgradePricePerHash = lvlPricePerHash
      }
      let ramPricePerHash = calcRamUpgradePricePerHash(ns,hacknetNodeStats)
      ns.print("ramPricePerHash: " + formatter.format(ramPricePerHash))
      if(ramPricePerHash < bestUpgradePricePerHash){
          bestUpgrade = "Ram"
          bestUpgradePricePerHash = ramPricePerHash
      }
      return bestUpgrade
  }
  function calcCoreUpgradePricePerHash(ns, hacknetNodeStats){
      let current = getCurrentRate(ns,hacknetNodeStats)
      let price = ns.formulas.hacknetServers.coreUpgradeCost(hacknetNodeStats.cores,1,ns.getPlayer().hacknet_node_core_cost_mult)
      let newHash = ns.formulas.hacknetServers.hashGainRate(
          hacknetNodeStats.level,
          hacknetNodeStats.ramUsed,
          hacknetNodeStats.ram,
          hacknetNodeStats.cores + 1,
          ns.getPlayer().hacknet_node_money_mult
      )
      let change = newHash - current;
      return  price/change
  }
  function calcLevelUpgradePricePerHash(ns,hacknetNodeStats){
      let current = getCurrentRate(ns,hacknetNodeStats)
      let price = ns.formulas.hacknetServers.levelUpgradeCost(hacknetNodeStats.level,1,ns.getPlayer().hacknet_node_level_cost_mult)
      let newHash = ns.formulas.hacknetServers.hashGainRate(
          hacknetNodeStats.level + 1,
          hacknetNodeStats.ramUsed,
          hacknetNodeStats.ram,
          hacknetNodeStats.cores,
          ns.getPlayer().hacknet_node_money_mult
      )
      let change = newHash - current;
      return  price/change
  }
  function calcRamUpgradePricePerHash(ns,hacknetNodeStats){
      let current = getCurrentRate(ns,hacknetNodeStats)
      let price = ns.formulas.hacknetServers.ramUpgradeCost(hacknetNodeStats.ram,1,ns.getPlayer().hacknet_node_ram_cost_mult)
      let newHash = ns.formulas.hacknetServers.hashGainRate(
          hacknetNodeStats.level,
          hacknetNodeStats.ramUsed,
          hacknetNodeStats.ram + 1,
          hacknetNodeStats.cores,
          ns.getPlayer().hacknet_node_money_mult
      )
      let change = newHash - current;
      return  price/change
  }
  function getCurrentRate(ns, hacknetNodeStats){
      return ns.formulas.hacknetServers.hashGainRate(
          hacknetNodeStats.level,
          hacknetNodeStats.ramUsed,
          hacknetNodeStats.ram,
          hacknetNodeStats.cores,
          ns.getPlayer().hacknet_node_money_mult
      )
  }