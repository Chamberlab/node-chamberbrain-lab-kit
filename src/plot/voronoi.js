import D3Node from 'd3-node'

class Voronoi {
  constructor (rangeY = undefined, rangeX = undefined) {
    this._data = undefined
    this._range = {
      x: rangeX,
      y: rangeY
    }
  }

  set data (val) {
    this._data = val
  }

  get data () {
    return this._data
  }

  makePlot (width, height, padding = 0) {
    const _ctx = this,
      _margin = { top: 0, right: 0, bottom: 0, left: 0 }
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

      let data = _ctx.data

      const d3 = d3n.d3
      const svg = d3n.createSVG(width + padding * 2, height + padding * 2)
        .append('g')
        .attr('transform', `translate(${_margin.left + padding}, ${_margin.top + padding})`)

      const xScale = d3.scaleLinear()
        .rangeRound([0, width])
      const yScale = d3.scaleLinear()
        .rangeRound([height, 0])

      xScale.domain(d3.extent(data, (d, i) => i))
      yScale.domain(d3.extent(data, (d, i) => i === 0 ? -0.05 : 0.05))

      const sites = [].slice.call(data).map((d, i) => {
        const durr = [xScale(i), yScale(d)]
        return durr
      })

      const voronoi = d3.voronoi().extent([[-1, -1], [width + 1, height + 1]])

      svg.append('g')
        .attr('class', 'polygons')
        .selectAll('path')
        .data(voronoi.polygons(sites))
        .enter().append('path')
        .attr('d', (d) => d ? 'M' + d.join('L') + 'Z' : null)
        .attr('stroke', 'white')
        .style('opacity', 0.7)

      svg.append('g')
        .selectAll('circle')
        .data(sites)
        .enter().append('circle')
        .style('opacity', 0.4)
        .style('fill', 'white')
        .attr('r', 2.5)
        .attr('cx', (d) => d[0])
        .attr('cy', (d) => d[1])

      resolve(d3n.svgString())
    })
  }
}

export default Voronoi
