if (window.system == undefined) window.system = {}
system.compRun = null
system.matrixAdjacency = function () {
  const that = this

  // variable
  this.div = null
  this.data = []
  this.g = null

  this.width = null
  this.height = null
  this.margin = { top: 50, right: 30, bottom: 60, left: 50 }
  this.cell_size = null

  this.matrix = []

  this.init = function (idDiv) {
    system.matrixAdjacency.reset()
    this.div = d3.select(idDiv)
    this.divname = idDiv
    this.g = idDiv + '-g-adiacency'
    //similarity_metric_matrix= $('#select-similarity-matrix').val()
    const side = d3.min([
      parseInt(this.div.style('width')) - this.margin.left - this.margin.right,
      parseInt(this.div.style('height')) - this.margin.top - this.margin.bottom
    ])
    this.width = side
    this.height = side
    return this
  }

  this.setData = data => {
    this.data = data
  }

  this.getG = () => {
    return this.g
  }

  this.reset = () => {
    d3.select(this.divname).selectAll('svg').remove()
  }

  this.adjacency = (partitions, decision_ars, decision_ami) => {
    let runs_ars_matrix = decision_ars //data.info.runs_ars_matrix//decision_ars.split("||").map(row => row.split("::").map(d => parseFloat(d))) //matrice size r*r
    let runs_ami_matrix = decision_ami //data.info.runs_ami_matrix//decision_ami.split("||").map(row => row.split("::").map(d => parseFloat(d))) //matrice size r*r
    system.matrixAdjacency.createAdjacencyMatrix(
      partitions,
      runs_ars_matrix,
      runs_ami_matrix
    )
  }

  let updateData = () => {
    let tooltRect = d3
      .select(this.g)
      .selectAll('rect')
      .data(that.matrix)
      .join(
        enter =>
          enter
            .append('rect')
            .attr('class', d => {
              return 'grid col_' + d.col + ' row_' + d.row
            })
            .attr('id', d => {
              return (
                'id-' + d.col + '-' + d.row + '-' + d.metric + '-' + d.weight
              )
            })
            .attr('width', that.cell_size)
            .attr('height', that.cell_size)
            .attr('x', d => d.x * that.cell_size)
            .attr('y', d => d.y * that.cell_size)
            .style('fill', d => {
              if (d.col === d.row) return 'white' // d3.interpolateBlues(d.weight)
              if (
                !system.timelinepartitions.partitions_status[
                  parseInt(d.col.replace('P', ''))
                ][2]
              )
                return '#d2d2d2'
              if (
                !system.timelinepartitions.partitions_status[
                  parseInt(d.row.replace('P', ''))
                ][2]
              )
                return '#d2d2d2'
              return d3.interpolateBlues(d.weight)
            })
            .attr(
              'data-tippy-content',
              d =>
                '' +
                d.id +
                ' at row ' +
                d.row +
                ' end col ' +
                d.col +
                ' with weight ' +
                d.weight
            ),
        update =>
          update.call(update =>
            update
              .transition()
              .duration(500)
              .style('fill', d => {
                if (d.col === d.row) return 'white' // d3.interpolateBlues(d.weight)
                if (
                  !system.timelinepartitions.partitions_status[
                    parseInt(d.col.replace('P', ''))
                  ][2]
                )
                  return '#d2d2d2'
                if (
                  !system.timelinepartitions.partitions_status[
                    parseInt(d.row.replace('P', ''))
                  ][2]
                )
                  return '#d2d2d2'
                return d3.interpolateBlues(d.weight)
              })
          ),
        exit => exit.call(exit => exit.transition().duration(650).remove())
      )

    tippy(tooltRect.nodes(), { delay: 300 })
  }

  this.updateMatrix = (
    partitions,
    decision_similarity,
    average_decision_similarity
  ) => {
    let SIM = decision_similarity //decision_ars.split("||").map(row => row.split("::").map(d => parseFloat(d))) //matrice size r*r
    let AVG_SIM = decision_similarity //decision_ami.split("||").map(row => row.split("::").map(d => parseFloat(d))) //matrice size r*r
    this.matrix = []

    let i
    let j
    for (i = 0; i < parseInt(partitions); i++) {
      for (j = 0; j < parseInt(partitions); j++) {
        var grid = {
          id: 'P' + i + '-' + 'P' + j,
          row: 'P' + i,
          col: 'P' + j,
          x: i,
          y: j,
          weight: 0,
          metric: null
        }
        if (i < j) {
          // è la parte sotto della matrice, metto SIM
          grid.weight = SIM[i][j]
          grid.metric = 'SIM'
        } else if (i > j) {
          grid.weight = AVG_SIM[i][j]
          grid.metric = 'AVG_SIM'
        }
        this.matrix.push(grid)
      }
    }

    updateData()
  }

  this.createAdjacencyMatrix = (partitions, SIM, AVG_SIM) => {
    this.matrix = []
    let nodes = []
    let i
    let j
    for (i = 0; i < parseInt(partitions); i++) {
      for (j = 0; j < parseInt(partitions); j++) {
        var grid = {
          id: 'P' + i + '-' + 'P' + j,
          row: 'P' + i,
          col: 'P' + j,
          x: i,
          y: j,
          weight: 0,
          metric: null
        }
        if (i < j) {
          // è la parte sotto della matrice, metto SIM
          grid.weight = SIM[i][j]
          grid.metric = 'SIM'
        } else if (i > j) {
          grid.weight = AVG_SIM[i][j]
          grid.metric = 'AVG_SIM'
        }
        this.matrix.push(grid)
      }
      nodes.push('P' + i)
    }
    this.cell_size =
      (d3.min([that.width, that.height])) / nodes.length

    let svg = this.div
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)

    svg
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .attr('id', this.g.replace('#', ''))

    updateData()

    const rs = d3.min([30, this.cell_size])
    const cols = svg
      .append('g')
      .attr('class', 'labels-cols')
      .attr(
        'transform',
        'translate(' + that.margin.left + ',' + (that.margin.top / 2) + ')'
      )
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'label-gr')
      .attr('id', d => `col-gr-${d}`)
      .attr('cursor', 'pointer')
      .on('mouseover', function (e, d) {
        d3.selectAll('.label-gr:not(.label-comp)').select(`#row-rect-${d}`).attr('stroke', 'black')
        d3.selectAll('.label-gr:not(.label-comp)').select(`#col-rect-${d}`).attr('stroke', 'black')
      })
      .on('mouseout', function (e, d) {
        d3.selectAll('.label-gr:not(.label-comp)').select(`#row-rect-${d}`).attr('stroke', 'none')
        d3.selectAll('.label-gr:not(.label-comp)').select(`#col-rect-${d}`).attr('stroke', 'none')
      })
      .on('click', function (e, d) {
        const p = parseInt(d.slice(1))
        const i = system.timelinepartitions.ITERATION_LAST[p] - 1
        d3.select('#partition-label-comp').html(d)
        that.updateCompPartition(p)
        system.scatterplot.updateScatterplotFromTimeline(i, p)
      })
    cols
      .append('rect')
      .attr('id', d => 'col-rect-' + d)
      .attr('x', (d, i) => i * this.cell_size + this.cell_size / 2 - rs / 2)
      .attr('y', - rs / 2)
      .attr('width', rs)
      .attr('height', rs)
      .attr('fill', 'white')
    cols
      .append('text')
      .attr('class', 'label-matrix')
      .attr('id', d => 'col-' + d)
      .attr('x', (d, i) => i * this.cell_size + this.cell_size / 2)
      .text(d => d)
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'middle')
      .style('font-size', '10px')
    
        
    const rows = svg
      .append('g')
      .attr('class', 'labels-rows')
      .attr(
        'transform',
        'translate(' + (that.margin.left / 2) + ',' + that.margin.top + ')'
      )
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'label-gr')
      .attr('id', d => `row-gr-${d}`)
      .attr('cursor', 'pointer')
      .on('mouseover', function (e, d) {
        d3.selectAll('.label-gr:not(.label-comp)').select(`#row-rect-${d}`).attr('stroke', 'black')
        d3.selectAll('.label-gr:not(.label-comp)').select(`#col-rect-${d}`).attr('stroke', 'black')
      })
      .on('mouseout', function (e, d) {
        d3.selectAll('.label-gr:not(.label-comp)').select(`#row-rect-${d}`).attr('stroke', 'none')
        d3.selectAll('.label-gr:not(.label-comp)').select(`#col-rect-${d}`).attr('stroke', 'none')
      })
      .on('click', function (e, d) {
        const p = parseInt(d.slice(1))
        const i = system.timelinepartitions.ITERATION_LAST[p] - 1
        d3.select('#partition-label-comp').html(d)
        that.updateCompPartition(p)
        system.scatterplot.updateScatterplotFromTimeline(i, p)
      })
    rows
      .append('rect')
      .attr('id', d => 'row-rect-' + d)
      .attr('y', (d, i) => i * this.cell_size + this.cell_size / 2 - rs / 2)
      .attr('x', - rs / 2)
      .attr('width', rs)
      .attr('height', rs)
      .attr('fill', 'white')
    rows
      .append('text')
      .attr('y', (d, i) => i * this.cell_size + this.cell_size / 2)
      //.attr('dy', 5)
      .attr('class', 'label-matrix')
      .attr('id', d => 'row-' + d)
      .text(d => d)
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'middle')
      .style('font-size', '10px')
    // labels metrix
    svg
      .append('g')
      .attr(
        'transform',
        'translate(' +
          (that.margin.left + that.width / 2) +
          ',' +
          (that.height + that.margin.top + 20) +
          ')'
      )
      .append('text')
      .attr('class', 'label-simiarity')
      .text(() => {
        if (similarity_metric_matrix === 'adjustedRandScore') {
          return 'Adjusted Rand Score'
        }
        if (similarity_metric_matrix === 'adjustedMutualInfoScore') {
          return 'Adjusted Mutual Information'
        }
      })
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'middle')
      .style('font-size', '14px')

    svg
      .append('g')
      .attr(
        'transform',
        'translate(' +
          (that.margin.left + that.width + 20) +
          ',' +
          (that.margin.top +that.height / 2) +
          ')'
      )
      .append('text')
      .attr('class', 'label-average-simiarity')
      .text(() => {
        if (average_similarity_metric_matrix === 'averageAdjustedRandScore') {
          return 'Adjusted Rand Score'
        }
        if (
          average_similarity_metric_matrix === 'averageAdjustedMutualInfoScore'
        ) {
          return 'Adjusted Mutual Information'
        }
      })
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .attr('transform', 'rotate(-90)')

    // sequential legend
    let legend = svg
      .append('g')
      .attr(
        'transform',
        'translate(' + that.margin.left + ',' + (that.margin.top + that.height) + ')'
      )
      .append('defs')
      .append('svg:linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .attr('spreadMethod', 'pad')

    legend
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.interpolateBlues(0))
      .attr('stop-opacity', 1)

    legend
      .append('stop')
      .attr('offset', '33%')
      .attr('stop-color', d3.interpolateBlues(0.33))
      .attr('stop-opacity', 1)

    legend
      .append('stop')
      .attr('offset', '66%')
      .attr('stop-color', d3.interpolateBlues(0.66))
      .attr('stop-opacity', 1)

    legend
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.interpolateBlues(1))
      .attr('stop-opacity', 1)

    svg
      .append('g')
      .attr('class', 'legend-rect')
      .attr(
        'transform',
        'translate(' + that.margin.left + ',' + (that.margin.top + that.height + 35) + ')'
      )
      .append('rect')
      .attr('width', this.cell_size * partitions)
      .attr('height', 5)
      .style('fill', 'url(#gradient)')

    var y = d3
      .scaleLinear()
      .range([this.cell_size * partitions, 0])
      .domain([1, 0])

    var yAxis = d3.axisBottom().scale(y).ticks(5)

    svg
      .append('g')
      .attr('class', 'y axis')
      .attr(
        'transform',
        'translate(' + that.margin.left + ',' + (that.margin.top + that.height + 40) + ')'
      )
      .call(yAxis)
  }

  this.updateBestPartition = best => {
    d3.selectAll('.label-gr').classed('label-best', false)
    d3.select(`#row-gr-P${best}`).classed('label-best', true)
    d3.select(`#col-gr-P${best}`).classed('label-best', true)
    this.updatePartition()
  }
  this.updateCompPartition = comp => {
    system.compRun = comp
    d3.selectAll('.label-gr').classed('label-comp', false)
    d3.select(`#row-gr-P${comp}`).classed('label-comp', true)
    d3.select(`#col-gr-P${comp}`).classed('label-comp', true)
    d3.select(`#compTh`).html(`P${comp}`)
    this.updatePartition()
    system.updateTable(ALL_DATA[ALL_DATA.length - 1])
    console.log('up', system.updateTable)
    console.log('da', ALL_DATA)
    // updateTable(system)
  }
  this.updatePartition = () => {
    const a = d3.selectAll('.label-gr')
    a.selectAll('text')
      .attr('fill', 'black')
      .attr('font-weight', 'normal')
    a.selectAll('rect')
      .attr('stroke', 'none')
    const c = d3.selectAll('.label-comp')
    c.selectAll('text')
      .attr('fill', 'teal')
      .attr('font-weight', 700)
    c.selectAll('rect')
      .attr('stroke', 'teal')
    d3.selectAll('.label-best')
      .selectAll('text')
      .attr('fill', '#ff0090')
      .attr('font-weight', 700)
  }

  return this
}.call({})
