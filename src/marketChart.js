
import { plot } from "./asciichart.js";
export async function main(ns) {
    let data = []
    while (true) {
        await ns.sleep(2000)
        ns.tail();
        ns.disableLog('ALL');
        ns.clearLog()


        data = addDataPoint(ns,data)
        plotData(ns, data)
        ns.print("sometext")
    }
}
function addDataPoint(ns,data) {
    if (data[data.length-1] === ns.stock.getPrice('FSIG')) {
        return data
    }

    data.push(ns.stock.getPrice('FSIG'))

    if (data.length > 150) {
        data.shift()
        ns.print("cleared data")
    }
    return data

}
function plotData(ns, data) {
    ns.print(plot(data))
}