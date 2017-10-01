import BaseCommand from './base'

class LogCommand extends BaseCommand {
  constructor () {
    super('log')
    this._log = {}
    this._counts = []
  }

  get log () {
    return this._log
  }
  get counts () {
    return this._counts
  }

  execute (id, ...args) {
    if (!this._log[id] || !Array.isArray(this._log[id].entries)) this._log[id] = { entries: [] }
    this._log[id].entries.push(args)
    if (args.length > 1 && this._counts.indexOf(Object.keys(args[1]).filter(key => { return key[0] !== '_' }).length) === -1) {
      this._counts.push(Object.keys(args[1]).filter(key => { return key[0] !== '_' }).length)
    }
  }
}

export default LogCommand
