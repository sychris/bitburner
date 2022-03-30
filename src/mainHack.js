/** @type import(".").NS */let ns = null;
import {
  settings,
  getItem,
  setItem,
  localeHHMMSS,
  getPlayerDetails,
  createUUID
} from 'common.js'

const hackPrograms = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe',
  'HTTPWorm.exe', 'SQLInject.exe']
const hackScripts = ['hack.js', 'grow.js', 'weaken.js']

function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }
  if (!ms) {
    ms = new Date().getTime()
  }
  return new Date(ms).toISOString().substr(11, 8)
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

//changes: {hack: 0.002,grow: 0.004,weaken: 0.05,},
function weakenCyclesForGrow(growCycles) {
  return Math.max(0, Math.ceil(growCycles * (settings().changes.grow / settings().changes.weaken)))
}

function weakenCyclesForHack(hackCycles) {
  return Math.max(0, Math.ceil(hackCycles * (settings().changes.hack / settings().changes.weaken)))
}

async function getHackableServers(ns, servers) {
  const playerDetails = getPlayerDetails(ns)

  const hackableServers = Object.keys(servers)
    .filter((hostname) => ns.serverExists(hostname))
    .filter((hostname) => servers[hostname].ports <= playerDetails.portHacks ||
      ns.hasRootAccess(hostname))
    .filter((hostname) => servers[hostname].ram >= 2)
    .filter((hostname) => !/hacknet/.test(hostname))

  for (const hostname of hackableServers) {
    if (hostname === 'home') continue;
    if (!ns.hasRootAccess(hostname)) {
      hackPrograms.forEach((hackProgram) => {
        if (ns.fileExists(hackProgram, 'home')) {
          ns[hackProgram.split('.')[0].toLocaleLowerCase()](hostname)
        }
      })
      ns.nuke(hostname)
    }

    await ns.scp(hackScripts, hostname)
  }

  hackableServers.sort((a, b) => servers[a].ram - servers[b].ram)
  return hackableServers
}

function findTargetServer(ns, serversList, servers, serverExtraData) {
  const playerDetails = getPlayerDetails(ns)

  serversList = serversList
    .filter((hostname) => servers[hostname].hackingLevel <= playerDetails.hackingLevel)
    .filter((hostname) => servers[hostname].maxMoney)
    .filter((hostname) => hostname !== 'home')
    .filter((hostname) => ns.getWeakenTime(hostname) < settings().maxWeakenTime)

  let weightedServers = serversList.map((hostname) => {

    const fullHackCycles = Math.ceil(ns.hackAnalyzeThreads(hostname, servers[hostname].maxMoney * (settings().maxServerValueToHack / 100)))

    serverExtraData[hostname] = {
      fullHackCycles,
    }

    const serverValue = servers[hostname].maxMoney * (settings().minSecurityWeight /
      (servers[hostname].minSecurityLevel + ns.getServerSecurityLevel(hostname))
    )

    return {
      hostname,
      serverValue,
      minSecurityLevel: servers[hostname].minSecurityLevel,
      securityLevel: ns.getServerSecurityLevel(hostname),
      maxMoney: servers[hostname].maxMoney,
    }
  })

  weightedServers.sort((a, b) => b.serverValue - a.serverValue)
  ns.print(JSON.stringify(weightedServers, null, 2))

  return weightedServers.map((server) => server.hostname)
}

export async function main(ns) {
  ns.tprint(`[${localeHHMMSS()}] Starting mainHack.js`)

  let hostname = ns.getHostname()

  if (hostname !== 'home') {
    throw new Exception('Run the script from home')
  }

  while (true) {
    const serverExtraData = {}
    const serverMap = getItem(settings().keys.serverMap)
    if (serverMap.servers.home.ram >= settings().homeRamBigMode) {
      settings().homeRamReserved = settings().homeRamReservedBase + settings().homeRamExtraRamReserved
    }

    if (!serverMap || new Date().getTime() - serverMap.lastUpdate > settings().mapRefreshInterval) {
      ns.tprint(`[${localeHHMMSS()}] Spawning spider.js`)
      ns.spawn('spider.js', 1, 'mainHack.js')
      ns.exit()
      return
    }
    serverMap.servers.home.ram = Math.max(0, serverMap.servers.home.ram - settings().homeRamReserved)

    const hackableServers = await getHackableServers(ns, serverMap.servers)

    const targetServers = findTargetServer(ns, hackableServers, serverMap.servers, serverExtraData)
    const bestTarget = targetServers.shift()
    const hackTime = ns.getHackTime(bestTarget)
    const growTime = ns.getGrowTime(bestTarget)
    const weakenTime = ns.getWeakenTime(bestTarget)

    const growDelay = Math.max(0, weakenTime - growTime - 15)
    const hackDelay = Math.max(0, growTime + growDelay - hackTime - 15)

    const securityLevel = ns.getServerSecurityLevel(bestTarget)
    const money = ns.getServerMoneyAvailable(bestTarget)

    let action = 'weaken'
    if (securityLevel > serverMap.servers[bestTarget].minSecurityLevel + settings().minSecurityLevelOffset) {
      action = 'weaken'
    } else if (money < serverMap.servers[bestTarget].maxMoney * settings().maxMoneyMultipliyer) {
      action = 'grow'
    } else {
      action = 'hack'
    }

    let hackCycles = 0
    let growCycles = 0
    let weakenCycles = 0
    let multiRun = false
    let batchCount = 0
    let batchInterval = 100

    //appears to be setting hack and grow cycles to max allowable by ram availible
    for (let i = 0; i < hackableServers.length; i++) {
      const server = serverMap.servers[hackableServers[i]]
      hackCycles += Math.floor(server.ram / 1.7)
      growCycles += Math.floor(server.ram / 1.75)
    }
    //setting weaken cylcles to max allowable values
    weakenCycles = growCycles

    //outputing status
    ns.tprint(
      `[${localeHHMMSS()}] Selected ${bestTarget} for a target. Planning to ${action} the server. Will wake up around ${localeHHMMSS(
        new Date().getTime() + weakenTime + 300
      )}`
    )
    ns.tprint(
      `[${localeHHMMSS()}] Stock values: baseSecurity: ${serverMap.servers[bestTarget].baseSecurityLevel}; minSecurity: ${serverMap.servers[bestTarget].minSecurityLevel
      }; maxMoney: $${numberWithCommas(parseInt(serverMap.servers[bestTarget].maxMoney, 10))}`
    )
    ns.tprint(`[${localeHHMMSS()}] Current values: security: ${Math.floor(securityLevel * 1000) / 1000}; money: $${numberWithCommas(parseInt(money, 10))}`)
    ns.tprint(
      `[${localeHHMMSS()}] Time to: hack: ${convertMSToHHMMSS(hackTime)}; grow: ${convertMSToHHMMSS(growTime)}; weaken: ${convertMSToHHMMSS(weakenTime)}`
    )
    ns.tprint(`[${localeHHMMSS()}] Delays: ${convertMSToHHMMSS(hackDelay)} for hacks, ${convertMSToHHMMSS(growDelay)} for grows`)



    if (action === 'weaken') {
      if (settings().changes.weaken * weakenCycles > securityLevel - serverMap.servers[bestTarget].minSecurityLevel) {
        weakenCycles = Math.ceil((securityLevel - serverMap.servers[bestTarget].minSecurityLevel) / settings().changes.weaken)
        growCycles -= weakenCycles
        growCycles = Math.max(0, growCycles)

        weakenCycles += weakenCyclesForGrow(growCycles)
        growCycles -= weakenCyclesForGrow(growCycles)
        growCycles = Math.max(0, growCycles)
      } else {
        growCycles = 0
      }

      ns.tprint(
        `[${localeHHMMSS()}] Cycles ratio: ${growCycles} grow cycles; ${weakenCycles} weaken cycles; expected security reduction: ${Math.floor(settings().changes.weaken * weakenCycles * 1000) / 1000
        }`
      )

      for (let i = 0; i < hackableServers.length; i++) {
        const server = serverMap.servers[hackableServers[i]]
        let cyclesFittable = Math.max(0, Math.floor(server.ram / 1.75))
        const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))

        if (growCycles) {
          await ns.exec('grow.js', server.host, cyclesToRun, bestTarget, cyclesToRun, growDelay, createUUID())
          growCycles -= cyclesToRun
          cyclesFittable -= cyclesToRun
        }

        if (cyclesFittable) {
          await ns.exec('weaken.js', server.host, cyclesFittable, bestTarget, cyclesFittable, 0, createUUID())
          weakenCycles -= cyclesFittable
        }
      }
    } else if (action === 'grow') {
      weakenCycles = weakenCyclesForGrow(growCycles)
      growCycles -= weakenCycles

      ns.tprint(`[${localeHHMMSS()}] Cycles ratio: ${growCycles} grow cycles; ${weakenCycles} weaken cycles`)

      for (let i = 0; i < hackableServers.length; i++) {
        const server = serverMap.servers[hackableServers[i]]
        let cyclesFittable = Math.max(0, Math.floor(server.ram / 1.75))
        const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))

        if (growCycles) {
          await ns.exec('grow.js', server.host, cyclesToRun, bestTarget, cyclesToRun, growDelay, createUUID())
          growCycles -= cyclesToRun
          cyclesFittable -= cyclesToRun
        }

        if (cyclesFittable) {
          await ns.exec('weaken.js', server.host, cyclesFittable, bestTarget, cyclesFittable, 0, createUUID())
          weakenCycles -= cyclesFittable
        }
      }
    } else { //action === 'hack'
      //should be set in findTargetServer defigned as const serverExtraData = {}
      ns.tprint("debug hackCycles: " + hackCycles +"serverExtraData[bestTarget].fullHackCycles: "+serverExtraData[bestTarget].fullHackCycles)
      if (hackCycles > serverExtraData[bestTarget].fullHackCycles) {
        hackCycles = serverExtraData[bestTarget].fullHackCycles
        let memMaxGrowWeaken = growCycles //max avaible grow and weaken cycles in ram

        //hackAnalyze(host: string): number;Returns the part of the specified server’s money you will steal with a single thread hack
        let percentHacked = ns.hackAnalyze(bestTarget) * hackCycles *100
        //growthAnalyze(host: string, growthAmount: number, cores?: number): number; The amount of grow calls needed to grow the specified server by the specified amount
        let MaxGrowthCyclesNeededForHack = Math.ceil(ns.growthAnalyze(bestTarget,100/percentHacked))
        let maxWeakenCycles = Math.ceil(weakenCyclesForGrow(MaxGrowthCyclesNeededForHack) + weakenCyclesForHack(hackCycles))
        let growWeakenCyclesForMaxHack = MaxGrowthCyclesNeededForHack + maxWeakenCycles
        if (memMaxGrowWeaken > growWeakenCyclesForMaxHack) {
          growCycles = MaxGrowthCyclesNeededForHack
          weakenCycles = maxWeakenCycles
          multiRun = true
        } else {

          //this seams to be here so theres still enough hack cycles after we balance the ratios later to still fully hack the server
          if (hackCycles * 100 < growCycles) {
            hackCycles *= 10
          }

          //balancing for new max of grow and weaken cycles based off current hack cycles
          // prior to this growCycles += Math.floor(server.ram / 1.75) inited at 0
          //this is removing grow cycles to just make room for hacks
          growCycles = Math.max(0, growCycles - Math.ceil((hackCycles * 1.7) / 1.75))
          //inited to weakenCycles = growCycles; growCycles += Math.floor(server.ram / 1.75) inited at 0
          weakenCycles = weakenCyclesForGrow(growCycles) + weakenCyclesForHack(hackCycles)

          //making room in ram for weaken cycles
          growCycles -= weakenCycles

          //trying to remove hack cycles to make room for weaken but we already removed grow cycles for amount of ram taken by hacks
          //so this would only be neccisary if there is not enough room for both hack and weaken. in witch case grow would == 0
          //could def improve this part
          hackCycles -= Math.ceil((weakenCyclesForHack(hackCycles) * 1.75) / 1.7)

          growCycles = Math.max(0, growCycles)
        }
      } else {
        //only if there is not enough ram for a full server hack
        growCycles = 0
        weakenCycles = weakenCyclesForHack(hackCycles)
        hackCycles -= Math.ceil((weakenCycles * 1.75) / 1.7)
      }


      var batch = new Object();
      batch.hackCycles = hackCycles
      batch.growCycles = growCycles
      batch.weakenCycles = weakenCycles
      batch.totalMemRequired = hackCycles * 1.7 + (growCycles + weakenCycles) * 1.75
      let batchStart = Date.now()



      ns.tprint(`[${localeHHMMSS()}]  Cycles ratio: ${hackCycles} hack cycles; ${growCycles} grow cycles; ${weakenCycles} weaken cycles`)



      for (let i = 0; i < hackableServers.length; i++) {
        const server = serverMap.servers[hackableServers[i]]
        if (Date.now() > batchStart + growTime + growDelay - batchInterval) { break; } //our batching is taking way to long for the best server
        if (Date.now() + hackDelay < batchStart + batchCount * batchInterval) { break; } //we are going to start overlapping hacks no good
        await ns.asleep(10)
        if (server.ram > batch.totalMemRequired) {

          let serverBatchCount = Math.max(0,Math.floor(server.ram / batch.totalMemRequired))
          while (serverBatchCount > 0) {
            batchCount += 1
            await runFullBatch(ns, batch, batchCount, batchInterval, server, hackDelay, growDelay, bestTarget)
            serverBatchCount--

          }
        }

        let cyclesFittable = Math.max(0, Math.floor(server.ram / 1.7))
        const cyclesToRun = Math.max(0, Math.min(cyclesFittable, hackCycles))
        if (hackCycles) {
          await ns.exec('hack.js', server.host, cyclesToRun, bestTarget, cyclesToRun, hackDelay, createUUID())
          hackCycles -= cyclesToRun
          cyclesFittable -= cyclesToRun
        }

        const freeRam = server.ram - cyclesToRun * 1.7
        cyclesFittable = Math.max(0, Math.floor(freeRam / 1.75))

        if (cyclesFittable && growCycles) {
          const growCyclesToRun = Math.min(growCycles, cyclesFittable)

          await ns.exec('grow.js', server.host, growCyclesToRun, bestTarget, growCyclesToRun, growDelay, createUUID())
          growCycles -= growCyclesToRun
          cyclesFittable -= growCyclesToRun
        }

        if (cyclesFittable && weakenCycles) {
          const weakenCyclesToRun = Math.min(weakenCycles, cyclesFittable)
          await ns.exec('weaken.js', server.host, weakenCyclesToRun, bestTarget, weakenCyclesToRun, 0, createUUID())
          weakenCycles -= weakenCyclesToRun
          cyclesFittable -= weakenCycles
        }
        ns.tprint(`[${localeHHMMSS()}] server memory to batch ${batch.totalMemRequired} batch's run: ${batchCount} `)

      }
    }

    await ns.kill('monitor.js', 'home', bestTarget)
    await ns.exec('monitor.js', 'home', 1, bestTarget)
    await ns.asleep(weakenTime + (batchCount * batchInterval) + 300)
  }
}
async function runFullBatch(ns, batch, batchCount, batchInterval, server, hackDelay, growDelay, bestTarget) {
  let batchDelay = batchCount * batchInterval //so each batch hits batchInterval after each other
  //dont bother with all the memory stuff we know it will all fit
  await ns.exec('hack.js', server.host, batch.hackCycles, bestTarget, batch.hackCycles, hackDelay + batchDelay, createUUID())
  await ns.exec('grow.js', server.host, batch.growCycles, bestTarget, batch.growCycles, growDelay + batchDelay, createUUID())
  await ns.exec('weaken.js', server.host, batch.weakenCycles, bestTarget, batch.weakenCycles, batchDelay, createUUID())
}


