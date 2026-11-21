# csv-reader-fast

A faster drop-in replacement for csv-reader 1.0.0 — reads broken CSV files with byte-identical answers, in a fraction of the CPU time.

[![csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/didinska21/csv-reader-fast/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/didinska21/csv-reader-fast/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

Built for the [make.fun bounty "Read broken CSV files faster, 21 November 2026"](https://make.fun/bounty/csv-reader-speed-01-run-20261121).

## What it does

`solve.js` exports `run(input)` returning exactly what csv-reader 1.0.0 returns for `{text, header}`: `{columns, rows, errors}` — same broken-row policy (stray CRs, unterminated quotes, quote junk, short/long rows), same error records, but parsed with a single-pass `charCodeAt` loop and a fast path for clean lines, so it runs several times faster than the reference on multi-megabyte inputs.

## Layout

- `solve.js` — the fast parser (dependency-free ES module, repo root)
- `main.ts` — the harness driver (reads `/input/cases.json`, writes `/output/answers.json`)

## Speed

Single-pass `charCodeAt` loop with a fast path for clean lines and `indexOf` jumps between quotes. On the practice set (~11 MB, 6 cases) it runs about 2.7x faster than the csv-reader 1.0.0 reference (0.68 s vs 1.86 s wall on this machine), with byte-identical answers.

## Usage

```sh
MAKEFUN_INPUT_DIR=<input dir> MAKEFUN_OUTPUT_DIR=<output dir> node main.ts
```

`main.ts` reads `<input dir>/cases.json` and writes `<output dir>/answers.json`.
