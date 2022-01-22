# Rust Component Tracker

[https://github.com/rust-lang/rustup-components-history]

A webpage used to track Rust nightly component availability (heavily inspired by [https://github.com/rust-lang/rustup-components-history](https://github.com/rust-lang/rustup-components-history)).

## Features

- Supports 30 days of rust component history (todo: maybe more)
- Supports viewing and comparing different targets and components side by side
- Supports sharing URLs

## Development

Before you begin, ensure the following programs are available on your machine:

- [`yq`](https://github.com/mikefarah/yq)
- [`npm`](https://www.npmjs.com/)

Assuming npm is installed on your machine, the standard npm commands can be run to build and test all projects in the workspace:

```bash
npm install
npm run build
npm run lint
npm run dev
```

### Releasing

Any commit to `main` will trigger a release. The release pipeline is also run nightly.

## Why another tracker?

Basically I wanted a bit more information (history) and the ability to filter and compare different targets and components side by side.
