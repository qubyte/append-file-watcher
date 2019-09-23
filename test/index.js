'use strict';

const appendFileWatcher = require('../');
const fs = require('fs').promises;
const path = require('path');
const assert = require('assert').strict;
const { EventEmitter, once } = require('events');

const testDataPath = path.join(__dirname, 'test.dat');

describe('append-file-watcher', () => {
  beforeEach(() => {
    return fs.writeFile(testDataPath, 'abc');
  });

  afterEach(() => {
    return fs.unlink(testDataPath)
      .catch(() => {});
  });

  it('is a function', () => {
    assert.equal(typeof appendFileWatcher, 'function');
  });

  it('returns an event emitter', () => {
    const emitter = appendFileWatcher(testDataPath);

    assert.ok(emitter instanceof EventEmitter);
  });

  it('emits the initial content of a file as a buffer when watching begins', async () => {
    const emitter = appendFileWatcher(testDataPath);
    const [data] = await once(emitter, 'append');

    assert.ok(data instanceof Buffer);
    assert.equal(data.toString(), 'abc');
  });

  it('emits subsequent appends as buffers', async () => {
    const emitter = appendFileWatcher(testDataPath);
    const [firstResult] = await once(emitter, 'append');

    assert.ok(firstResult instanceof Buffer);
    assert.equal(firstResult.toString(), 'abc');

    await fs.appendFile(testDataPath, 'def');

    const [secondResult] = await once(emitter, 'append');

    assert.ok(secondResult instanceof Buffer);
    assert.equal(secondResult.toString(), 'def');
  });

  it('emits "close" when close is called', async () => {
    const emitter = appendFileWatcher(testDataPath);

    await once(emitter, 'append');

    let closed = false;

    emitter.once('close', () => {
      closed = true;
    });

    assert.equal(closed, false);

    emitter.close();

    assert.equal(closed, true);
  });
});
