# Cutline

> The axes are real. Somebody chose where to slice.

An open political typology. Twenty-four statements, four independent axes, a
four-letter type — and, unlike every other sixteen-type system, **the margin by
which each letter was assigned**.

It is named for the thing it makes visible. An axis is continuous; a letter is
not. Somewhere between them is a line that somebody drew, and on which nothing
in the data insists. Cutline shows you where you fell relative to that line, and
how close it was.

Live version: **<https://theaxes.fyi/quiz/types/>**

---

## Why this is open

MBTI is a trademark. Using it properly means licensing it, per seat, from a
company that certifies practitioners. The format it popularised — four axes
collapsed into four letters — is not itself anyone's property, and it should
not behave as though it is.

So the instrument here is **CC BY-SA 4.0**. Fork it, translate it, run it
commercially, build a better front end. The one condition is share-alike: a
derivative of the instrument stays under the same licence. It cannot be
enclosed. The reference code is MIT, so you can do what you like with that.

The argument the instrument makes is about flattening — that a single left/right
line erases most of the information about a political position. It would be a
strange argument to make from behind a licence fee.

## The Cutline Score

A type is only as firm as its weakest letter, so the score **is** the weakest letter:

```
cutline_score = round(min(|score|) × 100)     // 0–100
```

| Score | Band | Meaning |
| --- | --- | --- |
| 0–9 | Coin toss | One answer from being a different type. |
| 10–29 | A lean | A tendency, not a conviction. |
| 30–59 | Settled | Comfortably inside the box. |
| 60–100 | Emphatic | Deep in it. The box fits. |

It is deliberately unflattering. A respondent one answer away from another type scores near zero however emphatic the other three axes were — because that is the true state of their classification.

## Hosted API

You can implement the instrument yourself; this exists so you don't have to. No key, no signup, CORS open.

```
GET  https://cutline.felineunion.org/api/v1/instrument
GET  https://cutline.felineunion.org/api/v1/types
GET  https://cutline.felineunion.org/api/v1/types/CLIR
POST https://cutline.felineunion.org/api/v1/score
```

```sh
curl -s https://cutline.felineunion.org/api/v1/score \
  -H 'Content-Type: application/json' \
  -d '{"answers":["agree","disagree","agree", ... ]}'
```

```json
{
  "code": "CLIR",
  "type": { "code": "CLIR", "name": "The Anarchist", "quadrant": "CL" },
  "cutline_score": 4,
  "band": "Coin toss",
  "summary": "CLIR — Cutline Score 4/100. The method letter was decided by 4 points out of 100; change one answer and it reads CLIG.",
  "margins": [ ... ]
}
```

`answers` is one scale id per statement, in statement order: `agree`, `agree-soft`, `neutral`, `disagree-soft`, `disagree`.

## The honest part

Sixteen-type systems report a code and stop. This one reports the code **and the
arithmetic that produced it**, because the code is a compression: it keeps the
sign of each score and throws away the magnitude.

Two consequences the spec requires implementations to honour:

- **Thin margins are reported.** A letter assigned by four points out of a
  hundred is not the same claim as one assigned by ninety, and printing them
  identically is the flaw. An implementation should say when a letter was a coin
  toss, and name the type the respondent would have received otherwise.
- **A null answer sheet gets no type.** Every axis is signed-balanced, so
  agreeing with all twenty-four statements scores zero on all four — as does
  disagreeing with all of them, or answering neutral throughout. Four sign tests
  would still emit a confident code assembled entirely out of rounding. The
  instrument declines instead.

If you add a tie-break so that every respondent always receives a type, you have
reimplemented the thing this instrument was built to criticise. Please don't.

## The axes

| Axis | Letters | Runs from |
| --- | --- | --- |
| Ownership | `C` / `P` | collective ↔ private |
| Control | `A` / `L` | centralized ↔ decentralized |
| Horizon | `N` / `I` | national ↔ internationalist |
| Method | `G` / `R` | gradual ↔ rupture |

The first two letters are a standard political compass quadrant. The second two
cut each quadrant into four, which is the whole trick behind every sixteen-type
system: two more axes, nothing mystical.

## Files

| Path | What it is |
| --- | --- |
| `instrument.json` | The whole instrument: axes, 24 statements with weights, scoring rules, 16 type definitions. This is the thing that is licensed. |
| `score.mjs` | Reference scoring implementation. No dependencies. |
| `examples/run.mjs` | Runnable examples, including the two no-reading cases. |
| `LICENSE` | CC BY-SA 4.0 — the instrument. |
| `LICENSE-CODE` | MIT — the code. |

## Use it

```sh
node examples/run.mjs
```

```js
import { readFileSync } from 'node:fs'
import { score, marginSummary } from './score.mjs'

const instrument = JSON.parse(readFileSync('instrument.json', 'utf8'))

// one scale id per statement, in order:
// 'agree' | 'agree-soft' | 'neutral' | 'disagree-soft' | 'disagree'
const answers = new Array(24).fill('neutral')

const result = score(instrument, answers)
console.log(marginSummary(result))
// -> No reading: within a few points of the midpoint on every axis.
```

`score()` returns `{ noReading, code, type, quadrant, scores, margins }`.
`scores` are in `[-1, 1]` per axis; each entry in `margins` carries the raw
score, its distance from the cut in points, whether it was thin, and the code
the respondent would have received had that cut fallen the other way.

## Scoring, in full

1. Each scale option has a multiplier: `1, 0.5, 0, -0.5, -1`.
2. For each statement, add `multiplier × weight` to every axis it carries a
   weight on. Most statements load one axis; a few load a second, where the
   position genuinely implies one.
3. Divide each axis total by the sum of the absolute weights on that axis. The
   result is in `[-1, 1]`.
4. Negative takes the axis's negative letter, otherwise the positive letter.

Every axis's weights sum to zero. That balance is not decorative — it is what
makes blanket agreement a null result instead of a political position the
instrument invented. `instrument.json` is generated by a script that refuses to
emit a file if any axis has drifted out of balance.

## Attribution

Built for [theaxes.fyi](https://theaxes.fyi), a teaching site arguing that the
left/right spectrum is a flattened map and the honest frame is a grid. The
thesis originates with [@flipkoin2](https://x.com/flipkoin2).

If you fork the instrument, CC BY-SA asks you to credit Cutline / theaxes.fyi
and keep your version under the same licence.
