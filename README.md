# appended file watcher

This module exposes a function. Given a file path, this function creates a
watcher for that file and returns an event emitter. On change events, the file
is opened, appended data read, and a buffer with the new content emitted. A new
change is then awaited.

Between emitting content and the next change event, the file is closed.

## API

### `createWatcher(path: PathLike) => relay: EventEmitter`

The returned event emitter can emit three kinds of event:

 - `('append', buffer)` when data is appended to the file.
 - `('error', error)` when there was an error handling the file.
 - `('close')` when watching has stopped. Emitted as the last event after
   `relay.close` is called.

### `relay.close() => void`

Calling `relay.close()` closes the underlying watcher and unregisters internal
events.
