/**
 * @typedef {import('unified').Processor} Processor
 * @typedef {import('unified').ProcessCallback} ProcessCallback
 * @typedef {import('vfile').BufferEncoding} Encoding
 * @typedef {import('vfile').VFileValue} Value
 * @typedef {((error?: Error) => void)} Callback
 * @typedef {Omit<NodeJS.ReadableStream & NodeJS.WritableStream, 'read'|'setEncoding'|'pause'|'resume'|'isPaused'|'unpipe'|'unshift'|'wrap'>} MinimalDuplex
 */

import {EventEmitter} from 'events'

/**
 * @param {Processor} processor
 * @returns {MinimalDuplex}
 */
export function stream(processor) {
  /** @type {string[]} */
  let chunks = []
  /** @type {boolean|undefined} */
  let ended

  /**
   * Write a chunk into memory.
   *
   * @param {Value} chunk
   * @param {Encoding} encoding
   * @param {Callback} callback
   */
  const write =
    /**
     * @type {(
     *   ((value?: Value, encoding?: Encoding, callback?: Callback) => boolean) &
     *   ((value: Value, callback?: Callback) => boolean)
     * )}
     */
    (
      /**
       * @param {Value} [chunk]
       * @param {Encoding} [encoding]
       * @param {Callback} [callback]
       */
      function (chunk, encoding, callback) {
        if (typeof encoding === 'function') {
          callback = encoding
          encoding = undefined
        }

        if (ended) {
          throw new Error('Did not expect `write` after `end`')
        }

        // @ts-expect-error: passing `encoding` to string is fine.
        chunks.push((chunk || '').toString(encoding || 'utf8'))

        if (callback) {
          callback()
        }

        // Signal succesful write.
        return true
      }
    )

  /**
   * End the writing.
   * Passes all arguments to a final `write`.
   * Starts the process, which will trigger `error`, with a fatal error, if any;
   * `data`, with the generated document in `string` form, if succesful.
   * If messages are triggered during the process, those are triggerd as
   * `warning`s.
   *
   * @param {Value} chunk
   * @param {Encoding} encoding
   * @param {Callback} callback
   */
  const end =
    /**
     * @type {(
     *   ((value?: Value, encoding?: Encoding, callback?: Callback) => boolean) &
     *   ((value: Value, callback?: Callback) => boolean)
     * )}
     */
    (
      /**
       * @param {Value} [chunk]
       * @param {Encoding} [encoding]
       * @param {Callback} [callback]
       */
      function (chunk, encoding, callback) {
        write(chunk, encoding, callback)

        processor.process(chunks.join(''), done)

        emitter.emit('end')
        ended = true
        return true

        /** @type {ProcessCallback} */
        function done(error, file) {
          const messages = file ? file.messages : []
          let index = -1

          // @ts-expect-error: clear memory.
          chunks = undefined

          // Trigger messages as warnings, except for fatal error.
          while (++index < messages.length) {
            /* istanbul ignore else - shouldn’t happen. */
            if (messages[index] !== error) {
              emitter.emit('warning', messages[index])
            }
          }

          if (error || !file) {
            // Don’t enter an infinite error throwing loop.
            setTimeout(() => {
              emitter.emit('error', error)
            }, 4)
          } else {
            emitter.emit('data', file.value)
            emitter.emit('end')
          }
        }
      }
    )

  /** @type {MinimalDuplex} */
  // @ts-expect-error `addListener` is fine.
  const emitter = Object.assign(new EventEmitter(), {
    processor,
    writable: true,
    readable: true,
    write,
    end,
    pipe
  })

  return emitter

  /**
   * Pipe the processor into a writable stream.
   * Basically `Stream#pipe`, but inlined and simplified to keep the bundled
   * size down.
   * See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
   *
   * @template {NodeJS.WritableStream} T
   * @param {T} dest
   * @param {{end?: boolean}} [options]
   * @returns {T}
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
     * @returns {void}
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
     * @returns {void}
     */
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    /**
     * Clean listeners.
     *
     * @returns {void}
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
     * @param {Error?} [error]
     * @returns {void}
     */
    function onerror(error) {
      cleanup()

      if (!emitter.listenerCount('error')) {
        throw error // Unhandled stream error in pipe.
      }
    }
  }
}
