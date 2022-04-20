export async function main(ns) {
    // We will not buy anything if there's less money than this ammount
    let reserveMoney = 0;
    // Number of times to upgrade (shouldn't have to change this)
    let n = 1;

    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("sleep")

    // Buy first HacknetNode if there are none
    if (ns.hacknet.numNodes() === 0 && getServerMoneyAvailable("home") >= reserveMoney) {
      ns.hacknet.purchaseNode();
      ns.print("Purchased " + ns.hacknet.getNodeStats((ns.hacknet.numNodes() - 1)).name + " because there was none.");
    }

    // If there are no Hacknet Nodes, we can't do anything, so the script
    // ends.
    while (ns.hacknet.numNodes() > 0 && ns.hacknet.numNodes() < 28) {
      // If there is not enough money, we wait for it instead of ending the loop.
      if(ns.getServerMoneyAvailable("home") >= reserveMoney) {
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
          if (ns.hacknet.getLevelUpgradeCost(i, n) < Infinity && ns.hacknet.upgradeLevel(i, n)) {
            ns.print("Upgraded " + ns.hacknet.getNodeStats(i).name + " to level " + ns.hacknet.getNodeStats(i).level);
          }
          if (ns.hacknet.getRamUpgradeCost(i, n) < Infinity && ns.hacknet.upgradeRam(i, n)) {
            ns.print("Upgraded " +ns.hacknet.getNodeStats(i).name +" RAM to " +ns.hacknet.getNodeStats(i).ram);
          }
          if (ns.hacknet.getCoreUpgradeCost(i, n) < Infinity && ns.hacknet.upgradeCore(i, n)) {
            ns.print("Upgraded " +ns.hacknet.getNodeStats(i).name + " core to " + ns.hacknet.getNodeStats(i).cores);
          }
        } // END for (i = 0; i < ns.hacknet.numNodes(); i++)
        // Buy next Hacknet Node if the last one is already fully
        // upgraded. If for some reason the last Hacknet Node is fully
        // upgraded and the others don't, the loop above will still
        // attempt to upgrade them all.
        if (
          ns.hacknet.getLevelUpgradeCost(
            (ns.hacknet.numNodes() - 1), n) === Infinity &&
          ns.hacknet.getRamUpgradeCost(
            (ns.hacknet.numNodes() - 1), n) === Infinity &&
          ns.hacknet.getCoreUpgradeCost(
            (ns.hacknet.numNodes() - 1), n) === Infinity
        ) {
          ns.hacknet.purchaseNode();
          ns.print(
            "Purchased " +
            ns.hacknet.getNodeStats((ns.hacknet.numNodes() - 1)).name + " because the last one couldn't be upgraded further.");
        } else if (
          // Or buy the next Hacknet Node if the next upgrade is more
          // expensive than buying a new Hacknet Node.
          ns.hacknet.getLevelUpgradeCost(ns.hacknet.numNodes() - 1, n) > ns.hacknet.getPurchaseNodeCost() &&
          ns.hacknet.getRamUpgradeCost(ns.hacknet.numNodes() - 1, n) > ns.hacknet.getPurchaseNodeCost() &&
          ns.hacknet.getCoreUpgradeCost(ns.hacknet.numNodes() - 1, n) > ns.hacknet.getPurchaseNodeCost()
        ) {
          ns.hacknet.purchaseNode();
          ns.print("Purchased " + ns.hacknet.getNodeStats((ns.hacknet.numNodes() - 1)).name + " because it was cheaper than next upgrade.");
        }
      }
      await ns.sleep(1000)
    }
  }