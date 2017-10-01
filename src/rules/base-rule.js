class BaseRule {
  constructor (id) {
    this._id = id
    this._data = []
    this._maxBuffer = 1
  }
  _evaluate () {
    return false
  }

  get id () {
    return this._id
  }

  get data () {
    return this._data
  }
  set data (val) {
    if (val) {
      const len = this._data.unshift(val)
      if (this.maxBuffer && len > this.maxBuffer) this._data.splice(this.maxBuffer)
    }
    else {
      this._data = []
    }
  }

  get maxBuffer () {
    return this._maxBuffer
  }
  set maxBuffer (val) {
    this._maxBuffer = val
  }

  get bufferSize () {
    return this._data.length
  }
  get state () {
    return this._evaluate()
  }
}

export default BaseRule
