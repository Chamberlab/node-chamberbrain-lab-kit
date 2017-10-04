import D3Node from 'd3-node'
import BasePlot from './base'

class Voronoi extends BasePlot {
  constructor (range = { x: undefined, y: undefined }, polygons = true, dots = true) {
    super({
      polygons,
      dots,
      range
    })
  }

  async makePlot (width, height, padding = 0) {
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
        data = _ctx.data,
        xScale = d3.scaleLinear().rangeRound([0, width]),
        yScale = d3.scaleLinear().rangeRound([height, 0]),
        voronoi = d3.voronoi().extent([[-1, -1], [width + 1, height + 1]]),
        svg = d3n.createSVG(width + padding * 2, height + padding * 2)
          .append('g')
          .style('background', 'black')
          .attr('transform', `translate(${padding}, ${padding})`)

      xScale.domain(d3.extent(data, (d, i) => i))
      yScale.domain(d3.extent(data, (d, i) => i === 0 ? -0.05 : 0.05))

      const sites = [].slice.call(data).map((d, i) => {
        return [xScale(i), yScale(d)]
      })

      svg.append('g')
        .attr('class', 'polygons')
        .selectAll('path')
        .data(voronoi.polygons(sites))
        .enter().append('path')
        .attr('d', (d) => d ? 'M' + d.join('L') + 'Z' : null)
        .attr('stroke', 'white')

      svg.append('g')
        .selectAll('circle')
        .data(sites)
        .enter().append('circle')
        .style('fill', 'white')
        .attr('r', 2.5)
        .attr('cx', (d) => d[0])
        .attr('cy', (d) => d[1])

      resolve(d3n.svgString())
    })
  }
}

export default Voronoi
