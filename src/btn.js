export async function main(ns) {
    const doc = document; // This is expensive!
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');
    let btn = document.createElement("button");
    btn.innerHTML = "Kill";
    var clicked = false;
    hook1.appendChild(btn);
    btn.onclick = function () { ns.tprintf("clicked"); clicked = true; };

    while (!clicked) {
        await ns.asleep(1000);
    }

    hook1.removeChild(btn);
}