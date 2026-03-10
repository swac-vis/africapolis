import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function BarChart({ data, width = 480, height = 260, margin = { top: 20, right: 20, bottom: 80, left: 50 } }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, w])
      .padding(0.2)

    const yExtent = d3.extent(data, (d) => d.value)
    const yMax = yExtent[1] != null ? yExtent[1] * 1.05 : 1
    const yMin = yExtent[0] != null ? Math.max(0, yExtent[0] * 0.9) : 0
    const y = d3
      .scaleLinear()
      .domain([yMin, Math.max(yMax, yMin + 0.01)])
      .range([h, 0])

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .style('text-anchor', 'end')
      .style('font-size', '9px')
      .style('fill', '#64748b')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => Number(d).toLocaleString().replace(/,|\u00A0/g, ' ')))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b')

    const barColor = (d) => {
      if (d.level === 'region') return '#8b7355'
      if (d.level === 'organization') return '#a08060'
      return '#6d4a2e'
    }
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', (d) => `bar bar--${d.level || 'country'}`)
      .attr('x', (d) => x(d.name))
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => h - y(d.value))
      .attr('fill', barColor)
      .attr('rx', 2)
  }, [data, width, height, margin])

  return <svg ref={svgRef} className="data__chart-svg" />
}
