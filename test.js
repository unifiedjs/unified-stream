import nodeStream from 'stream'
import test from 'tape'
import unified from 'unified'
import func from 'is-function'
import {stream} from './index.js'

test('stream', function (t) {
  var proc = unified().use(parse).use(stringify)

  t.test('interface', function (st) {
    var tr = stream(proc)
    st.equal(tr.readable, true, 'should be readable')
    st.equal(tr.writable, true, 'should be writable')
    st.ok(func(tr.write), 'should have a `write` method')
    st.ok(func(tr.end), 'should have an `end` method')
    st.ok(func(tr.pipe), 'should have a `pipe` method')
    st.end()
  })

  t.test('#end and #write', function (st) {
    var phase
    var exception

    st.plan(10)

    st.equal(stream(proc).end(), true, 'should return true')

    st.throws(
      function () {
        var tr = stream(proc)
        tr.end()
        tr.end()
      },
      /^Error: Did not expect `write` after `end`$/,
      'should throw on end after end'
    )

    stream(proc)
      .on('data', function (value) {
        st.equal(value, '', 'should emit processed `data`')
      })
      .end()

    stream(proc)
      .on('data', function (value) {
        st.equal(value, 'alpha', 'should emit given `data`')
      })
      .end('alpha')

    stream(proc)
      .on('data', function (value) {
        st.equal(value, 'brC!vo', 'should honour encoding')
      })
      .end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    phase = 0

    stream(proc)
      .on('data', function () {
        st.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
      .end('charlie', function () {
        st.equal(phase, 0, 'should trigger callback before data')
        phase++
      })

    exception = new Error('alpha')

    stream(
      proc().use(function () {
        return transformer
        function transformer() {
          return exception
        }
      })
    )
      .on('error', function (error) {
        st.equal(error, exception, 'should trigger `error` if an error occurs')
      })
      .on(
        'data',
        /* istanbul ignore next */
        function () {
          st.fail('should not trigger `data` if an error occurs')
        }
      )
      .end()

    stream(
      proc().use(function () {
        return transformer
        function transformer(tree, file) {
          file.message(exception)
        }
      })
    )
      .on('warning', function (error) {
        st.equal(
          error.reason,
          'alpha',
          'should trigger `warning` if an messages are emitted'
        )
      })
      .on('data', function (data) {
        st.equal(data, '', 'should not fail if warnings are emitted')
      })
      .end()
  })

  t.test('#pipe', function (st) {
    var tr
    var s

    st.plan(5)

    st.doesNotThrow(function () {
      // Not writable.
      var tr = stream(proc)
      tr.pipe(new nodeStream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    tr = stream(proc)
    s = new nodeStream.PassThrough()
    s._isStdio = true

    tr.pipe(s)

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')

    st.doesNotThrow(function () {
      s.write('delta')
    }, 'should not `end` stdio streams')

    tr = stream(proc).on('error', function (error) {
      st.equal(error.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new nodeStream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = stream(proc)
    tr.pipe(new nodeStream.PassThrough())

    st.throws(
      function () {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = stream(proc)

    tr.pipe(new nodeStream.PassThrough())
      .on('data', function (buf) {
        st.equal(
          String(buf),
          'alphabravocharlie',
          'should trigger `data` with the processed result'
        )
      })
      .on(
        'error',
        /* istanbul ignore next */
        function () {
          st.fail('should not trigger `error`')
        }
      )

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })
})

function parse() {
  this.Parser = parser

  function parser(doc) {
    return {type: 'root', value: doc}
  }
}

function stringify() {
  this.Compiler = compiler

  function compiler(tree) {
    return tree.value
  }
}
