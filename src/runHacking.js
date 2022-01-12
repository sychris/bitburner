import { localeHHMMSS } from 'common.js'

export async function main(ns) {
  ns.tprint(`[${localeHHMMSS()}] Starting runHacking.js`)

  let hostname = ns.getHostname()

  if (hostname !== 'home') {
    throw new Exception('Run the script from home')
  }

  const homeRam = ns.getServerMaxRam('home')

  if (homeRam >= 32) {
    ns.tprint(`[${localeHHMMSS()}] Spawning spider.js`)
    await ns.run('spider.js', 1, 'mainHack.js')
    await ns.asleep(1000)
    //ns.tprint(`[${localeHHMMSS()}] Spawning playerServers.js`)
    //ns.spawn('playerServers.js', 1)
  } else {
    ns.tprint(`[${localeHHMMSS()}] Spawning spider.js`)
    ns.spawn('spider.js', 1, 'mainHack.js')
  }
}

// vim: set ft=javascript :
