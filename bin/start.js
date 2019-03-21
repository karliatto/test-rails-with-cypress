#!/usr/bin/env node

const args = process.argv.slice(2)
const la = require('lazy-ass')
const startRailsAndTestCypress = require('..')

let url;
let cypressPort;

if (args.length === 2) {
  url = args[0];
  cypressPort = args[1];
} else {
  la(args.lenght, 'expect: <url> <cypress-port>')
}

console.log(`starting rails server`)
console.log(`and when url "${url}" is responding`)
console.log(`running cypress on port "${cypressPort}"`)

startRailsAndTestCypress({ url, cypressPort }).catch(e => {
  console.error(e)
  process.exit(1)
})
