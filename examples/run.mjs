#!/usr/bin/env node
// Runnable examples. From the repo root:  node examples/run.mjs
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { score, marginSummary } from '../score.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const instrument = JSON.parse(readFileSync(join(__dirname, '..', 'instrument.json'), 'utf8'))

const SCALE = instrument.scale.map(s => s.id)   // index 0..4, strong agree -> strong disagree
const from = idx => idx.map(i => SCALE[i])

const cases = [
  {
    label: 'A respondent with one razor-thin letter',
    note: 'This is the run the site\'s video explainer films: C·L·I·R, with the method letter decided by 4 points out of 100.',
    answers: from([0,4,0,4,0,4,4,0,4,0,4,0,4,0,4,0,0,4,4,0,0,4,0,0]),
  },
  {
    label: 'Neutral on everything',
    note: 'The instrument declines to type. Four sign tests on four zeroes would still emit a code.',
    answers: from(new Array(24).fill(2)),
  },
  {
    label: 'Agrees with every statement',
    note: 'Also no reading — every axis is signed-balanced, so blanket agreement cancels to zero. Acquiescence is not a position.',
    answers: from(new Array(24).fill(0)),
  },
]

for (const c of cases) {
  const r = score(instrument, c.answers)
  console.log(`\n=== ${c.label} ===`)
  console.log(c.note)
  console.log(`  ${marginSummary(r)}`)
  if (!r.noReading) console.log(`  ${r.type.name} · ${r.quadrant.name}`)
  for (const m of r.margins) {
    const arrow = m.letter ? ` -> ${m.letter}` : ' -> (no letter issued)'
    const flip = m.flipped ? `   (coin toss; would read ${m.flipped})` : ''
    console.log(`    ${m.name.padEnd(10)} ${String(m.points).padStart(3)} pts${arrow}${flip}`)
  }
}
console.log()
