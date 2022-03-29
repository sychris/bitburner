/** @param {NS} ns **/
import {defaultServerList} from "serverList.js"
export async function main(ns) {
    ns.tprint(ns.getPurchasedServerMaxRam())
    for (var i = 1; i < 21; i++) {
        var ramAmount = Math.pow(2, i);
        const cost = ns.getPurchasedServerCost(ramAmount);
        ns.tprint(ramAmount + "GB :" + ns.nFormat(cost, "$0.00a"));
    }
}
/*
server-costs.js: 2GB :$110.00k
server-costs.js: 4GB :$220.00k
server-costs.js: 8GB :$440.00k
server-costs.js: 16GB :$880.00k
server-costs.js: 32GB :$1.76m
server-costs.js: 64GB :$3.52m
server-costs.js: 128GB :$7.04m
server-costs.js: 256GB :$14.08m
server-costs.js: 512GB :$28.16m
server-costs.js: 1024GB :$56.32m
server-costs.js: 2048GB :$112.64m
server-costs.js: 4096GB :$225.28m
server-costs.js: 8192GB :$450.56m
server-costs.js: 16384GB :$901.12m
server-costs.js: 32768GB :$1.80b
server-costs.js: 65536GB :$3.60b
server-costs.js: 131072GB :$7.21b
server-costs.js: 262144GB :$14.42b
server-costs.js: 524288GB :$28.84b
server-costs.js: 1048576GB :$57.67b
*/