/**
 * score.mjs — reference implementation for the theaxes 16 political types.
 * MIT licensed. The instrument it scores (instrument.json) is CC BY-SA 4.0.
 *
 * No dependencies, no build step, no framework. Node 18+ or any browser.
 *
 *   import { score } from './score.mjs'
 *   const instrument = JSON.parse(await readFile('instrument.json', 'utf8'))
 *   const result = score(instrument, answers)
 *
 * `answers` is an array of 24 scale ids ('agree', 'agree-soft', 'neutral',
 * 'disagree-soft', 'disagree'), one per statement, in statement order. A null
 * or missing entry is treated as 'neutral'.
 */

export function score(instrument, answers) {
  const { axes, scale, statements, scoring, types, quadrants } = instrument

  if (answers.length !== statements.length) {
    throw new Error(`expected ${statements.length} answers, got ${answers.length}`)
  }

  const mult = Object.fromEntries(scale.map(s => [s.id, s.multiplier]))
  const raw = {}, max = {}
  for (const a of axes) { raw[a.key] = 0; max[a.key] = 0 }

  statements.forEach((st, i) => {
    const id = answers[i] == null ? 'neutral' : answers[i]
    if (!(id in mult)) throw new Error(`statement ${i + 1}: unknown scale id "${id}"`)
    const m = mult[id]
    for (const [key, w] of Object.entries(st.weights)) {
      raw[key] += m * w
      max[key] += Math.abs(w)
    }
  })

  const scores = {}
  for (const a of axes) scores[a.key] = max[a.key] ? raw[a.key] / max[a.key] : 0

  // Sitting on every cut at once is not a type. Four sign tests would still
  // emit a confident code, assembled entirely out of rounding.
  const noReading = axes.every(a => Math.abs(scores[a.key]) < scoring.no_reading.threshold)

  const letters = axes.map(a => (scores[a.key] < 0 ? a.negative.letter : a.positive.letter))
  const code = letters.join('')

  const margins = axes.map((a, i) => {
    const v = scores[a.key]
    const thin = Math.abs(v) < scoring.thin_margin.threshold
    const other = v < 0 ? a.positive.letter : a.negative.letter
    return {
      axis: a.key,
      name: a.name,
      score: v,
      points: Math.round(Math.abs(v) * 100),
      letter: letters[i],
      toward: v < 0 ? a.negative.label : a.positive.label,
      thin,
      // the type this respondent would have been handed had the cut fallen the other way
      flipped: thin ? letters.slice(0, i).join('') + other + letters.slice(i + 1).join('') : null,
    }
  })

  if (noReading) {
    // No code was issued, so there is no letter to report and nothing to flip
    // from. Reporting either would re-introduce the phantom type this branch
    // exists to withhold.
    return {
      noReading: true, code: null, type: null, quadrant: null, scores,
      margins: margins.map(m => ({ ...m, letter: null, toward: null, flipped: null })),
    }
  }

  return {
    noReading: false,
    code,
    type: types[code],
    quadrant: quadrants[code.slice(0, 2)],
    scores,
    margins,
  }
}

/** Convenience: the headline sentence an implementation should not omit. */
export function marginSummary(result) {
  if (result.noReading) {
    return 'No reading: within a few points of the midpoint on every axis. A type here would be manufactured out of rounding.'
  }
  const thin = result.margins.filter(m => m.thin)
  if (!thin.length) {
    const min = Math.min(...result.margins.map(m => m.points))
    return `${result.code} — every cut cleared by at least ${min} points.`
  }
  const m = thin[0]
  return `${result.code} — but the ${m.name.toLowerCase()} letter was decided by ${m.points} points out of 100. ` +
         `Change one answer and it reads ${m.flipped}.`
}
