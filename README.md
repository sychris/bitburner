# Bitburner scripts collection

Welcome to my log of [Bitburner](https://danielyxie.github.io/bitburner/) scripts. They are written using the in-game language of NetscriptJS, which is a mutation of Javascript.

If you want to play the game itself - click on the name above.

## Requirements
I no longer know if this script functions for very new accounts earlyer forks likly will however.

The script can now run batches for far far faster monies but its still not stabalised.

## Instalation

1. Create a new script called `start.js` by issuing the following command: `nano start.js`. Make sure you're on your home server if you're not (you can quickly go home by running `home` in the console).
2. Paste the following content:

```javascript
export async function main(ns) {
  if (ns.getHostname() !== "home") {
    throw new Exception("Run the script from home");
  }

  await ns.wget(
    `https://raw.githubusercontent.com/sychris/bitburner/master/src/initHacking.js?ts=${new Date().getTime()}`,
    "initHacking.js"
  );
  ns.spawn("initHacking.js", 1);
}
```

3. Exit the nano and write in console: `run start.js`
