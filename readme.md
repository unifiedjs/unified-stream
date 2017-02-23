# unified-stream [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Module to add a streaming interface to [unified][] processors.

Note that the interface is streaming, but the code buffers.

## Installation

[npm][]:

```bash
npm install unified-stream
```

## Usage

The below example pipes stdin, into an HTML formatter, to stdout.

```js
var stream = require('unified-stream');
var rehype = require('rehype');
var format = require('rehype-format');

process.stdin
  .pipe(stream(rehype().use(format)))
  .pipe(process.stdout);
```

## API

### `createStream(processor)`

Create a readable/writable stream that transforms with `processor`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/unifiedjs/unified-stream.svg

[travis]: https://travis-ci.org/unifiedjs/unified-stream

[codecov-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-stream.svg

[codecov]: https://codecov.io/github/unifiedjs/unified-stream

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[unified]: https://github.com/unifiedjs/unified
