import 'colors'
import assert from 'assert'
import moment from 'moment'
import microtime from 'microtime'
import Logger from './logger'

class Stats {
  constructor () {
    this._entries = 0
    this._errors = 0
    this._start = moment()
    this._frameTime = 0
  }
  addEntries (count = 1) {
    assert.equal(typeof count, 'number')
    this._entries += count
  }
  addErrors (count = 1) {
    assert.equal(typeof count, 'number')
    this.addEntries(count)
    this._errors += count
  }
  print () {
    let stats = '\n'
    stats += `STATS ${new Array(66).fill('-').join('')}\n`.cyan
    stats += '\n'
    stats += `Task started:   ${this.start.format('MM/DD/YYYY HH:mm:ss')}\n`
    stats += `Task ended:     ${moment().format('MM/DD/YYYY HH:mm:ss')}\n`
    stats += `Time spent:     ${this.start.toNow(true)}\n`.yellow
    stats += '\n'
    stats += `Rows total:     ${this.entries}\n`.yellow
    stats += `Rows imported:  ${this.imported}\n`.green
    stats += `Rows failed:    ${this.errors}\n`.red
    stats += '\n'
    process.stdout.write(stats + '\n')
  }
  getFrameDiff () {
    Logger.debug(`Diff: ${this.micros}μs`, 'cl:scheduler')
    this.micros = microtime.now()
  }
  checkSlowFrame (interval) {
    if (this.workTime > interval.micros) {
      Logger.debug(`SLOW FRAME: ${this.workTime - interval.micros}μs\` over limit`.red, 'cl:osc')
    }
  }
  get entries () {
    return this._entries
  }
  get imported () {
    return this.entries - this.errors
  }
  get errors () {
    return this._errors
  }
  get start () {
    return this._start
  }
  get frameTime () {
    return this._frameTime ? microtime.now() - this._frameTime : 0
  }
  set frameTime (val) {
    this._frameTime = val || microtime.now()
  }
  get workTime () {
    return this._workTime
  }
  set workTime (val) {
    this._workTime = val
  }
}

export default Stats
