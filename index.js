'use strict';

const { watch, promises: fs } = require('fs');
const { EventEmitter } = require('events');

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = function createWatcher(datafilePath) {
  const watcher = watch(datafilePath, { persistent: false });
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

  onChange();

  relay.close = () => {
    watcher.off('error', onError);
    watcher.off('change', onChange);
    watcher.close();
    relay.emit('close');
  };

  return relay;
};
