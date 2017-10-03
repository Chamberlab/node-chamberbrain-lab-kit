import BaseCommand from './base'
import * as filters from '../util/filter'

class LogCommand extends BaseCommand {
  constructor () {
    super('log')
    this._log = {}
    this._counts = {}
  }

  get log () {
    return this._log
  }
  get counts () {
    return this._counts
  }

  execute (id, ...args) {
    if (args.length > 1) {
      if (!this._log[id] || !Array.isArray(this._log[id].entries)) this._log[id] = {entries: []}
      const dataCopy = [args[0], Object.assign({}, args[1])],
        count = filters.removePrefixedFromArray(Object.keys(dataCopy[1])).length.toString()
      this._log[id].entries.push(dataCopy)
      if (count !== '0') {
        if (typeof this._counts[count] === 'number') {
          this._counts[count]++
        }
        else {
          this._counts[count] = 1
        }
      }
    }
  }
}

export default LogCommand
