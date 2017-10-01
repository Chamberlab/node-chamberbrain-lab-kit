const syncMap = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]
const noteBands = ['0.010x0.015', '0.015x0.020', '0.020x0.025', '0.025x0.030', '0.030x0.035', '0.035x0.040', '0.040x0.045']
const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const degrees = ['IV', 'I', 'V', 'II', 'VI', 'III', 'VII']
const modes = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian']
const chordMap = {
  IV: ['5', 'M', 'sus2', 'M6', 'Maj7', 'M7b5', 'Madd9', 'M69', 'M79', 'M7#11', 'M79#11', '13#11'],
  I: ['5', 'M', 'sus2', 'sus4', 'M6', 'Maj7', 'Madd9', 'M69', 'Maj79', 'M913'],
  V: ['5', 'M', 'sus2', 'sus4', 'M6', '7', '7sus4', 'Madd9', 'M69', 'Maj79', '9', 'm79', '119sus4', '13'],
  II: ['5', 'sus2', 'sus4', 'm', 'm6', '7sus4', 'm7', 'madd9', 'm69', 'm79', '119sus4', '7add4'],
  VI: ['5', 'sus2', 'sus4', 'm', '7sus4', 'm7', 'madd9', '119sus4', 'm11', 'm911', 'm7911'],
  III: ['5', 'sus4', 'm', '7sus4', 'm7', 'm7b9', '7add4'],
  VII: ['b5', 'mb5', 'm7b5']
}

export {
  syncMap,
  noteBands,
  roots,
  degrees,
  modes,
  chordMap
}
