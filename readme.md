# unified-stream

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Streaming interface to [unified][] processors.

Note that the interface is streaming, but the code buffers.

## Install

[npm][]:

```sh
npm install unified-stream
```

## Use

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

See [`contributing.md`][contributing] in [`unifiedjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/unifiedjs/unified-stream.svg

[build]: https://travis-ci.org/unifiedjs/unified-stream

[coverage-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-stream.svg

[coverage]: https://codecov.io/github/unifiedjs/unified-stream

[downloads-badge]: https://img.shields.io/npm/dm/unified-stream.svg

[downloads]: https://www.npmjs.com/package/unified-stream

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/master/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/master/support.md

[coc]: https://github.com/unifiedjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified
