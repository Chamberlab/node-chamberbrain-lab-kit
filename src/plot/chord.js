import D3Node from 'd3-node'
import BasePlot from './base'
import { getHSLFromRadians } from '../util'

class Chord extends BasePlot {
  constructor (ringWidth = 30, padding = 0) {
    super({
      ringWidth,
      padding
    })
  }

  async makePlot (width, height) {
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
        innerRadius = outerRadius - _ctx._options.ringWidth,
        data = _ctx.data,
        chord = d3.chord().padAngle(0.05),
        arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius),
        ribbon = d3.ribbon().radius(innerRadius),
        svg = d3n.createSVG(width + _ctx._options.padding * 2, height + _ctx._options.padding * 2)

      const g = svg.append('g')
        .style('background', 'black')
        .attr('transform', `translate(${width * 0.5 + _ctx._options.padding},
          ${height * 0.5 + _ctx._options.padding})`)
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
