export async function main(ns) {
    const defaultServerList= ["iron-gym","nectar-net","omega-net","johnson-ortho","summit-uni","alpha-ent","computek","harakiri-sushi","hong-fang-tea","max-hardware","phantasy","crush-fitness","rothman-uni","millenium-fitness","global-pharm","galactic-cyber","omnia","aevum-police","snap-fitness","deltaone","zeus-med","infocomm","solaris","univ-energy","nova-med","microdyne","helios","omnitek","nwo","blade","ecorp","fulcrumtech",".","titan-labs","vitalife","kuai-gong","b-and-a","The-Cave","fulcrumassets","4sigma","powerhouse-fitness","clarkinc","megacorp","stormtech","zb-def","run4theh111z","icarus","taiyang-digital","applied-energetics","rho-construction","netlink","the-hub","I.I.I.I","joesguns","sigma-cosmetics","foodnstuff","CSEC","silver-helix","neo-net","avmnite-02h","catalyst","syscore","zb-institute","lexo-corp","aerocorp","unitalife","defcomm","zer0","n00dles"]

    for (let s of defaultServerList) {
        const minSec = ns.getServerMinSecurityLevel(s);
        const baseSec = ns.getServerBaseSecurityLevel(s);
        const sec = ns.getServerSecurityLevel(s);
        let t = Math.ceil((sec - minSec) * 20)
        if(!ns.hasRootAccess(s))  {
			openPorts(ns,s)
			if(ns.getServerNumPortsRequired(s) <= portOpenersCount(ns)){
				//await ns.installBackdoor(s)
				ns.print("NUKEing target")
				await ns.nuke(s)
			}

		}else ns.print("already have root access")

        if(ns.hasRootAccess(s)){
			//exec(script: string, host: string, numThreads?: number, ...args: Array<string | number | boolean>): number;
			if(t>0)ns.exec("weaken.js","home",t,s,t,0)
		}
    }
}
async function openPorts(ns,s){

	if(ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()) {

		if (ns.fileExists("BruteSSH.exe", "home")) {
			ns.print("using BruteSSH")
			opened++
    		await ns.brutessh(s);
    	}
		if (ns.fileExists("FTPCrack.exe", "home")) {
			ns.print("ftp cracking")
			opened++
			await ns.ftpcrack(s)
		}
		if (ns.fileExists("SQLInject.exe", "home")) {
			ns.print("sql cracking")
			opened++
			await ns.sqlinject(s)
		}
		if (ns.fileExists("HTTPWorm.exe", "home")) {
			ns.print("HTTP cracking")
			opened++
			await ns.httpworm(s)
		}
		if (ns.fileExists("relaySMTP.exe", "home")) {
			ns.print("SMTP cracking")
			opened++
			await ns.relaysmtp(s)
		}
	}else ns.print("not high enough lvl to hack")
}
function portOpenersCount(ns){
	var i = 0
	if (ns.fileExists("BruteSSH.exe", "home")) i++
	if (ns.fileExists("FTPCrack.exe", "home")) i++
	if (ns.fileExists("SQLInject.exe", "home")) i++
	if (ns.fileExists("HTTPWorm.exe", "home")) i++
	return i
}