/**
 * @typedef {import('unified').Processor} Processor
 * @typedef {import('unified').Plugin} Plugin
 * @typedef {import('unified').Transformer} Transformer
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unified').CompilerFunction} CompilerFunction
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

import nodeStream from 'node:stream'
import test from 'tape'
import {unified} from 'unified'
import {stream} from './index.js'

test('stream', (t) => {
  // @ts-expect-error: unified types are wrong.
  const proc = unified().use(parse).use(stringify)

  t.test('interface', (st) => {
    const tr = stream(proc)
    st.equal(tr.readable, true, 'should be readable')
    st.equal(tr.writable, true, 'should be writable')
    st.equal(typeof tr.write, 'function', 'should have a `write` method')
    st.equal(typeof tr.end, 'function', 'should have an `end` method')
    st.equal(typeof tr.pipe, 'function', 'should have a `pipe` method')
    st.end()
  })

  t.test('#end and #write', (st) => {
    st.plan(10)

    st.equal(stream(proc).end(), true, 'should return true')

    st.throws(
      () => {
        const tr = stream(proc)
        tr.end()
        tr.end()
      },
      /^Error: Did not expect `write` after `end`$/,
      'should throw on end after end'
    )

    stream(proc)
      .on('data', (/** @type {string} */ value) => {
        st.equal(value, '', 'should emit processed `data`')
      })
      .end()

    stream(proc)
      .on('data', (/** @type {string} */ value) => {
        st.equal(value, 'alpha', 'should emit given `data`')
      })
      .end('alpha')

    // @ts-expect-error: TS is wrong on streams.
    stream(proc)
      .on('data', (/** @type {string} */ value) => {
        st.equal(value, 'brC!vo', 'should honour encoding')
      })
      .end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    let phase = 0

    stream(proc)
      .on('data', () => {
        st.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
      .end('charlie', () => {
        st.equal(phase, 0, 'should trigger callback before data')
        phase++
      })

    const exception = new Error('alpha')

    stream(
      proc().use(() => {
        return transformer
        /** @type {Transformer} */
        function transformer() {
          return exception
        }
      })
    )
      .on('error', (/** @type {Error} */ error) => {
        st.equal(error, exception, 'should trigger `error` if an error occurs')
      })
      .on(
        'data',
        /* istanbul ignore next */
        () => {
          st.fail('should not trigger `data` if an error occurs')
        }
      )
      .end()

    stream(
      proc().use(() => {
        return transformer
        /** @type {Transformer} */
        function transformer(_, file) {
          file.message(exception)
        }
      })
    )
      .on('warning', (/** @type {VFileMessage} */ error) => {
        st.equal(
          error.reason,
          'alpha',
          'should trigger `warning` if an messages are emitted'
        )
      })
      .on('data', (/** @type {string} */ data) => {
        st.equal(data, '', 'should not fail if warnings are emitted')
      })
      .end()
  })

  t.test('#pipe', (st) => {
    st.plan(6)

    st.doesNotThrow(() => {
      // Not writable.
      const tr = stream(proc)
      // @ts-expect-error: we handle this gracefully.
      tr.pipe(new nodeStream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    let tr = stream(proc)
    let s = new nodeStream.PassThrough()
    // @ts-expect-error: TS is wrong about stdin and stdout.
    s._isStdio = true

    tr.pipe(s)

    tr.end('alpha')

    st.doesNotThrow(() => {
      s.write('bravo')
    }, 'should not `end` stdio streams')

    tr = stream(proc)
    s = new nodeStream.PassThrough()

    tr.pipe(s, {end: false})
    tr.end('alpha')

    st.doesNotThrow(() => {
      s.write('bravo')
    }, 'should not `end` streams when piping w/ `end: false`')

    tr = stream(proc).on('error', (/** @type {Error} */ error) => {
      st.equal(error.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new nodeStream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = stream(proc)
    tr.pipe(new nodeStream.PassThrough())

    st.throws(
      () => {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = stream(proc)

    tr.pipe(new nodeStream.PassThrough())
      .on('data', (/** @type {Buffer} */ buf) => {
        st.equal(
          String(buf),
          'alphabravocharlie',
          'should trigger `data` with the processed result'
        )
      })
      .on(
        'error',
        /* istanbul ignore next */
        () => {
          st.fail('should not trigger `error`')
        }
      )

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })
})

/**
 * @type {Plugin}
 * @this {Processor}
 */
function parse() {
  this.Parser = parser

  /** @type {ParserFunction} */
  function parser(doc) {
    // @ts-expect-error: hush.
    return {type: 'text', value: doc}
  }
}

/**
 * @type {Plugin}
 * @this {Processor}
 */
function stringify() {
  this.Compiler = compiler

  /** @type {CompilerFunction} */
  function compiler(tree) {
    // @ts-expect-error: it’s a text node.
    return tree.value
  }
}
