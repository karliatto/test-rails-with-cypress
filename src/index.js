'use strict';

const la = require('lazy-ass');
const is = require('check-more-types');
const execa = require('execa');
const waitOn = require('wait-on');
const Promise = require('bluebird');
const psTree = require('ps-tree');
const debug = require('debug')('runner');

const isDebug = () => process.env.DEBUG;

const isInsecure = () => process.env.START_SERVER_AND_TEST_INSECURE;

function startRailsAndTestCypress({ url, host, cypressPort }) {
  la(is.unemptyString(host), 'missing host', host);
  la(is.unemptyString(cypressPort), 'missing cypress port', cypressPort);
  la(
    is.unemptyString(url) || is.unemptyArray(url),
    'missing url to wait on',
    url
  );

  debug('starting server, verbose mode?', isDebug());

  const server = execa('bundle', ['exec', 'rails', 's'], { stdio: 'inherit' });
  let serverStopped;

  function stopServer() {
    debug('getting child processes');
    if (!serverStopped) {
      serverStopped = true;
      return Promise.fromNode(cb => psTree(server.pid, cb))
        .then(children => {
          debug('stopping child processes');
          children.forEach(child => {
            try {
              process.kill(child.PID, 'SIGINT');
            } catch (error) {
              if (error.code === 'ESRCH') {
                console.info(
                  `Child process ${child.PID} exited before trying to stop it`
                );
              } else {
                throw error;
              }
            }
          });
        })
        .then(() => {
          debug('stopping server');
          server.kill();
        });
    }
  }

  const waited = new Promise((resolve, reject) => {
    const onClose = () => {
      reject(new Error('server closed unexpectedly'));
    };

    server.on('close', onClose);

    debug('starting waitOn %s', url);
    waitOn(
      {
        resources: Array.isArray(url) ? url : [url],
        interval: 2000,
        window: 1000,
        verbose: isDebug(),
        strictSSL: !isInsecure(),
        log: isDebug(),
      },
      err => {
        if (err) {
          debug('error waiting for url', url);
          debug(err.message);
          return reject(err);
        }
        debug('waitOn finished successfully');
        server.removeListener('close', onClose);
        resolve();
      }
    );
  });

  function runCypress() {
    debug('running cypress');
    return execa(
      './node_modules/.bin/cypress',
      ['run', '--env', `host=${host},port=${cypressPort}`],
      { stdio: 'inherit' }
    );
  }

  return waited
    .tapCatch(stopServer)
    .then(runCypress)
    .finally(stopServer);
}

module.exports = startRailsAndTestCypress;
