import tonal from 'tonal/build'

class Harmonics {
  static getScale (root = 'C', mode = 'lydian', octave = undefined) {
    return tonal.scale.notes(`${root}${octave || ''} ${mode}`)
  }
  static getIntervals (root = 'C', mode = 'lydian', octave = undefined) {
    return tonal.scale.intervals(`${root}${octave || ''} ${mode}`)
  }
  static getMidiFromNotes (notes) {
    if (!Array.isArray(notes)) notes = [notes]
    return notes.map(note => tonal.note.midi(note))
  }
}

export default Harmonics
