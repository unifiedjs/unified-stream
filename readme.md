# unified-stream [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Streaming interface to [unified][] processors.

Note that the interface is streaming, but the code buffers.

## Installation

[npm][]:

```bash
npm install unified-stream
```

## Usage

The below example pipes stdin, into an HTML formatter, to stdout.

```js
var stream = require('unified-stream')
var rehype = require('rehype')
var format = require('rehype-format')

process.stdin.pipe(stream(rehype().use(format))).pipe(process.stdout)
```

## API

### `createStream(processor)`

Create a readable/writable stream that transforms with `processor`.

## Contribute

See [`contributing.md` in `unifiedjs/unified`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/unifiedjs/unified-stream.svg

[travis]: https://travis-ci.org/unifiedjs/unified-stream

[codecov-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-stream.svg

[codecov]: https://codecov.io/github/unifiedjs/unified-stream

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: http://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[contributing]: https://github.com/unifiedjs/unified/blob/master/contributing.md

[coc]: https://github.com/unifiedjs/unified/blob/master/code-of-conduct.md
