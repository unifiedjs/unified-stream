'use strict'

var events = require('events')
var once = require('once')

module.exports = stream

function stream(processor) {
  var chunks = []
  var emitter = new events.EventEmitter()
  var ended = false

  emitter.processor = processor
  emitter.readable = true
  emitter.writable = true
  emitter.write = write
  emitter.end = end
  emitter.pipe = pipe

  return emitter

  // Write a chunk into memory.
  function write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = null
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`')
    }

    chunks.push((chunk || '').toString(encoding || 'utf8'))

    if (callback) {
      callback()
    }

    // Signal succesful write.
    return true
  }

  // End the writing.
  // Passes all arguments to a final `write`.
  // Starts the process, which will trigger `error`, with a fatal error, if any;
  // `data`, with the generated document in `string` form, if succesful.
  // If messages are triggered during the process, those are triggerd as
  // `warning`s.
  function end() {
    write.apply(null, arguments)

    ended = true

    processor.process(chunks.join(''), done)

    return true

    function done(err, file) {
      var messages = file ? file.messages : []
      var length = messages.length
      var index = -1

      chunks = null

      // Trigger messages as warnings, except for fatal error.
      while (++index < length) {
        /* istanbul ignore else - shouldn’t happen. */
        if (messages[index] !== err) {
          emitter.emit('warning', messages[index])
        }
      }

      if (err) {
        // Don’t enter an infinite error throwing loop.
        global.setTimeout(function () {
          emitter.emit('error', err)
        }, 4)
      } else {
        emitter.emit('data', file.contents)
        emitter.emit('end')
      }
    }
  }

  // Pipe the processor into a writable stream.
  // Basically `Stream#pipe`, but inlined and simplified to keep the bundled
  // size down.
  // See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
  function pipe(dest, options) {
    var settings = options || {}
    var onend = once(onended)

    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // If the `end` option is not supplied, `dest.end()` will be called when the
    // `end` or `close` events are received
    // Only `dest.end()` once.
    if (!dest._isStdio && settings.end !== false) {
      emitter.on('end', onend)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    // End destination.
    function onended() {
      if (dest.end) {
        dest.end()
      }
    }

    // Handle data.
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    // Clean listeners.
    function cleanup() {
      emitter.removeListener('data', ondata)
      emitter.removeListener('end', onend)
      emitter.removeListener('error', onerror)
      emitter.removeListener('end', cleanup)
      emitter.removeListener('close', cleanup)

      dest.removeListener('error', onerror)
      dest.removeListener('close', cleanup)
    }

    // Close dangling pipes and handle unheard errors.
    function onerror(err) {
      var handlers = emitter._events.error

      cleanup()

      // Cannot use `listenerCount` in node <= 0.12.
      if (!handlers || handlers.length === 0 || handlers === onerror) {
        throw err // Unhandled stream error in pipe.
      }
    }
  }
}
