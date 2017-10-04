import D3Node from 'd3-node'
import BasePlot from './base'

class LineChart extends BasePlot {
  constructor (range = { x: undefined, y: undefined }, line = true, dots = false) {
    super({
      doc: {
        size: { w: 3000, h: 1080 },
        margin: { top: 0, bottom: 0 },
        padding: 100
      },
      line: {
        show: line,
        width: 1.0,
        opacity: 1.0,
        color: 'black',
        curve: false
      },
      grid: {
        show: line,
        width: 1.0,
        opacity: 1.0
      },
      dot: { show: dots, radius: 2 },
      tick: { size: { x: 40, y: 100 }, padding: 5 },
      range
    })
  }

  async makePlot (title = undefined) {
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
        _opts = _ctx._options,
        _width = _opts.doc.size.w - _opts.doc.margin.left - _opts.doc.margin.right,
        _height = _opts.doc.size.h - _opts.doc.margin.top - _opts.doc.margin.bottom,
        _lineChart = d3.line().x(d => scale.x(d.key)).y(d => scale.y(d.value))

      if (_opts.line.curve) _lineChart.curve(d3.curveBasis)
      const svg = d3n.createSVG(_width + _opts.doc.padding * 2, _height + _opts.doc.padding * 2)
        .append('g').attr('transform', `translate(${_opts.doc.margin.left + _opts.doc.padding}, ` +
          `${_opts.doc.margin.top + _opts.doc.adding})`)

      const g = svg.append('g'),
        scale = { x: d3.scaleLinear().rangeRound([0, _width]), y: d3.scaleLinear().rangeRound([_height, 0]) },
        axis = {
          x: d3.axisBottom(scale.x).tickSize(_opts.tick.size.x).tickPadding(_opts.tick.padding),
          y: d3.axisLeft(scale.y).tickSize(_opts.tick.size.y).tickPadding(_opts.tick.padding)
        }

      let data = _ctx.data
      if (data.length && Array.isArray(data[0])) data = data[0]
      const domainDataX = _opts.range.x ? [{key: _opts.range.x.min}, {key: _opts.range.x.max}] : data,
        domainDataY = _opts.range.y ? [{value: _opts.range.y.min}, {value: _opts.range.y.max}] : data

      scale.x.domain(d3.extent(domainDataX, d => d.key))
      scale.y.domain(d3.extent(domainDataY, d => d.value))

      function makeGridlinesX () { return d3.axisBottom(scale.x).ticks(_opts.tick.size.x) }
      function makeGridlinesY () { return d3.axisLeft(scale.y).ticks(_opts.tick.size.y) }

      if (title) {
        g.append('text')
          .style('font-family', 'Helvetica Neue').style('font-size', '72px')
          .attr('x', 0).attr('y', _opts.tick.padding * -0.5)
          .text(title)
      }
      g.append('g')
        .attr('stroke-width', _opts.grid.width)
        .style('opacity', _opts.grid.opacity)
        .attr('transform', `translate(0, ${_opts.doc.size.h})`)
        .call(makeGridlinesX().tickSize(-_height).tickFormat(''))
      g.append('g')
        .attr('transform', `translate(0, ${_height})`)
        .style('font-size', '48px')
        .call(axis.x)
      g.append('g')
        .attr('stroke-width', _opts.grid.width)
        .style('opacity', _opts.grid.opacity)
        .call(makeGridlinesY().tickSize(-_width).tickFormat(''))
      g.append('g').style('font-size', '48px').call(axis.y)

      if (_ctx.data.length && !Array.isArray(_ctx.data[0])) _ctx.data = [_ctx.data]
      for (let i = 0; i < _ctx.data.length; i++) {
        if (_ctx._options.line.show) {
          g.append('path')
            .datum(_ctx.data[i])
            .style('opacity', _opts.line.opacity)
            .attr('fill', 'none')
            .attr('stroke', _opts.line.color)
            .attr('stroke-width', _opts.line.width)
            .attr('d', _lineChart)
        }
        if (_ctx._options.dot.show) {
          g.selectAll('.dot')
            .data(_ctx.data[i])
            .enter().append('circle')
            .attr('cx', function (d) { return scale.x(d.key) })
            .attr('cy', function (d) { return scale.y(d.value) })
            .attr('r', _opts.dot.radius)
        }
      }

      resolve(d3n.svgString())
    })
  }
}

export default LineChart
