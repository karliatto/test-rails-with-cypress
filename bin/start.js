#!/usr/bin/env node

const args = process.argv.slice(2)
const la = require('lazy-ass')
const startRailsAndTestCypress = require('..')

let url;
let cypressPort;
let host;

if (args.length === 3) {
  url = args[0];
  cypressPort = args[1];
  host = args[2];
} else {
  la(args.lenght, 'expect: <url> <cypress-port> <host>')
}

console.log(`starting rails server`)
console.log(`and when url "${url}" is responding`)
console.log(`running cypress on port "${cypressPort}"`)

startRailsAndTestCypress({ url, cypressPort, host }).catch(e => {
  console.error(e)
  process.exit(1)
})
