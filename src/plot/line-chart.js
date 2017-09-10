import D3Node from 'd3-node'

class LineChart {
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

  makePlot (width, height, padding = 60) {
    const _ctx = this,
      _margin = { top: 0, right: 0, bottom: 0, left: 0 },
      _lineWidth = 0.5,
      _lineWidthGrid = 0.5,
      _lineOpacityGrid = 0.5,
      _tickSize = 40,
      _tickPadding = 5,
      _lineColor = 'black',
      _isCurve = false
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

      const d3 = d3n.d3

      const _width = width - _margin.left - _margin.right
      const _height = height - _margin.top - _margin.bottom

      const svg = d3n.createSVG(width + padding * 2, height + padding * 2)
        .append('g')
        .attr('transform', `translate(${_margin.left + padding}, ${_margin.top + padding})`)

      const g = svg.append('g')

      const xScale = d3.scaleLinear()
        .rangeRound([0, _width])
      const yScale = d3.scaleLinear()
        .rangeRound([_height, 0])
      const xAxis = d3.axisBottom(xScale)
        .tickSize(_tickSize)
        .tickPadding(_tickPadding)
      const yAxis = d3.axisLeft(yScale)
        .tickSize(_tickSize)
        .tickPadding(_tickPadding)

      const lineChart = d3.line()
        .x(d => xScale(d.key))
        .y(d => yScale(d.value))

      if (_isCurve) lineChart.curve(d3.curveBasis)

      let data = _ctx.data
      if (data.length && Array.isArray(data[0])) {
        data = data[0]
      }

      const domainDataX = _ctx._range.x ? [{key: _ctx._range.x.min}, {key: _ctx._range.x.max}] : data,
        domainDataY = _ctx._range.y ? [{value: _ctx._range.y.min}, {value: _ctx._range.y.max}] : data
      xScale.domain(d3.extent(domainDataX, d => d.key))
      yScale.domain(d3.extent(domainDataY, d => d.value))

      function makeGridlinesX () {
        return d3.axisBottom(xScale)
          .ticks(_tickSize * 2)
      }

      function makeGridlinesY () {
        return d3.axisLeft(yScale)
          .ticks(_tickSize * 2)
      }

      g.append('g')
        .attr('stroke-width', _lineWidthGrid)
        .style('opacity', _lineOpacityGrid)
        .attr('transform', `translate(0, ${_height})`)
        .call(makeGridlinesX()
          .tickSize(-_height)
          .tickFormat('')
        )

      g.append('g')
        .attr('transform', `translate(0, ${_height})`)
        .call(xAxis)

      g.append('g')
        .attr('stroke-width', _lineWidthGrid)
        .style('opacity', _lineOpacityGrid)
        .call(makeGridlinesY()
          .tickSize(-_width)
          .tickFormat('')
        )

      g.append('g')
        .call(yAxis)

      if (_ctx.data.length && !Array.isArray(_ctx.data[0])) {
        _ctx.data = [_ctx.data]
      }

      for (let i = 0; i < _ctx.data.length; i++) {
        g.append('path')
          .datum(_ctx.data[i])
          .attr('fill', 'none')
          .attr('stroke', _lineColor)
          .attr('stroke-width', _lineWidth)
          .attr('d', lineChart)
      }

      resolve(d3n.svgString())
    })
  }
}

export default LineChart
