# unified-stream

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Chat][chat-badge]][chat]

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

[build-badge]: https://img.shields.io/travis/unifiedjs/unified-stream.svg

[build]: https://travis-ci.org/unifiedjs/unified-stream

[coverage-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-stream.svg

[coverage]: https://codecov.io/github/unifiedjs/unified-stream

[downloads-badge]: https://img.shields.io/npm/dm/unified-stream.svg

[downloads]: https://www.npmjs.com/package/unified-stream

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[contributing]: https://github.com/unifiedjs/unified/blob/master/contributing.md

[coc]: https://github.com/unifiedjs/unified/blob/master/code-of-conduct.md
