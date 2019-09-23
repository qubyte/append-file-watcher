'use strict';

const appendFileWatcher = require('../');
const fs = require('fs').promises;
const path = require('path');
const assert = require('assert').strict;
const { EventEmitter, once } = require('events');

const testDataPath = path.join(__dirname, 'test.dat');

process.on('unhandledRejection', error => {
  console.log('Unhandled Rejection:', error.stack); // eslint-disable-line no-console
  process.exit(1);
});

describe('append-file-watcher', () => {
  let watcher;

  beforeEach(async () => {
    await fs.writeFile(testDataPath, 'abc');
  });

  afterEach(async () => {
    if (watcher) {
      watcher.close();
    }

    await fs.unlink(testDataPath);
  });

  it('is a function', () => {
    assert.equal(typeof appendFileWatcher, 'function');
  });

  it('returns an event emitter', () => {
    watcher = appendFileWatcher(testDataPath);

    assert.ok(watcher instanceof EventEmitter);
  });

  it('emits the initial content of a file as a buffer when watching begins', async () => {
    watcher = appendFileWatcher(testDataPath);
    const [data] = await once(watcher, 'append');

    assert.ok(data instanceof Buffer);
    assert.equal(data.toString(), 'abc');
  });

  it('emits subsequent appends as buffers', async () => {
    watcher = appendFileWatcher(testDataPath);
    const [firstResult] = await once(watcher, 'append');

    assert.ok(firstResult instanceof Buffer);
    assert.equal(firstResult.toString(), 'abc');

    const appendPromise = once(watcher, 'append');

    await fs.appendFile(testDataPath, 'def');

    const [secondResult] = await appendPromise;

    assert.ok(secondResult instanceof Buffer);
    assert.equal(secondResult.toString(), 'def');
  });

  it('emits "close" when close is called', async () => {
    watcher = appendFileWatcher(testDataPath);

    await once(watcher, 'append');

    let closed = false;

    watcher.once('close', () => {
      closed = true;
    });

    assert.equal(closed, false);

    watcher.close();

    assert.equal(closed, true);
  });
});
