# unified-stream

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Streaming interface for [`unified`][unified].

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`stream(processor)`](#streamprocessor)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package turns a unified processor into a (duplex) Node.js stream.

> 👉 **Note**: the interface is streaming but the code buffers.

## When should I use this?

You can use this if you have to use Node streams and are integrating with
unified.
As the code actually buffers, in almost all cases, you can use `unified` itself.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install unified-stream
```

## Use

```js
import {stream} from 'unified-stream'
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'

// Pipe stdin, into an HTML formatter, to stdout.
process.stdin
  .pipe(
    stream(unified().use(rehypeParse).use(rehypeFormat).use(rehypeStringify))
  )
  .pipe(process.stdout)
```

## API

This package exports the identifier `stream`.
There is no default export.

### `stream(processor)`

Create a duplex (readable/writable) Node.js stream that transforms with `processor`.

## Types

This package is fully typed with [TypeScript][].
It exports the additional type `MinimalDuplex`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

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

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/main/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/main/support.md

[coc]: https://github.com/unifiedjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified
