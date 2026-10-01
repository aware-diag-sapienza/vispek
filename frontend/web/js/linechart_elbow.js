if (window.system == undefined) window.system = {}
system.linechartElbow = function () {
  const that = this

  // variable
  this.div = null
  this.data = []
  this.segmentedData = []
  this.elbow = null

  this.divName = null
  this.margin = { top: 35, right: 30, bottom: 50, left: 60 }
  this.width = null
  this.height = null
  this.xScale = null
  this.yScale = null
  this.xAxis = null
  this.yAxis = null
  // Define lines
  this.line = d3.line()

  this.init = (idDiv, mink, maxk) => {
    this.div = d3.select(idDiv)
    this.divName = idDiv
    ;(this.width =
      parseInt(this.div.style('width')) - this.margin.left - this.margin.right),
      (this.height =
        parseInt(this.div.style('height')) -
        this.margin.top -
        this.margin.bottom)
    this.xScale = d3.scaleLinear().domain([mink, maxk]).range([0, this.width])
    this.yScale = d3.scaleLinear().range([this.height, 0])
    this.xAxis = d3
      .axisBottom()
      .scale(this.xScale)
      .ticks(maxk - 1)
    this.yAxis = d3.axisLeft().scale(this.yScale).tickFormat(d3.format('~s'))
    this.line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x(function (d) {
        return that.xScale(d.k)
      })
      .y(function (d) {
        return that.yScale(Math.abs(+d.value))
      })
    return that
  }

  this.setData = (data, elbowPoint) => {
    this.data = data
    this.elbowPoint = elbowPoint
    this.segmentedData = []
    this.segmentData(data)
  }

  this.segmentData = data => {
    const ret = []
    for (let i = 0; i < data.length; i++) {
      if (i == 0) ret.push([data[i], data[i]])
      else ret.push([data[i - 1], data[i]])
    }
    this.segmentedData = ret
  }

  /*this.updateData = (obj) => {
        this.data = this.data.concat(obj)
        this.segmentData(this.data)
        this.render()
    }*/

  this.render = () => {
    this.div.selectAll('svg').remove()

    const svg = this.div
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .attr('class', 'gLineChart')

    svg
      .append('g')
      .attr('class', 'x axisLineChart')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis)

    // Add Y axis
    this.yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(this.data, function (d) {
          return Math.abs(+d.value)
        })
      ])
      .range([this.height, 0])

    this.yAxis = d3.axisLeft().scale(this.yScale).tickFormat(d3.format('~s'))
    svg.append('g').attr('class', 'y axisLineChart').call(this.yAxis)

    //labels
    svg
      .append('text')
      .attr('class', 'textXAxis')
      .attr(
        'transform',
        'translate(' +
          this.width / 2 +
          ' ,' +
          (this.height + this.margin.top) +
          ')'
      )
      .style('text-anchor', 'middle')
      .text('k')

    svg
      .append('text')
      .attr('class', 'textYAxis')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - this.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Inertia')

    updateRendering()
    if (this.elbowPoint !== null) {
      const x = this.xScale(this.elbowPoint)
      const y = this.yScale(this.data.filter(d => d.k === this.elbowPoint)[0].value)
      svg
        .append('polygon')
        .attr('points', `${x},${y - 5} ${x - 6},${y - 15} ${x + 6},${y - 15}`)
        .attr('fill', 'rgb(255, 0, 144)')
      svg
        .append('line')
        .attr('stroke', 'lightslategray')
        .attr('x1', this.xScale(this.elbowPoint))
        .attr('x2', this.xScale(this.elbowPoint))
        .attr('y1', y)
        .attr('y2', this.height)
    }
  }

  this.clearAll = () => {
    this.div.selectAll('svg').remove()

    d3.selectAll('.linechart_select').style('display', 'none')
  }

  let updateRendering = () => {
    that.div
      .select('g.gLineChart')
      .selectAll('path.lineLineChart')
      .data(that.segmentedData)
      .join(
        enter =>
          enter
            .append('path')
            .attr('class', 'lineLineChart')
            .attr('d', d => that.line(d)),
        update =>
          update.call(
            update => update.transition().duration(0)
            //.style("stroke", 'red')
          ),
        exit => exit.call(exit => exit.transition().duration(0).remove())
      )

    let format7 = d3.format('.7f')
    let circleElbow = that.div
      .select('g.gLineChart')
      .selectAll('circle.circleElbow')
      .data(that.data)
      .join(
        enter =>
          enter
            .append('circle')
            .attr('class', 'circleElbow')
            .style('fill', 'steelblue')
            .attr('r', 3)
            .attr('cx', d => that.xScale(d.k))
            .attr('cy', d => that.yScale(d.value))
            .attr('data-tippy-content', d => 'Inertia: ' + format7(d.value)),
        update =>
          update.call(
            update => update.transition().duration(0)
            //.style("stroke", 'red')
          ),
        exit => exit.call(exit => exit.transition().duration(0).remove())
      )
    tippy(circleElbow.nodes(), { delay: 300 })
  }

  return this
}.call({})
