/**
 * @typedef {import('unist').Literal} Literal
 * @typedef {import('unist').Node} Node
 *
 * @typedef {import('unified').Processor} Processor
 *
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import nodeStream from 'node:stream'
import test from 'node:test'
import {unified} from 'unified'
import {stream} from './index.js'

test('stream', async (t) => {
  const proc = unified().use(parse).use(stringify)

  await t.test('interface', () => {
    const tr = stream(proc)
    assert.equal(tr.readable, true, 'should be readable')
    assert.equal(tr.writable, true, 'should be writable')
    assert.equal(typeof tr.write, 'function', 'should have a `write` method')
    assert.equal(typeof tr.end, 'function', 'should have an `end` method')
    assert.equal(typeof tr.pipe, 'function', 'should have a `pipe` method')
  })

  await t.test('#end and #write', async () => {
    assert.equal(stream(proc).end(), true, 'should return true')

    assert.throws(
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
        assert.equal(value, '', 'should emit processed `data`')
      })
      .end()

    stream(proc)
      .on('data', (/** @type {string} */ value) => {
        assert.equal(value, 'alpha', 'should emit given `data`')
      })
      .end('alpha')

    // @ts-expect-error: TS is wrong on streams.
    stream(proc)
      .on('data', (/** @type {string} */ value) => {
        assert.equal(value, 'brC!vo', 'should honour encoding')
      })
      .end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    let phase = 0

    stream(proc)
      .on('data', () => {
        assert.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
      .end('charlie', () => {
        assert.equal(phase, 0, 'should trigger callback before data')
        phase++
      })

    const exception = new Error('alpha')

    stream(
      proc().use(() => {
        return function () {
          return exception
        }
      })
    )
      .on('error', (/** @type {Error} */ error) => {
        assert.equal(
          error,
          exception,
          'should trigger `error` if an error occurs'
        )
      })
      .on(
        'data',
        /* istanbul ignore next */
        () => {
          assert.fail('should not trigger `data` if an error occurs')
        }
      )
      .end()

    stream(
      proc().use(() => {
        return function (_, file) {
          file.message(exception)
        }
      })
    )
      .on('warning', (/** @type {VFileMessage} */ error) => {
        assert.equal(
          error.reason,
          'alpha',
          'should trigger `warning` if an messages are emitted'
        )
      })
      .on('data', (/** @type {string} */ data) => {
        assert.equal(data, '', 'should noassert.fail if warnings are emitted')
      })
      .end()
  })

  await t.test('#pipe', async () => {
    assert.doesNotThrow(() => {
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

    assert.doesNotThrow(() => {
      s.write('bravo')
    }, 'should not `end` stdio streams')

    tr = stream(proc)
    s = new nodeStream.PassThrough()

    tr.pipe(s, {end: false})
    tr.end('alpha')

    assert.doesNotThrow(() => {
      s.write('bravo')
    }, 'should not `end` streams when piping w/ `end: false`')

    tr = stream(proc).on('error', (/** @type {Error} */ error) => {
      assert.equal(error.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new nodeStream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = stream(proc)
    tr.pipe(new nodeStream.PassThrough())

    assert.throws(
      () => {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = stream(proc)

    tr.pipe(new nodeStream.PassThrough())
      .on('data', (/** @type {Buffer} */ buf) => {
        assert.equal(
          String(buf),
          'alphabravocharlie',
          'should trigger `data` with the processed result'
        )
      })
      .on(
        'error',
        /* istanbul ignore next */
        () => {
          assert.fail('should not trigger `error`')
        }
      )

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })
})

/**
 * @type {import('unified').Plugin<[], string, Node>}
 */
function parse() {
  /** @type {Processor} */
  // @ts-expect-error: TS is wrong about `this`.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = this

  self.parser = parser

  /** @type {import('unified').Parser<Node>} */
  function parser(doc) {
    /** @type {Literal} */
    const literal = {type: 'text', value: doc}
    return literal
  }
}

/**
 * @type {import('unified').Plugin<[], Node, string>}
 */
function stringify() {
  /** @type {Processor} */
  // @ts-expect-error: TS is wrong about `this`.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = this

  self.compiler = compiler

  /** @type {import('unified').Compiler<Node, string>} */
  function compiler(node) {
    return 'value' in node ? String(node.value) : ''
  }
}
