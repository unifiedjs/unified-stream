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

const proc = unified().use(parse).use(stringify)

test('unified-stream', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), ['stream'])
  })

  const tr = stream(proc)

  await t.test('should be readable', async function () {
    assert.equal(tr.readable, true)
  })

  await t.test('should be writable', async function () {
    assert.equal(tr.writable, true)
  })
})

test('#end and #write', async function (t) {
  const exception = new Error('alpha')

  await t.test('should return `true`', async function () {
    assert.equal(stream(proc).end(), true)
  })

  await t.test('should throw on end after end', async function () {
    const tr = stream(proc)
    tr.end()

    assert.throws(function () {
      tr.end()
    }, /^Error: Did not expect `write` after `end`$/)
  })

  await t.test('should emit processed `data`', async function () {
    let called = false

    stream(proc)
      .on('data', function (/** @type {string} */ value) {
        assert.equal(value, '')
        called = true
      })
      .end()

    assert.equal(called, true)
  })

  await t.test('should emit given `data`', async function () {
    let called = false

    stream(proc)
      .on('data', function (/** @type {string} */ value) {
        assert.equal(value, 'alpha')
        called = true
      })
      .end('alpha')

    assert.equal(called, true)
  })

  await t.test('should honour encoding', async function () {
    let called = false

    // @ts-expect-error: TS is wrong on streams.
    stream(proc)
      .on('data', function (/** @type {string} */ value) {
        assert.equal(value, 'brC!vo')
        called = true
      })
      .end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    assert.equal(called, true)
  })

  await t.test('should default to `utf8`', async function () {
    let called = false

    stream(proc)
      .on('data', function (/** @type {string} */ value) {
        assert.equal(value, 'brávo')
        called = true
      })
      .end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]))

    assert.equal(called, true)
  })

  await t.test('should trigger callback before data', async function () {
    let phase = 0

    stream(proc)
      .on('data', function () {
        assert.equal(phase, 1)
        phase++
      })
      .end('charlie', function () {
        assert.equal(phase, 0)
        phase++
      })

    assert.equal(phase, 2)
  })

  await t.test('should trigger `error` if an error occurs', async function () {
    await new Promise(function (resolve) {
      stream(
        proc().use(function () {
          return function () {
            return exception
          }
        })
      )
        .on('error', function (/** @type {Error} */ error) {
          assert.equal(error, exception)
          resolve(undefined)
        })
        .on('data', function () {
          assert.fail()
        })
        .end()
    })
  })

  await t.test(
    'should trigger `warning` if an messages are emitted',
    async function () {
      let called = false

      stream(
        proc().use(function () {
          return function (_, file) {
            file.message(exception)
          }
        })
      )
        .on('warning', function (/** @type {VFileMessage} */ error) {
          assert.equal(error.reason, 'alpha')
          called = true
        })
        .on('data', function (/** @type {string} */ data) {
          assert.equal(data, '')
        })
        .end()

      assert.equal(called, true)
    }
  )

  await t.test('should support a callback for `write`', async function () {
    let phase = 0

    const s = stream(proc).on('data', function (/** @type {string} */ data) {
      assert.equal(data, 'x')
      assert.equal(phase, 1)
      phase++
    })

    s.write('x', function () {
      assert.equal(phase, 0)
      phase++
    })

    s.end()

    assert.equal(phase, 2)
  })

  await t.test('should support just a callback for `end`', async function () {
    let phase = 0

    stream(proc)
      .on('data', function (/** @type {string} */ data) {
        assert.equal(data, '')
        assert.equal(phase, 1)
        phase++
      })
      .end(function () {
        assert.equal(phase, 0)
        phase++
      })

    assert.equal(phase, 2)
  })
})

test('#pipe', async function (t) {
  await t.test(
    'should not throw when piping to a non-writable stream',
    async function () {
      // Not writable.
      const tr = stream(proc)
      // @ts-expect-error: we handle this gracefully.
      tr.pipe(new nodeStream.Readable())

      assert.doesNotThrow(function () {
        tr.end('foo')
      })
    }
  )

  await t.test('should not `end` stdio streams', async function () {
    const tr = stream(proc)
    const s = new nodeStream.PassThrough()
    // @ts-expect-error: TS is wrong about stdin and stdout.
    s._isStdio = true

    tr.pipe(s)

    tr.end('alpha')

    assert.doesNotThrow(function () {
      s.write('bravo')
    })
  })

  await t.test(
    'should not `end` streams when piping w/ `end: false`',
    async function () {
      const tr = stream(proc)
      const s = new nodeStream.PassThrough()

      tr.pipe(s, {end: false})
      tr.end('alpha')

      assert.doesNotThrow(function () {
        s.write('bravo')
      })
    }
  )

  await t.test('should pass errors', async function () {
    let called = false

    const tr = stream(proc).on('error', function (/** @type {Error} */ error) {
      assert.equal(error.message, 'Whoops!')
      called = true
    })

    tr.pipe(new nodeStream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    assert.equal(called, true)
  })

  await t.test('should throw if errors are not listened to', async function () {
    const tr = stream(proc)
    tr.pipe(new nodeStream.PassThrough())

    assert.throws(function () {
      tr.emit('error', new Error('Whoops!'))
    }, /Whoops!/)
  })

  await t.test(
    'should trigger `data` with the processed result',
    async function () {
      let called = false
      const tr = stream(proc)

      tr.pipe(new nodeStream.PassThrough())
        .on('data', function (/** @type {Buffer} */ buf) {
          assert.equal(String(buf), 'alphabravocharlie')
          called = true
        })
        .on('error', function () {
          assert.fail()
        })

      tr.write('alpha')
      tr.write('bravo')
      tr.end('charlie')

      assert.equal(called, true)
    }
  )
})

/**
 * @type {import('unified').Plugin<[], string, Node>}
 */
function parse() {
  /** @type {Processor} */
  // @ts-expect-error: TS is wrong about `this`.
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
  const self = this

  self.compiler = compiler

  /** @type {import('unified').Compiler<Node, string>} */
  function compiler(node) {
    return 'value' in node ? String(node.value) : ''
  }
}
