/**
 * @typedef {import('unified').Processor} Processor
 * @typedef {import('unified').ProcessCallback} ProcessCallback
 * @typedef {import('vfile').Value} Value
 */

/**
 * @callback Callback
 *   Callback.
 * @param {Error | undefined} [error]
 *   Error.
 * @returns {undefined | void}
 *   Nothing.
 *
 * @typedef {Omit<NodeJS.ReadableStream & NodeJS.WritableStream, SymbolConstructor['asyncIterator'] | 'isPaused' | 'pause' | 'read' | 'resume' | 'setEncoding' | 'unpipe' | 'unshift' | 'wrap'>} MinimalDuplex
 *   Simple readable and writable stream.
 *
 * @typedef PipeOptions
 *   Configuration (optional).
 * @property {boolean | null | undefined} [end=false]
 *   Whether to `end` if the other stream ends (default: `false`).
 */

import {EventEmitter} from 'node:events'

/**
 * Create a duplex (readable and writable) stream that transforms with
 * `processor`.
 *
 * @param {Processor} processor
 *   unified processor.
 * @returns {MinimalDuplex}
 *   Duplex stream.
 */
export function stream(processor) {
  let ended = false
  /** @type {Array<string>} */
  const chunks = []
  const decoder = new TextDecoder()
  let flush = false

  /** @type {MinimalDuplex} */
  // @ts-expect-error: `addEventListener` is fine.
  const emitter = new EventEmitter()
  // @ts-expect-error: fine.
  emitter.end = end
  emitter.pipe = pipe
  emitter.readable = true
  emitter.writable = true
  emitter.write = write

  return emitter

  /**
   * Write a chunk into memory.
   *
   * @overload
   * @param {Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {string | null | undefined} [encoding]
   *   Character encoding to understand `chunk` as when it’s a `Uint8Array`
   *   (`string`, default: `'utf8'`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   *
   * @overload
   * @param {Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   *
   * @param {Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {Callback | string | null | undefined} [encoding]
   *   Character encoding to understand `chunk` as when it’s a `Uint8Array`
   *   (`string`, default: `'utf8'`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   */
  function write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`')
    }

    if (typeof chunk === 'string') {
      if (flush) chunks.push(decoder.decode())
      chunks.push(chunk)
      flush = false
    } else if (chunk) {
      let u8 = chunk

      // See: <https://nodejs.org/api/util.html#whatwg-supported-encodings>
      if (
        encoding === null ||
        encoding === 'utf8' ||
        // eslint-disable-next-line unicorn/text-encoding-identifier-case
        encoding === 'utf-8' ||
        encoding === 'unicode-1-1-utf-8'
      ) {
        encoding = undefined
      }

      if (u8) {
        // Another encoding, turn into UTF-8.
        if (encoding) {
          u8 = new TextEncoder().encode(new TextDecoder(encoding).decode(u8))
        }

        chunks.push(decoder.decode(u8, {stream: true}))
        flush = true
      }
    }

    if (callback) {
      callback()
    }

    // Signal successful write.
    return true
  }

  /**
   * End the writing.
   *
   * Passes all arguments as a final `write`.
   *
   * @overload
   * @param {Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {string | null | undefined} [encoding]
   *   Character encoding to understand `chunk` as when it’s a `Uint8Array`
   *   (`string`, default: `'utf8'`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   *
   * @overload
   * @param {Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   *
   * @overload
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   *
   * @param {Callback | Value | null | undefined} [chunk]
   *   Slice of markdown to parse (`string` or `Uint8Array`).
   * @param {Callback | string | null | undefined} [encoding]
   *   Character encoding to understand `chunk` as when it’s a `Uint8Array`
   *   (`string`, default: `'utf8'`).
   * @param {Callback | null | undefined} [callback]
   *   Function called when write was successful.
   * @returns {boolean}
   *   Whether write was successful.
   */
  function end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      encoding = chunk
      chunk = undefined
    }

    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }

    write(chunk, encoding, callback)

    if (flush) chunks.push(decoder.decode())
    const combined = chunks.join('')
    // Clear memory.
    chunks.length = 0

    processor.process(combined, done)

    emitter.emit('end')
    ended = true
    return true

    /** @type {ProcessCallback} */
    function done(error, file) {
      const messages = file ? file.messages : []
      let index = -1

      // Trigger messages as warnings, except for fatal error.
      while (++index < messages.length) {
        if (messages[index] !== error) {
          emitter.emit('warning', messages[index])
        }
      }

      if (error || !file) {
        // Don’t enter an infinite error throwing loop.
        setImmediate(function () {
          emitter.emit('error', error)
        })
      } else {
        emitter.emit('data', file.value)
        emitter.emit('end')
      }
    }
  }

  /**
   * Pipe the processor into a writable stream.
   *
   * Basically `Stream#pipe`, but inlined and simplified to keep the bundled
   * size down.
   * See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
   *
   * @template {NodeJS.WritableStream} Destination
   *   Stream type.
   * @param {Destination} dest
   *   Stream to write into.
   * @param {PipeOptions | null | undefined} [options]
   *   Configuration (optional).
   * @returns {Destination}
   *   Given stream.
   */
  function pipe(dest, options) {
    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // If the `end` option is not supplied, `dest.end()` will be
    // called when the `end` or `close` events are received.
    // @ts-expect-error `_isStdio` is available on `std{err,out}`
    if (!dest._isStdio && (!options || options.end !== false)) {
      emitter.on('end', onended)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    /**
     * End destination.
     *
     * @returns {undefined}
     *   Nothing.
     */
    function onended() {
      if (dest.end) {
        dest.end()
      }
    }

    /**
     * Handle data.
     *
     * @param {Value} chunk
     *   Data to write.
     * @returns {undefined}
     *   Nothing.
     */
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    /**
     * Clean listeners.
     *
     * @returns {undefined}
     *   Nothing.
     */
    function cleanup() {
      emitter.removeListener('data', ondata)
      emitter.removeListener('end', onended)
      emitter.removeListener('error', onerror)
      emitter.removeListener('end', cleanup)
      emitter.removeListener('close', cleanup)

      dest.removeListener('error', onerror)
      dest.removeListener('close', cleanup)
    }

    /**
     * Close dangling pipes and handle unheard errors.
     *
     * @param {Error | undefined} [error]
     *   Error.
     * @returns {undefined}
     *   Nothing.
     */
    function onerror(error) {
      cleanup()

      if (!emitter.listenerCount('error')) {
        throw error // Unhandled stream error in pipe.
      }
    }
  }
}
