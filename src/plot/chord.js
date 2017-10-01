import D3Node from 'd3-node'
import { getHSLFromRadians } from '../util'

class Chord {
  constructor () {
    this._data = undefined
  }

  set data (val) {
    this._data = val
  }
  get data () {
    return this._data
  }

  makePlot (width, height, ringWidth = 30, padding = 0) {
    const _ctx = this
    return new Promise(function (resolve) {
      const d3n = new D3Node({
        selector: '#chart',
        styles: '',
        container: `
          <div id="container">
            <div id="chart"></div>
          </div>
        `
      })

      const d3 = d3n.d3,
        outerRadius = Math.min(width, height) * 0.5,
        innerRadius = outerRadius - ringWidth,
        data = _ctx.data,
        chord = d3.chord().padAngle(0.05),
        arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius),
        ribbon = d3.ribbon().radius(innerRadius),
        svg = d3n.createSVG(width + padding * 2, height + padding * 2)

      const g = svg.append('g')
        .style('background', 'black')
        .attr('transform', `translate(${width * 0.5 + padding}, ${height * 0.5 + padding})`)
        .datum(chord(data))

      const group = g.append('g')
        .attr('class', 'groups')
        .selectAll('g')
        .data(function (chords) { return chords.groups })
        .enter().append('g')

      group.append('path')
        .style('fill', getHSLFromRadians)
        .attr('d', arc)

      g.append('g')
        .attr('class', 'ribbons')
        .selectAll('path')
        .data(function (chords) { return chords })
        .enter().append('path')
        .attr('d', ribbon)
        .style('fill', getHSLFromRadians)

      resolve(d3n.svgString())
    })
  }
}

export default Chord
