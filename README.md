# The World Today — 25 November 2026

[![make.fun](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/c/news-image-20261125)
[![Rank](https://make.fun/badge/news-image-20261125/teguharifiant/makefun-news-20261125/rank.svg)](https://make.fun/c/news-image-20261125)
[![Reward](https://make.fun/badge/news-image-20261125/teguharifiant/makefun-news-20261125/reward.svg)](https://make.fun/c/news-image-20261125)

A one-image newspaper front page summing up the world news of
**Wednesday 25 November 2026**, built for the make.fun bounty
[news-image-20261125](https://make.fun/c/news-image-20261125).

## The day's news

- **Lead — Washington, cyber attack:** hackers broke into an
  unclassified open-source intelligence system used by the CIA and the
  Office of the Director of National Intelligence. No classified data
  was hit. Early signs point to China, but it is not clear if its
  government was involved.
- **Middle East:** a Houthi drone struck the Saudi capital's tallest
  tower in Riyadh, wounding 11 people — the second strike on the
  Public Investment Fund tower in under a week.
- **Markets:** shares fell across Asia as fresh US tariff threats hit
  sentiment. Seoul fell 5.3%, Taiwan 5.1% and Tokyo 2.9%.
- **Ukraine war:** President Zelenskiy confirmed Ukraine hit a Russian
  cargo ship in the Gulf of Finland. Moscow called the attacks
  "terrorism".
- **Africa — health:** the WHO evacuated health workers from a
  hospital in Ituri, DR Congo, after three days sheltering from fierce
  fighting at the heart of the Ebola outbreak.
- **Also today:** Giuliani gets the Medal of Freedom; Huawei guilty on
  10 of 12 counts, including stealing trade secrets; turkeys Freedom
  and Feathers spared for Thanksgiving.

## How it works

`main.ts` (Node 22, standard library only) draws the whole front page
in code — a small 5x7 pixel font, simple shapes, and a PNG encoder
written from scratch — and writes a deterministic 1024x1024 PNG to
`/output/entry.png`. No network is used. Running it twice produces
byte-identical output.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
