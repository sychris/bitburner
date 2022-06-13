export async function main(ns) {
    const flags = ns.flags([
        ['refreshrate', 1000],
        ['help', false],
    ])
    if ( flags.help) {
        ns.tprint("This script buys all availible equipment you can afford for gang members.");
        ns.tprint(`USAGE: run ${ns.getScriptName()} `);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} `)
        return;
    }
    ns.disableLog('asleep');
    let members = ns.gang.getMemberNames()
    let allEquip = ns.gang.getEquipmentNames()
    let allEquipMinusAugs = removeAugs(ns,allEquip)
    //ns.tprint(allEquipMinusAugs)
    while (true) {
        //ns.tprint("gang members: " + members)
        for (let member of members) {

            let currentEquips = ns.gang.getMemberInformation(member).upgrades
            let need = allEquipMinusAugs.filter(item => !currentEquips.includes(item))
            if (need.length != 0) {
                for (let item in need) {
                    ns.gang.purchaseEquipment(member, need[item])
                }
            }

            //ns.tprint("still need " + need)
        }
        await ns.asleep(flags.refreshrate)
    }
}
function removeAugs(ns, equipList) {
    let newList = []
    for (let equip of equipList) {
        if (ns.gang.getEquipmentType(equip) != "Augmentation") {
            newList.push(equip)
        }
    }
    return newList
}