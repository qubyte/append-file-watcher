'use strict';

const fs = require('fs').promises;
const { EventEmitter } = require('events');
const chokidar = require('chokidar');

module.exports = function createWatcher(datafilePath) {
  const watcher = chokidar.watch(datafilePath, { persistent: false, usePolling: true });
  const relay = new EventEmitter();

  let offsetBytes = 0;

  function onError(error) {
    relay.emit('error', error);
  }

  async function onChange() {
    let descriptor;

    try {
      descriptor = await fs.open(datafilePath, 'r');

      const stat = await descriptor.stat();
      const length =  stat.size - offsetBytes;
      const { bytesRead, buffer } = await descriptor.read(Buffer.alloc(length), 0, length, offsetBytes);

      offsetBytes += bytesRead;

      relay.emit('append', buffer);
    } catch (error) {
      relay.emit('error', error);
    } finally {
      if (descriptor) {
        descriptor.close();
      }
    }

    watcher.once('change', onChange);
  }

  watcher.on('error', onError);
  watcher.once('ready', onChange);

  let closed = false;

  relay.close = () => {
    if (!closed) {
      closed = true;
      watcher.off('error', onError);
      watcher.off('change', onChange);
      watcher.close();
      relay.emit('close');
    }
  };

  return relay;
};
