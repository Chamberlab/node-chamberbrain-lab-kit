import Fragment from './fragment'
import uuid4 from 'uuid/v4'

class View {
  constructor (layout = {}, meta = {}) {
    this._id = uuid4()
    this._layout = layout
    this._meta = meta
    this._data = this.init()
  }

  get id () {
    return this._id
  }
  set id (val) {
    this._id = val
  }
  get layout () {
    return this._layout || {}
  }
  get meta () {
    return this._meta || {}
  }
  get data () {
    return this._data || {}
  }

  init () {
    const data = {}
    Object.keys(this.layout).forEach(label => {
      data[uuid4()] = new Fragment(this.layout[label])
    })
    return data
  }
  toJSON () {
    return JSON.stringify({
      id: this.id,
      layout: this.layout
    }, null, ' ')
  }
}

export default View
