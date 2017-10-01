import BaseCommand from './base'
import assert from 'assert'
import * as hm from '../util/harmonic-matrix'

class SetDegree extends BaseCommand {
  constructor (roman = 'I', root = 'C', octave = 3) {
    super('sel_note_cof')
    this._roman = roman
    this._root = root
    this._octave = octave
  }

  get roman () {
    return this._name
  }
  set roman (val) {
    assert.equal(typeof val, 'string', 'Roman numeral must be of type string')
    this._name = val
  }

  get root () {
    return this._root
  }
  set root (val) {
    assert.equal(typeof val, 'string', 'Root must be of type string')
    this._root = val
  }

  get octave () {
    return this._octave
  }
  set octave (val) {
    assert.equal(typeof val, 'number', 'Octave must be of type number')
    this._octave = val
  }

  get note () {
    return hm.degrees[this._degree]
  }
}

export default SetDegree
