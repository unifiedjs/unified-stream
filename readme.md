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
    *   [`MinimalDuplex`](#minimalduplex)
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
In Node.js (version 16+), install with [npm][]:

```sh
npm install unified-stream
```

In Deno with [`esm.sh`][esm-sh]:

```js
import {stream} from 'https://esm.sh/unified-stream@3'
```

In browsers with [`esm.sh`][esm-sh]:

```html
<script type="module">
  import {stream} from 'https://esm.sh/unified-stream@3?bundle'
</script>
```

## Use

```js
import process from 'node:process'
import rehypeFormat from 'rehype-format'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'
import {stream} from 'unified-stream'

// Pipe stdin, into an HTML formatter, to stdout.
process.stdin
  .pipe(
    stream(unified().use(rehypeParse).use(rehypeFormat).use(rehypeStringify))
  )
  .pipe(process.stdout)
```

## API

This package exports the identifier [`stream`][api-stream].
There is no default export.

### `stream(processor)`

Create a duplex (readable and writable) stream that transforms with
`processor`.

###### Parameters

*   `processor` ([`Processor`][processor])
    — unified processor

###### Returns

Duplex stream ([`MinimalDuplex`][api-minimal-duplex]).

### `MinimalDuplex`

Simple readable and writable ([duplex][]) stream (TypeScript type).

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`MinimalDuplex`][api-minimal-duplex].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `unified-stream@^3`,
compatible with Node.js 16.

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

[esm-sh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/main/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/main/support.md

[coc]: https://github.com/unifiedjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[processor]: https://github.com/unifiedjs/unified#processor

[duplex]: https://nodejs.org/api/stream.html#class-streamduplex

[api-stream]: #streamprocessor

[api-minimal-duplex]: #minimalduplex
