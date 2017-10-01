import BaseCommand from './base'
import assert from 'assert'
import tonal from 'tonal/build'
import * as hm from '../util/harmonic-matrix'

class BuildChord extends BaseCommand {
  constructor (name = 'maj7', root = 'C', degree = 0, octave = 3) {
    super('sel_note_cof')
    this._name = name
    this._root = root
    this._degree = degree
    this._octave = octave
  }

  get name () {
    return this._name
  }
  set name (val) {
    assert.equal(typeof val, 'string', 'Name must be of type string')
    this._name = val
  }

  get root () {
    return this._root
  }
  set root (val) {
    assert.equal(typeof val, 'string', 'Root must be of type string')
    this._root = val
  }

  get degree () {
    return this._degree
  }
  set degree (val) {
    assert.equal(typeof val, 'number', 'Degree must be of type number')
    this._degree = val
  }

  get octave () {
    return this._octave
  }
  set octave (val) {
    assert.equal(typeof val, 'number', 'Octave must be of type number')
    this._octave = val
  }

  get notes () {
    return tonal.chord.get(hm.chordMap[hm.degrees[this._degree]][this._name])
  }

  buildOnScale (notes) {
    // `${getFifths(roots[index.root], 6)[index.degree]}${index.octave + octaveShift}`
    return tonal.chord.get(hm.chordMap[hm.degrees[this._degree]][this._name], notes)
  }
}

export default BuildChord
