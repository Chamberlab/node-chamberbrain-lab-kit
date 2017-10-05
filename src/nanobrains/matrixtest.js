import Package from '../data/package'
import DataTypes from '../data/data-types'

import path from 'path'

const basepath = path.join(__dirname, '..', '..', 'testytest')
let _id

Promise.resolve().then(() => {
  const pkg = new Package(basepath)
  return pkg.addView({
    meta: {
      title: 'asdf',
      description: 'lorem ipsum',
      fps: 50,
      created: undefined,
      updated: undefined
    },
    layout: [
      {
        title: 'das blah',
        type: DataTypes.TYPE_FLOAT64_MATRIX,
        shape: [[1, 2, 3, 4, 5]]
      },
      {
        title: 'und dem blubb',
        type: DataTypes.TYPE_FLOAT64_MATRIX,
        shape: [[1, 2], [3, 4]],
        children: [
          {
            title: 'ViktorVektor%$§§',
            type: DataTypes.TYPE_FLOAT64_VECTOR
          }
        ]
      }
    ],
    storage: {
      type: 'lmdb',
      mapsize: 4096
    },
    key: {
      length: 16,
      precision: 6,
      signed: true
    }
  }).then(id => {
    _id = id
    return Package.save(basepath, pkg)
      .then(() => {
        console.log(pkg)
      })
  })
}).then(() => {
  return Package.load(basepath)
    .then(pkg => {
      return pkg.getViewById(_id)
        .then(view => {
          view.open()
        })
        .then(pkg => {
          console.log(pkg)
        })
    })
})
