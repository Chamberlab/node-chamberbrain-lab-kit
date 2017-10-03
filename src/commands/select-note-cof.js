import BaseCommand from './base'
import assert from 'assert'
import tonal from 'tonal/build'

class SelectNoteCOF extends BaseCommand {
  constructor (root = 'C', octave = 3, offset = 0, clockwise = true) {
    super('sel_note_cof')
    this._root = root
    this._octave = octave
    this._offset = offset
    this._position = 0
    this._clockwise = (clockwise)
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

  get offset () {
    return this._offset
  }
  set offset (val) {
    assert.equal(typeof val, 'number', 'Offset must be of type number')
    this._offset = val
  }

  get position () {
    return this._position
  }
  set position (val) {
    assert.equal(typeof val, 'number', 'Position must be of type number')
    this._position = val
  }

  get clockwise () {
    return this._clockwise
  }
  set clockwise (val) {
    assert.equal(typeof val, 'boolean', 'Clockwise must be of type bool')
    this._clockwise = val
  }

  get range () {
    const notes = tonal.range.fifths(`${this._root}${this._octave}`,
      [this._offset, this._position * (this._clockwise ? 1 : -1)])
    return notes
  }
}

export default SelectNoteCOF
