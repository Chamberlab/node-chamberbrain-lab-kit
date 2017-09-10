import BaseCommand from './base-command'

class LogCommand extends BaseCommand {
  constructor () {
    super('log')
  }
  execute (...args) {
    console.log(this.label, JSON.stringify(args))
  }
}

export default LogCommand
