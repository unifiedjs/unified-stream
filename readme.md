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

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install unified-stream
```

## Use

The below example pipes stdin, into an HTML formatter, to stdout.

```js
import {stream} from 'unified-stream'
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'

process.stdin
  .pipe(
    stream(unified().use(rehypeParse).use(rehypeFormat).use(rehypeStringify))
  )
  .pipe(process.stdout)
```

## API

This package exports the following identifiers: `stream`.
There is no default export.

### `stream(processor)`

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

[build-badge]: https://github.com/unifiedjs/unified-stream/workflows/main/badge.svg

[build]: https://github.com/unifiedjs/unified-stream/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-stream.svg

[coverage]: https://codecov.io/github/unifiedjs/unified-stream

[downloads-badge]: https://img.shields.io/npm/dm/unified-stream.svg

[downloads]: https://www.npmjs.com/package/unified-stream

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/unifiedjs/unified/discussions

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/HEAD/support.md

[coc]: https://github.com/unifiedjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified
