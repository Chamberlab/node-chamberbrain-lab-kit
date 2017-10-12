import D3Node from 'd3-node'
import BasePlot from './base'
import { roots, modes, chordMap } from '../util/harmonic-matrix'

class Diagram extends BasePlot {
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
        svg = d3n.createSVG(width + padding * 2, height + padding * 2)
          .attr('transform', `translate(${padding}, ${padding})`)
          /*
          .append('rect')
          .attr('y', height * -0.5).attr('x', width * -0.5)
          .attr('height', height).attr('width', width)
          .attr('fill', 'black')
          */
          // .attr('background-color', 'black')


      const lineFunction = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })

      const squares = 100,
        radius = width * 0.2,
        positions = new Array(24).fill(null).map((v, i) => {
        let x = i % 6
          return {
            x: (Math.floor(i / 4)) * (squares),
            y: (Math.floor(i / 6)) * (squares),
            w: squares,
            t: `Node: ${i}`
          }
        })

      const getPointForAngle = (degrees, n, i) => {
        return {
          x: Math.cos((degrees) * n * Math.PI / 180.0) * radius,
          y: Math.sin((degrees) * n * Math.PI / 180.0) * radius,
          i
        }
      }

      const modePos = []
      for (let i in modes) {
        let start = 50
        modePos.push({
          x: start + (i * (100 + 20)),
          y: start,
          w: 100,
          t: modes[i]
        })
      }

      for (let i in Object.keys(chordMap)) {
        let start = 50
        modePos.push({
          x: start + (i * (100 + 20)),
          y: start + 150,
          w: 100,
          t: Object.keys(chordMap)[i]
        })
      }

      for (let i in roots) {
        let start = 50
        modePos.push({
          x: start + ((i - (i < 6 ? 0 : 6)) * (100 + 20)),
          y: start + (150 * (i < 6 ? 2 : 3)),
          w: 100,
          t: roots[i]
        })
      }

      svg.append('g')
        .selectAll('rect')
        .data(modePos)
        .enter()
        .append('rect')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.w)
        .attr('height', d => d.w)
        .attr('fill', 'black')
      svg.selectAll('text')
        .data(modePos)
        .enter()
        .append('text')
        .attr('color', 'black')
        .text(function (d) { return d.t })
        .attr('x', d => d.x + 10)
        .attr('y', d => d.y - 10)



      // for (let i = 0; i < 7; i++) {
        /*
        let op = (i === data.pos.mode) ? 1.0 : 0.0
        svg.append('g')
          .attr('transform', `translate(${width * -0.25}, 0)`)
          .append('path')
          .datum([
            {x: 0, y: 0, i},
            getPointForAngle((360 / 8), i, i),
            getPointForAngle((360 / 8), i + 1, i)
          ])
          // .attr('opacity', Math.round(200 * op) + 55)
          .attr('fill', (op > 0 ? 'black' : 'white'))
          .attr('stroke', false)
          .attr('d', lineFunction)
          */
      // }

      /*
      for (let i = 0; i > -7; i--) {
        let op = (i === data.pos.deg * -1) ? 1.0 : 0.0
        svg.append('g')
          .attr('transform', `translate(${width * 0.25}, 0)`)
          .append('path')
          .datum([
            {x: 0, y: 0, i},
            getPointForAngle((360 / 8), i, i),
            getPointForAngle((360 / 8), i + 1, i)
          ])
          // .attr('opacity', Math.round(200 * op) + 55)
          .attr('fill', (op > 0 ? 'black' : 'white'))
          .attr('stroke', false)
          .attr('d', lineFunction)
      }
      */

      resolve(d3n.svgString())
    })
  }
}

export default Diagram
