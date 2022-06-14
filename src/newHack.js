function getCyclesToFullyHack(ns, hostname, servers) {
    if (ns.fileExists("formulas.exe", "home")) {
        return  Math.ceil((settings().maxServerValueToHack / 100) /  ns.formulas.hacking.hackPercent(ns.getServer(hostname),ns.getPlayer()))
    } else {
        return Math.ceil(ns.hackAnalyzeThreads(hostname, servers[hostname].maxMoney * (settings().maxServerValueToHack / 100)))
    }
}
