import assert from 'assert'
import { ChannelMatrix, filters } from '../util'

class BaseRuleset {
  constructor (matrixId = undefined) {
    this._entries = {}
    this._matrixId = matrixId
    this._matrix = matrixId ? ChannelMatrix.getMatrixById(this._matrixId) : undefined
    this._grouping = []

    if (this.matrix) {
      for (let n = 0; n < filters.removePrefixedFromArray(Object.keys(this.matrix)).length; n++) {
        const channels = ChannelMatrix.collectChannelIds(this.matrix, n, 1)
        if (channels.length) this.grouping.push(channels)
      }
    }
    else this.grouping.push([])
  }

  evaluate (frame, millis) {
    const data = []
    for (let v of frame) data.push(v)
    for (let entryId in this._entries) {
      const entry = this._entries[entryId]
      // TODO: to copy or not to copy?!
      entry.rule.data = data
      let state = entry.rule.state
      if (entry.condition(state)) {
        for (let cmd of entry.commands) {
          cmd.execute(entry.id, millis, state)
        }
      }
    }
  }
  addEntry (entry) {
    assert.notEqual(typeof entry, 'undefined', 'Rule cannot be undefined')
    assert.equal(typeof entry.id, 'string', 'Rule id must be string')
    this._entries[entry.id] = entry
  }

  get entries () {
    return this._entries
  }

  get grouping () {
    return this._grouping
  }
  get matrix () {
    return this._matrix
  }
}

export default BaseRuleset
