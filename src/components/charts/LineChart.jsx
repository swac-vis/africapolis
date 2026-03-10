import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function LineChart({ data, width = 480, height = 260, margin = { top: 20, right: 20, bottom: 40, left: 50 } }) {
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
      .scalePoint()
      .domain(data.map((d) => d.year))
      .range([0, w])
      .padding(0.1)

    const yExtent = d3.extent(data, (d) => d.value)
    const yMin = yExtent[0] != null ? Math.max(0, yExtent[0] * 0.95) : 0
    const yMax = yExtent[1] != null ? yExtent[1] * 1.05 : 1
    const y = d3
      .scaleLinear()
      .domain([yMin, Math.max(yMax, yMin + 1)])
      .range([h, 0])

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => Number(d).toLocaleString().replace(/,|\u00A0/g, ' ')))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b')

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#b85c3e')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line)
  }, [data, width, height, margin])

  return <svg ref={svgRef} className="data__chart-svg" />
}
