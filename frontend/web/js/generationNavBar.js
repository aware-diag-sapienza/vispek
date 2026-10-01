let dataset
let technique
let cluster
let partitions
let stability_window
var seed = 0
let linechart1
let timelinePartitions
let similarity_metric_matrix
let matrix1
let matrix2
let SVG_HISTORY
let SVG_SILOUETTE
let previous_computations = []
let width_rect
let USED_SEED = []
const SCALE_METRIC_QUALITY = d3.scaleLinear().domain([0, 1]).range([0, 1])
let MAX_QUALITY = -1
const LIMIT_IT = 100
let CURRENT_HISTORY = 0
let LABEL_METRICHE = {
  calinskyHarabasz: 'Calinsky Harabasz',
  dbIndex: 'DB Index',
  dunnIndex: 'Dunn Index',
  simplifiedSilhouette: 'Simplified Silhouette'
}
let variableYAxisLinechart
let qualityYAxisLinechart

let ELBOW_DATA = []

let visualizeMetrics = false

let verticalLines = []

let ITERAZIONE_PER_MATRICE = 1

function onChangeInputParameter () {
  d3.select('#iteration-label').html('')
}

/* VECCHIO SELECT SOPRA LINECHART
$('#select-variableYAxis-linechart').val(variableYAxisLinechart);
function onChangeVariableYAxisLinechart(){
    variableYAxisLinechart = $( "#select-variableYAxis-linechart" ).val()
    linechart1.updateYAxisVariable()
}*/
let relatiYAxisLineCharts = document.getElementById(
  'realtiveYScaleLinechart'
).checked

function changeRelativeYScale () {
  let cbox = document.getElementById('realtiveYScaleLinechart')

  relatiYAxisLineCharts = cbox.checked
  linechart1.updateYAxisVariable()
}

let linechart_Elbow1
document.getElementById('elbowLinechartCheck').checked = false
let elbowLinechart = document.getElementById('elbowLinechartCheck').checked

function updateSelects (datasetsArray) {
  const tech = ['k-means++', 'random'] //,'HGPA-PecK','HGPA-PecK++','MCLA-PecK','MCLA-PecK++']
  const clusters = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  ]
  const partition = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  const projections = ['tsne', 'pca', 'umap']

  $('#select-dataset').empty()
  $('#select-technique').empty()
  $('#select-cluster').empty()
  $('#select-partitions').empty()
  $('#select-projection').val()

  const selectDataset = document.getElementById('select-dataset')
  const selectTechnique = document.getElementById('select-technique')
  const selectCluster = document.getElementById('select-cluster')
  const selectPartitions = document.getElementById('select-partitions')
  const selectProjections = document.getElementById('select-projection')

  for (let i = 0; i < datasetsArray.length; i++) {
    selectDataset.options.add(new Option(datasetsArray[i], datasetsArray[i]))
  }

  for (let i = 0; i < tech.length; i++) {
    selectTechnique.options.add(new Option(tech[i], tech[i]))
  }

  for (let i = 0; i < clusters.length; i++) {
    selectCluster.options.add(new Option(clusters[i], clusters[i]))
  }

  for (let i = 0; i < partition.length; i++) {
    selectPartitions.options.add(new Option(partition[i], partition[i]))
  }

  for (let i = 0; i < projections.length; i++) {
    selectProjections.options.add(new Option(projections[i], projections[i]))
  }
  document.getElementById('select-dataset').value = datasetsArray[0]
  document.getElementById('select-technique').value = tech[0]
  document.getElementById('select-cluster').value = clusters[0]
  document.getElementById('select-partitions').value = '4'
  document.getElementById('select-projection').value = 'tsne'
  document.getElementById('similarity-range').value = 1
  document.getElementById('select-window-stability').value = 3
  document.getElementById('select-quality').value = 'simplifiedSilhouette'
  document.getElementById('similarity-range').oninput = function () {
    var value = ((this.value - this.min) / (this.max - this.min)) * 100
    this.style.background =
      'linear-gradient(to right,' +
      COLOR_SELECT +
      ' 1%, ' +
      COLOR_SELECT +
      ' 1%, #fff ' +
      value +
      '%, white 100%)'
  }
  d3.select('#selected_similarity').html($('#similarity-range').val() + '%')
}

function resetSelects () {
  document.getElementById('select-dataset').value = ''
  document.getElementById('select-technique').value = ''
  document.getElementById('select-cluster').value = ''
  document.getElementById('select-partitions').value = ''
  document.getElementById('select-projection').value = 'pca'
  document.getElementById('similarity-range').value = 1
  document.getElementById('select-window-stability').value = 3
  document.getElementById('select-quality').value = 'simplifiedSilhouette'
  document.getElementById('similarity-range').oninput = function () {
    var value = ((this.value - this.min) / (this.max - this.min)) * 100
    this.style.background =
      'linear-gradient(to right,' +
      COLOR_SELECT +
      ' 0%, ' +
      COLOR_SELECT +
      ' 1%, #fff ' +
      value +
      '%, white 100%)'
  }
  d3.select('#selected_similarity').html($('#similarity-range').val() + '%')
}

function getSeed () {
  let newseed = Math.random() * (100000 - 1) + 1
  if ($('#select-seed').val() === '') return Math.ceil(newseed)
  else return Math.ceil(parseInt($('#select-seed').val()))
}

d3.selectAll('.elbowParameter').style('display', 'none')

function startComputation () {
  if (elbowLinechart) {
    d3.selectAll('.elbowParameter').style('display', 'block')
    startElbow()
  } else {
    d3.selectAll('.elbowParameter').style('display', 'none')
    startSelects()
  }
}

function changeElbowLinechart () {
  let cbox = document.getElementById('elbowLinechartCheck')
  elbowLinechart = cbox.checked
  if (elbowLinechart) {
    d3.selectAll('.elbowParameter').style('display', 'block')
    d3.select('#select-cluster').property('disabled', 'true')
    if (linechart_Elbow1 !== undefined) linechart_Elbow1.render()
  } else {
    d3.selectAll('.elbowParameter').style('display', 'none')
    d3.select('#select-cluster').property('disabled', '')

    if (linechart1 !== undefined) linechart1.render()
  }
}

let elbowJob = null
let normalJob = null

function stopSelects () {
  d3.select('#load-img').style('visibility', 'hidden')
  if (elbowJob !== null) {
    if (elbowJob.status !== 'stopped') elbowJob.kill()
  }

  if (normalJob !== null) {
    if (normalJob.status !== 'stopped') normalJob.kill()
  }
}

async function startElbow () {
  LockUI.lock()

  // change the grid to perform the elbow method
  d3.select('#container')
    .classed('elbow-container', true)
    .classed('grid-container', false)
  d3.select('#container').selectChildren().filter(function() {
    return this.id !== 'navbar' && this.id !== 'metrics-table'
  }).remove()
  d3.select('#metrics-table').select('.metrics-bottom').remove()
  d3.select('#metrics-table').select('.metrics-par').remove()
  d3.select('#container').append('div').attr('id', 'linechart-elbow')
  d3.select('#container').append('div').attr('id', 'elbow-scatterplot-1')
  d3.select('#container').append('div').attr('id', 'matrix-elbow')
  d3.select('#container').append('div').attr('id', 'small-multiples').append('div')

  ELBOW_DATA = []
  const dname = $('#select-dataset').val()
  const kMin = parseInt($('#select-minK-Elbow').val())
  const kMax = parseInt($('#select-maxK-Elbow').val())
  const r = parseInt($('#select-partitions').val())
  const seed = parseInt(getSeed())
  termination = $('#select-termination').val()
  const technique = $('#select-technique').val() // I-PecK++ HGPA-Peck HGPA-Peck++ (come chiamati sul paper)
  let etElbow = $('#typeElbow').val()
  if (etElbow == 'null') etElbow = null
  const earlyTermination = etElbow //null, "fast", "slow"

  if (
    dname != null &&
    technique != null &&
    kMin != null &&
    kMax != null &&
    r != null &&
    kMin < kMax
  ) {
    /** DATASET PER ELBOW */
    const dataset = await SERVER.getDataset(dname)
    system.scatterplotElbow.initKonva()
    console.log('DATASET', dataset)
    ensem = {
      n_clusters_arr: d3.range(kMin, kMax+1), 
      n_runs: parseInt(r),
      random_state: parseInt(seed),
      init: technique,
      // et:  earlyTermination != null ? `${earlyTermination}-kill` : null,
      freq: CONFIG.minResultFreq,
      labelsValidationMetrics: ['calinski_harabasz', 'davies_bouldin', 'dunn_index', 'inertia', 'simplified_silhouette'],
      partitionsValidationMetrics: ['calinski_harabasz', 'davies_bouldin', 'dunn_index', 'inertia', 'simplified_silhouette'],
      partitionsComparisonMetrics: 'ALL',
    }
    if (termination === 'null') ensem.ets = ['fast-notify', 'slow-notify']
    else if (termination === 'fast') ensem.ets = ['fast-kill']
    else if (termination === 'slow') ensem.ets = ['fast-notify', 'slow-kill']
    console.log(ensem)
    elbowJob = await SERVER.createElbowTask(dname, ensem)

    console.log('elbowJob', elbowJob)

    linechart_Elbow1 = system.linechartElbow.init(
      '#linechart-elbow',
      kMin,
      kMax
    )

    elbowJob.onPartialResult(newResultFormat => {
      console.log('newres', newResultFormat)
      d3.select('.metrics-cont').style('visibility', 'visible')
      const result = parseNewBackendElbowPartialResult(newResultFormat)
      console.log('res', result)
      /*d3.select('#small-multiples')
        .append('div')
        .attr('id')
        .style('width', '480px')
        .style('min-width', '480px')*/

      ELBOW_DATA.push({
        k: result.k,
        value: result.inertia,
        labels: result.labels,
        metrics: result.metrics,
        URIData: ''
      })
      LockUI.unlock()
      if (result.k == kMin) {
        system.scatterplotElbow.updateSmallDms()
        system.scatterplotElbow.updateSmallScales(dataset.projections['tsne'])
      }
      system.scatterplotElbow.handleNewResult(dataset.projections['tsne'], result, ELBOW_DATA)
      /*
      if (result.k == kMin) {
        LockUI.unlock()
        system.scatterplotElbow.createData(
          dataset.projections['tsne'],
          result.k,
          ELBOW_DATA,
          {
            k: result.k,
            value: result.inertia,
            labels: result.labels,
            metrics: result.metrics,
            URIData: ''
          }
        )
      } else {
        system.scatterplotElbow.updateScatterplot(ELBOW_DATA, result.k, {
          k: result.k,
          value: result.inertia,
          labels: result.labels,
          metrics: result.metrics,
          URIData: ''
        })
      }
      */
      linechart_Elbow1.setData(ELBOW_DATA, result.elbowPoint)
      linechart_Elbow1.render()
      if (result.elbowPoint !== null) {

      }

      if (result.isLast) {
        d3.select('#load-img').style('visibility', 'hidden')
      } else {
        d3.select('#load-img').style('visibility', 'visible')
      }

      // qui devo deselezionare tutto il resto e cambiare la struttura dell'html
    })
    elbowJob.start()
  } else {
    alert(
      'Select Dataset, technique, k range, partitions and early termination'
    )
    LockUI.unlock()
  }
}

async function startSelects () {
  LockUI.lock()
  ALL_DATA = []
  ITERAZIONE_PER_MATRICE = 1
  dataset = $('#select-dataset').val()
  technique = $('#select-technique').val()
  cluster = $('#select-cluster').val()
  partitions = $('#select-partitions').val()
  projection = $('#select-projection').val()
  termination = $('#select-termination').val()
  seed = getSeed()

  d3.select('#select-seed').attr('placeholder', seed)
  d3.select('#iteration-label').html('')
  d3.select('#id-metrics').style('visibility', 'hidden')

  d3.select('#container').attr('class', 'grid-container')
  d3.select('#linechart_inertia').selectAll('svg').remove()

  d3.select('#info-scatterplot-1').style('visibility', 'hidden')
  d3.select('#select-similarity-matrix').style('visibility', 'hidden')
  d3.select('#info-menu-scatterplot').style('visibility', 'hidden')
  d3.select('.interactive-legend').style('visibility', 'hidden')
  d3.select('.item-dropdown-metrics').style('visibility', 'hidden')
  d3.select('.metrics-cont').style('visibility', 'hidden')
  d3.select('.item-linechart-overlay').style('visibility', 'hidden')
  d3.select('.item-information-similarity').style('visibility', 'hidden')
  d3.select('#information-linechart').style('visibility', 'hidden')
  d3.select('.item-information').style('visibility', 'hidden')
  d3.select('#id-metrics').style('visibility', 'hidden')
  d3.selectAll('.linechart_select').style('display', 'none')
  d3.select('#button-metric').style('display', 'none')
  d3.select('#id-scatterplot-1').style('visibility', 'hidden')
  d3.select('#id-scatterplot-2').style('visibility', 'hidden')

  variableYAxisLinechart = $('#select-window-stability').val()
  qualityYAxisLinechart = $('#select-quality').val()
  stability_window = $('#select-window-stability').val()
  similarity_metric_matrix = $('#select-similarity-matrix').val()
  average_similarity_metric_matrix =
    'averageA' + similarity_metric_matrix.substring(1)

  $('#chC').html('-')
  $('#dbC').html('--')
  $('#diC').html('--')
  $('#ineC').html('--')
  $('#sseC').html('--')

  $('#chE').html('-')
  $('#dbE').html('--')
  $('#diE').html('--')
  $('#ineE').html('--')
  $('#sseE').html('--')

  $('#chP').html('-')
  $('#dbP').html('--')
  $('#diP').html('--')
  $('#ineP').html('--')
  $('#sseP').html('--')

  if (dataset != null && technique != null && cluster != null) {
    matrix1 = system.matrixAdjacency.init('#id-matrix-1')
    // matrix2 = system.matrixAdjacencyFixed.init('#id-matrix-2');
    linechart1 = system.linechart.init('#linechart_inertia', technique)
    timelinePartitions = system.timelinepartitions.init(
      '#timeline-partitions',
      technique,
      partitions
    )

    document.getElementById('elbowLinechartCheck').checked = false
    elbowLinechart = document.getElementById('elbowLinechartCheck').checked
    console.log(dataset)
    ensem = {
      n_clusters: parseInt(cluster), 
      n_runs: parseInt(partitions),
      random_state: parseInt(seed),
      init: technique,
      // ets: ['fast-kill', 'slow-notify'],
      // ets: ['fast-notify', 'slow-notify'],
      freq: CONFIG.minResultFreq,
      labelsValidationMetrics: ['calinski_harabasz', 'davies_bouldin', 'dunn_index', 'inertia', 'simplified_silhouette'],
      labelsComparisonMetrics: null,
      labelsProgressionMetrics: ['entries_stability_2', 'entries_stability_3', 'entries_stability_4', 'entries_stability_5', 'entries_stability_10', 'entries_stability_all'],
      partitionsValidationMetrics: ['calinski_harabasz', 'davies_bouldin', 'dunn_index', 'inertia', 'simplified_silhouette'],
      partitionsComparisonMetrics: 'ALL',
      partitionsProgressionMetrics: ['global_stability_2', 'global_stability_3', 'global_stability_4', 'global_stability_5', 'global_stability_10', 'global_stability_all'],
      adjustCentroids: CONFIG.adjustCentroids,
      adjustLabels: CONFIG.adjustLabels
    }
    if (termination === 'null') ensem.ets = ['fast-notify', 'slow-notify']
    else if (termination === 'fast') ensem.ets = ['fast-kill']
    else if (termination === 'slow') ensem.ets = ['fast-notify', 'slow-kill']
    console.log(ensem)
    normalJob = await SERVER.createEnsembleTask(dataset, ensem)
    JOBS.push(normalJob)
    DATASET_SELECTED = await SERVER.getDataset(dataset)
    normalJob.onPartialResult(newResultFormat => {
      console.log(newResultFormat)
      const result = parseNewBackendPartialResult(newResultFormat)
      console.log(result)
      
      ALL_DATA.push(result)
      CURRENT_ITERATION = result.iteration
      if (result.iteration == 0) {
        LockUI.unlock()
        system.scatterplot.createData(
          DATASET_SELECTED.projections[projection],
          result.labels
        )
      }
      readResult(result)
      d3.select('#iteration-label').html('Iteration ' + result.iteration)
      if (result.isLast) {
        d3.select('#load-img').style('visibility', 'hidden')
      } else {
        d3.select('#load-img').style('visibility', 'visible')
      }
    })
    normalJob.start()
    addPinHistory()
  } else {
    alert('Select Dataset, technique e clusters to perform the query')
  }
}

let timestamp0
let swap_timestamp = 0

function readResult (it_res) {
  timestamp0 = swap_timestamp
  let actual_timestamp
  actual_timestamp = it_res.timestamp
  d3.select('#iteration-label').html('Iteration #' + it_res.iteration)
  d3.select('#info-scatterplot-1').style('visibility', 'visible')
  d3.select('#select-similarity-matrix').style('visibility', 'visible')
  d3.select('#info-menu-scatterplot').style('visibility', 'visible')
  d3.select('.interactive-legend').style('visibility', 'visible')
  d3.select('.item-dropdown-metrics').style('visibility', 'visible')
  d3.select('.metrics-cont').style('visibility', 'visible')
  d3.select('.item-linechart-overlay').style('visibility', 'visible')
  d3.select('.item-information-similarity').style('visibility', 'visible')
  d3.select('#id-metrics').style('visibility', 'visible')
  d3.select('#information-linechart').style('visibility', 'visible')
  d3.selectAll('.linechart_select').style('display', 'block')
  d3.select('#id-scatterplot-1').style('visibility', 'visible')
  d3.select('#id-scatterplot-2').style('visibility', 'visible')

  d3.select('#button-metric').style('display', 'inline')

  //d3.select('#id-metrics').style('display','flex')
  let metric_quality_selected = $('#select-quality').val()
  d3.select('#partition-label-best').html(`P${it_res.info.best_run}`)
  d3.select(`#finalTh`)
    .style('font-variant', 'small-caps')
    .html(`Best: P${it_res.info.best_run}`)
  if (it_res.iteration === 0) {
    timestamp0 = it_res.timestamp
    linechart1.setData([it_res])
    linechart1.render()
    timelinePartitions.setData([it_res])
    timelinePartitions.render()
    updateTable(it_res)
    system.matrixAdjacency.adjacency(
      partitions,
      it_res.metrics.partitionsMetrics[similarity_metric_matrix],
      it_res.metrics.partitionsMetrics[similarity_metric_matrix]
    )
  } else {
    linechart1.updateData(it_res, it_res.info)
    timelinePartitions.updateData(it_res, it_res.metrics)
    updateTable(it_res)
    system.scatterplot.updateScatterplot()
    if (system.compRun !== null) system.scatterplot.updateScatterplotFromTimeline(it_res.iteration, system.compRun)
    system.matrixAdjacency.updateMatrix(
      partitions,
      it_res.metrics.partitionsMetrics[similarity_metric_matrix],
      it_res.metrics.partitionsMetrics[similarity_metric_matrix]
    )
  }
  updatePinHistory(
    it_res.iteration,
    it_res.isLast,
    it_res.metrics.labelsMetrics
  )
  system.matrixAdjacency.updateBestPartition(it_res.info.best_run)
  if (it_res.is_last) {
    ITERAZIONE_PER_MATRICE = ITERAZIONE_PER_MATRICE
  } else {
    ITERAZIONE_PER_MATRICE += 1
  }
}

function readHistoryResult (li_data, all_data, job, slowData, fastData) {
  matrix1 = system.matrixAdjacency.init('#id-matrix-1')
  // matrix2 = system.matrixAdjacencyFixed.init('#id-matrix-2');
  linechart1 = system.linechart.init('#linechart_inertia', technique)
  timelinePartitions = system.timelinepartitions.init(
    '#timeline-partitions',
    technique,
    partitions
  )

  d3.select('#info-scatterplot-1').style('visibility', 'visible')
  document.getElementById('elbowLinechartCheck').checked = false
  elbowLinechart = document.getElementById('elbowLinechartCheck').checked

  d3.select('#iteration-label').html('Iteration #' + li_data.iteration)
  d3.selectAll('.linechart_select').style('display', 'block')
  d3.select('#button-metric').style('display', 'inline')
  //d3.select('#id-metrics').style('display','flex')
  linechart1.setData(all_data)

  timelinePartitions.setData(all_data)
  system.timelinepartitions.partitions_status = job.partitions_status
  system.timelinepartitions.DOMAINS = job.DOMAINS
  system.timelinepartitions.ITERATION_LAST = job.ITERATION_LAST
  if (system.timelinepartitions.metric_value === 'inertia') {
    system.timelinepartitions.colorScaleCell = d3
      .scaleLinear()
      .range([1, 0])
      .domain([
        system.timelinepartitions.DOMAINS[
          system.timelinepartitions.metric_value
        ][0],
        system.timelinepartitions.DOMAINS[
          system.timelinepartitions.metric_value
        ][1]
      ])
  }
  if (
    system.timelinepartitions.metric_value ===
    system.timelinepartitions.METRICA_LABELING
  ) {
    system.timelinepartitions.colorScaleCell = d3
      .scaleLinear()
      .range([0, 1])
      .domain([
        system.timelinepartitions.DOMAINS[
          system.timelinepartitions.metric_value
        ][0],
        system.timelinepartitions.DOMAINS[
          system.timelinepartitions.metric_value
        ][1]
      ])
  }

  timelinePartitions.render()
  updateTable(li_data)
  system.matrixAdjacency.adjacency(
    partitions,
    li_data.metrics.partitionsMetrics[similarity_metric_matrix],
    li_data.metrics.partitionsMetrics[average_similarity_metric_matrix]
  )
  system.scatterplot.updateScatterplot()
  system.matrixAdjacency.updateBestPartition(li_data.info.best_run)
  system.scatterplot.early_termination = null

  linechart1.updateEarlyTerminationFromHistory(fastData)
  linechart1.updateEarlyTerminationFromHistory(slowData)

  linechart1.render()
}

function visualizeMetricsFunction () {
  document.getElementById('table-metric-dropdown').classList.toggle('show')

  if (!visualizeMetrics) {
    d3.select('#table-metrics').style('display', 'block')
    //d3.select('.metrics-dropdown').style('border-width','2px')
    visualizeMetrics = true
  } else {
    d3.select('#table-metrics').style('display', 'none')
    //d3.select('.metrics-dropdown').style('border-width','0px')
    visualizeMetrics = false
  }
}

function updateTable (obj) {
  if (system.compRun === null) {
    d3.select('#chE').html('-')
    d3.select('#dbE').html('-')
    d3.select('#diE').html('-')
    d3.select('#ineE').html('-')
    d3.select('#sseE').html('-')
    d3.select('#chP').attr('class', 'delta-col').style('color', 'black').html('-')
    d3.select('#dbP').attr('class', 'delta-col').style('color', 'black').html('-')
    d3.select('#diP').attr('class', 'delta-col').style('color', 'black').html('-')
    d3.select('#ineP').attr('class', 'delta-col').style('color', 'black').html('-')
    d3.select('#sseP').attr('class', 'delta-col').style('color', 'black').html('-')
  } else {
    const ch = obj.metrics.partitionsMetrics.calinskyHarabasz[system.compRun]
    const db = obj.metrics.partitionsMetrics.dbIndex[system.compRun]
    const di = obj.metrics.partitionsMetrics.dunnIndex[system.compRun]
    const ine = obj.metrics.partitionsMetrics.inertia[system.compRun]
    const sse = obj.metrics.partitionsMetrics.simplifiedSilhouette[system.compRun]
    d3.select('#chE').html(arrotondaNumero(ch))
    d3.select('#dbE').html(arrotondaNumero(db))
    d3.select('#diE').html(arrotondaNumero(di))
    d3.select('#ineE').html(formatScientific(ine))
    d3.select('#sseE').html(arrotondaNumero(sse))
    const chP = computeRatioPerc(obj.metrics.labelsMetrics.calinskyHarabasz, ch)
    const dbP = computeRatioPerc(obj.metrics.labelsMetrics.dbIndex, db)
    const diP = computeRatioPerc(obj.metrics.labelsMetrics.dunnIndex, di)
    const ineP = computeRatioPerc(obj.metrics.labelsMetrics.inertia, ine)
    const sseP = computeRatioPerc(obj.metrics.labelsMetrics.simplifiedSilhouette, sse)
    d3.select('#chP').attr('class', 'delta-col').style('color', _ => (chP >= 0 ? 'teal' : 'rgb(255, 0, 144)')).html(`${chP} %`)
    d3.select('#dbP').attr('class', 'delta-col').style('color', _ => (dbP >= 0 ? 'rgb(255, 0, 144)' : 'teal')).html(`${dbP} %`)
    d3.select('#diP').attr('class', 'delta-col').style('color', _ => (diP >= 0 ? 'teal' : 'rgb(255, 0, 144)')).html(`${diP} %`)
    d3.select('#ineP').attr('class', 'delta-col').style('color', _ => (ineP >= 0 ? 'rgb(255, 0, 144)' : 'teal')).html(`${ineP} %`)
    d3.select('#sseP').attr('class', 'delta-col').style('color', _ => (sseP >= 0 ? 'teal' : 'rgb(255, 0, 144)')).html(`${sseP} %`)
  }
  d3.select('#chC').html(arrotondaNumero(obj.metrics.labelsMetrics.calinskyHarabasz))
  d3.select('#dbC').html(arrotondaNumero(obj.metrics.labelsMetrics.dbIndex))
  d3.select('#diC').html(arrotondaNumero(obj.metrics.labelsMetrics.dunnIndex))
  d3.select('#ineC').html(formatScientific(obj.metrics.labelsMetrics.inertia))
  d3.select('#sseC').html(arrotondaNumero(obj.metrics.labelsMetrics.simplifiedSilhouette))
}
function updateTableElbow () {

}
system.updateTable = updateTable
system.updateTableElbow = updateTableElbow

function arrotondaNumero (numb) {
  return Number.parseFloat(numb).toFixed(4)
}
function formatScientific (num) {
  if (num > 9999999) {
    const [b, e] = Number.parseFloat(num).toExponential(4).toString().split('e')
    return `${b} &#8729; 10<sup>${e.slice(1)}</sup>`
  } else {
    return Number.parseFloat(num).toFixed(4).toString()
  }
}

function computeRatioPerc (initial, final) {
  return ((parseFloat(final) - parseFloat(initial)) / parseFloat(initial) * 100).toFixed(3)
  return Math.abs(
    Number.parseFloat(
      (1 -
        Number.parseFloat(initial).toFixed(4) /
          Number.parseFloat(final).toFixed(4)) *
        100
    ).toFixed(4)
  )
}

function colorPin (tentative) {
  if (previous_computations[tentative]['partitions'] <= 6) {
    return '#afeeee' // azzurro
  }
  if (
    previous_computations[tentative]['partitions'] <= 12 &&
    previous_computations[tentative]['partitions'] > 6
  ) {
    return '#f1ac7f' // pesca
  }
  if (previous_computations[tentative]['partitions'] > 12) {
    return '#a6c6a5' // verde
  }

  // vecchio encoding
  /*
        if (previous_computations.length === 1){
            // sono alla prima iterazione e restituisco il verde chiaro
            return '#a6c6a5';
        } else {
            let current_index = previous_computations.length -1
            let previous_index = previous_computations.length -2

            if ((previous_computations[current_index]['technique']!== previous_computations[previous_index]['technique']) && (previous_computations[current_index]['partitions']!== previous_computations[previous_index]['partitions']))
                return '#ca96d0' // lilla
            if (previous_computations[current_index]['technique']!== previous_computations[previous_index]['technique'])
                return '#afeeee' // azzurro
            if (previous_computations[current_index]['partitions']!== previous_computations[previous_index]['partitions'])
                return '#f1ac7f' // pesca
            
            return '#a6c6a5' // verde
        } */
}

function addPinHistory () {
  let metric_quality_selected = $('#select-quality').val()
  // SE IL dataset selezionato non è nella struttura dati presente allora riazzero l'svg e lla struttura dati.
  if (previous_computations.map(d => d.dataset).indexOf(dataset) === -1) {
    d3.select('#svg-list-history').remove('*')
    d3.select('#name-dataset-history').remove('*')
    previous_computations = []
    SVG_HISTORY = null
    CURRENT_HISTORY = 0
  }

  let width_history = $('#listhistory').width()
  let height_history = $('#listhistory').height()
  let margin_history = { top: 1, bottom: 10, left: 5, right: 25 }
  let height_pin = 60

  if (SVG_HISTORY == null) {
    d3.select('#listhistory')
      .append('p')
      .attr('id', 'name-dataset-history')
      .style('padding-left', '10px')
      .html(dataset)
    SVG_HISTORY = d3
      .select('#listhistory')
      .append('svg')
      .attr('id', 'svg-list-history')
      .attr('width', width_history)
      .attr('height', height_history)
      .append('g')
      .attr('width', width_history)
      .attr(
        'height',
        height_history - margin_history.top - margin_history.bottom
      )
      .attr(
        'transform',
        'translate(' + margin_history.left + ',' + margin_history.top + ')'
      )
  }

  let tentative = previous_computations.length
  CURRENT_HISTORY = tentative

  previous_computations.push({
    dataset: dataset,
    technique: technique,
    cluster: cluster,
    partitions: partitions,
    tentative: tentative,
    seed: seed,
    metric_quality: -1,
    iteration: 0,
    earlyTerminationslow: -1,
    slowInertia: -1,
    earlyTerminationfast: -1,
    fastInertia: -1,
    calinskyHarabasz: -1,
    dbIndex: -1,
    dunnIndex: -1,
    simplifiedSilhouette: -1
  })

  scaleHistory = d3.scaleBand()

  if (previous_computations.length !== JOBS.length) {
    let new_JOB = JOBS[JOBS.length - 1]
    JOBS = []
    JOBS.push(new_JOB)
  }

  SVG_HISTORY.selectAll('.bar-history')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-history')
    .attr('id', d => 'background-' + d.tentative)
    .attr('x', 0)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', width_history - margin_history.right)
    .attr('height', height_pin)
    .attr('stroke', 'black')
    .attr('stroke-width', '1')
    .attr('fill', 'white')

  width_rect = (width_history - margin_history.right) / LIMIT_IT

  SVG_HISTORY.selectAll('.bar-history-improvement')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-history-improvement')
    .attr('id', d => 'improvement-' + d.tentative)
    .attr('x', 0)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', 0)
    .attr('height', height_pin)
    .attr('fill', d => colorPin(d.tentative))

  SVG_HISTORY.selectAll('.bar-history-early-slow')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-history-early-slow')
    .attr('id', d => 'early-slow-' + d.tentative)
    .attr('x', 0)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', 0)
    .attr('height', height_pin)
    .attr('fill', '#ffd700') // .attr('fill', '#c0c0c0')

  SVG_HISTORY.selectAll('.bar-history-early-fast')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-history-early-fast')
    .attr('id', d => 'early-fast-' + d.tentative)
    .attr('x', 0)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', 0)
    .attr('height', height_pin)
    .attr('fill', '#c0c0c0') // .attr('fill', '#ffd700')

  //    .attr("data-tippy-content", d => "Early Termination Fast \nat iteration " + d.iteration)
  //tippy(hetf.nodes(),{delay: 300,placement: 'right', arrow:false});

  let text = SVG_HISTORY.selectAll('.text-history')
    .data(previous_computations)
    .enter()
    .append('text')
    .attr('class', 'text-history')
    .attr('x', 3)
    .attr('y', d => {
      return d.tentative * (height_pin + 4) + 15
    })
  //.text((d)=> {return d.dataset})

  /*text.append("tspan")
            .text(d => d.dataset)
            .attr("class", "tspan-dataset")
            .attr("x", 0)
            .attr("dx", 10)
            .attr("dy", 2)
            .attr('font-size', 'smaller')*/

  text
    .append('tspan')
    .text(d => 'K:' + d.cluster + ' P:' + d.partitions)
    .attr('class', 'tspan-cluster')
    .attr('x', 0)
    .attr('dx', 10)
    .attr('dy', 12)
    .attr('font-size', 'smaller')

  text
    .append('tspan')
    .text(d => d.technique)
    .attr('class', 'tspan-technique')
    .attr('x', 0)
    .attr('dx', 10)
    .attr('dy', 12)
    .attr('font-size', 'smaller')

  /*text.append("tspan")
            .text(d => 'S:' +d.seed)
            .attr("class", "tspan-seed")
            .attr("x", 0)
            .attr("dx", 10)
            .attr("dy", 12)
            .attr('font-size', 'smaller')*/

  SVG_HISTORY.selectAll('.bar-metric-quality')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-metric-quality')
    .attr('id', d => 'metric-quality-' + d.tentative)
    .attr('x', width_history - margin_history.right)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', 10)
    .attr('height', height_pin)
    .attr('stroke', 'black')
    .attr('fill', d =>
      d3.interpolateReds(SCALE_METRIC_QUALITY(d[metric_quality_selected]))
    )

  SVG_HISTORY.selectAll('.bar-border')
    .data(previous_computations)
    .enter()
    .append('rect')
    .attr('class', 'bar-border')
    .attr('id', d => 'border-' + d.tentative)
    .attr('x', 0)
    .attr('y', d => {
      return d.tentative * (height_pin + 4)
    })
    .attr('width', width_history - margin_history.right + 10)
    .attr('height', height_pin)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'transparent')
    .on('click', function (element, d) {
      CURRENT_HISTORY = d.tentative
      d3.selectAll('.bar-border').attr('stroke-width', '1')
      d3.select('#border-' + d.tentative).attr('stroke-width', '2')
      uploadPreviousData(d, JOBS[d.tentative])
    })
    .on('mouseover', function (event, i) {
      let div = d3.select('#history-tooltip')
      div.transition().duration(200).style('opacity', 1)

      div
        .html(
          'Seed ' +
            previous_computations[i.tentative].seed +
            '<br/>' +
            LABEL_METRICHE[metric_quality_selected] +
            ': ' +
            previous_computations[i.tentative][metric_quality_selected].toFixed(
              4
            )
        )
        .style('left', event.clientX + 'px')
        .style('top', event.clientY - 28 + 'px')
    })
    .on('mouseout', function (d, i) {
      let div = d3.select('#history-tooltip')
      div.transition().duration(500).style('opacity', 0)
    })
}

function updatePinHistory (iteration, isLast, valori_metriche) {
  let metric_quality_selected = $('#select-quality').val()

  let CURRENT_HISTORY = previous_computations.length - 1
  //'calinskyHarabasz' : -1,'dbIndex':-1,'dunnIndex':-1,'simplifiedSilhouette':-1
  previous_computations[CURRENT_HISTORY]['calinskyHarabasz'] =
    valori_metriche['calinskyHarabasz']
  previous_computations[CURRENT_HISTORY]['dbIndex'] = valori_metriche['dbIndex']
  previous_computations[CURRENT_HISTORY]['dunnIndex'] =
    valori_metriche['dunnIndex']
  previous_computations[CURRENT_HISTORY]['simplifiedSilhouette'] =
    valori_metriche['simplifiedSilhouette']
  previous_computations[CURRENT_HISTORY]['iteration'] = iteration

  if (
    valori_metriche[metric_quality_selected] > SCALE_METRIC_QUALITY.domain()[1]
  ) {
    SCALE_METRIC_QUALITY.domain([0, valori_metriche[metric_quality_selected]])
    d3.selectAll('.bar-metric-quality').attr('fill', d =>
      d3.interpolateReds(SCALE_METRIC_QUALITY(d[metric_quality_selected]))
    )
  }

  SVG_HISTORY.selectAll('.bar-metric-quality').data(previous_computations)
  SVG_HISTORY.selectAll('.bar-history-improvement').data(previous_computations)

  d3.select('#metric-quality-' + CURRENT_HISTORY).attr('fill', d =>
    d3.interpolateReds(SCALE_METRIC_QUALITY(d[metric_quality_selected]))
  )

  if (isLast) {
    d3.select('#improvement-' + CURRENT_HISTORY).attr(
      'width',
      width_rect * LIMIT_IT
    )
    let width_iteration = (width_rect * LIMIT_IT) / iteration
    // ho trovato la early termination slow
    d3.select('#early-slow-' + CURRENT_HISTORY)
      .attr('width', 3)
      .attr(
        'x',
        width_iteration *
          previous_computations[CURRENT_HISTORY]['earlyTerminationslow'] +
          3
      )
    // ho trovato la early termination fast
    d3.select('#early-fast-' + CURRENT_HISTORY)
      .attr('width', 3)
      .attr(
        'x',
        width_iteration *
          previous_computations[CURRENT_HISTORY]['earlyTerminationfast']
      )
  } else {
    d3.select('#improvement-' + CURRENT_HISTORY).attr(
      'width',
      width_rect * iteration
    )

    if (
      previous_computations[CURRENT_HISTORY]['earlyTerminationslow'] ===
      iteration
    ) {
      // ho trovato la early termination slow
      d3.select('#early-slow-' + CURRENT_HISTORY)
        .attr('width', 3)
        .attr('x', width_rect * iteration + 5)
    }

    if (
      previous_computations[CURRENT_HISTORY]['earlyTerminationfast'] ===
      iteration
    ) {
      // ho trovato la early termination fast
      d3.select('#early-fast-' + CURRENT_HISTORY)
        .attr('width', 3)
        .attr('x', width_rect * iteration)
    }
  }
}

function updateProjection () {
  let last_it = ALL_DATA.length - 1
  projection = $('#select-projection').val()
  console.log('Projection', projection, DATASET_SELECTED)

  system.scatterplot.createDataProjection(
    DATASET_SELECTED.projections[projection],
    ALL_DATA[last_it].labels
  )
}

function updateEarlyTermination () {
  // togliere la selezione dalla timeline
  d3.selectAll('rect.rect-partition')
    .attr('width', system.timelinepartitions.xScale.bandwidth() * 0.9)
    .attr('height', system.timelinepartitions.yScale.bandwidth() * 0.7)

  // far vedere lo scatterplot della early termination
  let index = previous_computations.length - 1
  let iterationFast = +previous_computations[index].earlyTerminationfast

  d3.select('#information-info').html(
    ' Early Termination Fast - Iteration #' +
      iterationFast +
      '   <b>ARI<b/>: ' +
      (
        1 - ALL_DATA[iterationFast].metrics.progressiveMetrics.adjustedRandScore
      ).toFixed(4)
  )
  /*
  system.scatterplotFixed.updateScatterplot(
    false,
    true,
    system.scatterplot.scale_x,
    system.scatterplot.scale_y,
    system.scatterplot.LABEL_EARLY_TERMINATION,
    system.scatterplot.STABILITY_EARLY_TERMINATION
  )
  */
}

function changeStabilityWindow () {
  stability_window = $('#select-window-stability').val()
  system.scatterplot.updateScatterplot()
  variableYAxisLinechart = stability_window
  // modifico il mouse over sulle history e ricoloro i rettangoli

  linechart1.updateYAxisVariable()
}

function changeQuality () {
  SCALE_METRIC_QUALITY.domain([0, 1])
  qualityYAxisLinechart = $('#select-quality').val()
  d3.selectAll('.bar-metric-quality').attr('fill', d =>
    d3.interpolateReds(SCALE_METRIC_QUALITY(d[qualityYAxisLinechart]))
  )

  d3.selectAll('.bar-border')
    .on('mouseover', function (event, i) {
      let div = d3.select('#history-tooltip')
      div.transition().duration(200).style('opacity', 1)

      div
        .html(
          'Seed ' +
            previous_computations[i.tentative].seed +
            '<br/>' +
            LABEL_METRICHE[qualityYAxisLinechart] +
            ': ' +
            previous_computations[i.tentative][qualityYAxisLinechart].toFixed(4)
        )
        .style('left', event.clientX + 'px')
        .style('top', event.clientY - 28 + 'px')
    })
    .on('mouseout', function (d, i) {
      let div = d3.select('#history-tooltip')
      div.transition().duration(500).style('opacity', 0)
    })
  linechart1.updateYAxisVariable()
}

function changeSimilarityMetricMatrix () {
  similarity_metric_matrix = $('#select-similarity-matrix').val()
  average_similarity_metric_matrix =
    'averageA' + similarity_metric_matrix.substring(1)

  d3.selectAll('.label-simiarity').text(() => {
    if (similarity_metric_matrix === 'adjustedRandScore') {
      return 'Adjusted Rand Score'
    }
    if (similarity_metric_matrix === 'adjustedMutualInfoScore') {
      return 'Adjusted Mutual Information'
    }
  })

  d3.selectAll('.label-average-simiarity').text(() => {
    if (average_similarity_metric_matrix === 'averageAdjustedRandScore') {
      return 'Adjusted Rand Score'
    }
    if (average_similarity_metric_matrix === 'averageAdjustedMutualInfoScore') {
      return 'Adjusted Mutual Information'
    }
  })
  system.matrixAdjacency.updateMatrix(
    partitions,
    ALL_DATA[CURRENT_ITERATION].metrics.partitionsMetrics[
      similarity_metric_matrix
    ],
    ALL_DATA[CURRENT_ITERATION].metrics.partitionsMetrics[
      average_similarity_metric_matrix
    ]
  )

  // AGGIOrNARE ANCHE IL VALORE DELLA matriche se è stato trovato early termination
  let index = previous_computations.length - 1

  if (previous_computations[index].earlyTerminationfast !== -1) {
    // system.matrixAdjacencyFixed.updateMatrixplotEarlyTermination(partitions,ALL_DATA[previous_computations[index].earlyTerminationfast].metrics.partitionsMetrics[similarity_metric_matrix],ALL_DATA[previous_computations[index].earlyTerminationfast].metrics.partitionsMetrics[average_similarity_metric_matrix]);
  }
}

function uploadPreviousData (d, jobdata) {
  ALL_DATA = jobdata.results
  CURRENT_ITERATION = jobdata.results.length - 1
  CURRENT_HISTORY = d.tentative
  ITERAZIONE_PER_MATRICE = 1
  dataset = d.dataset
  technique = d.technique
  cluster = d.cluster
  partitions = d.partitions
  seed = d.seed
  readHistoryResult(
    ALL_DATA[CURRENT_ITERATION],
    ALL_DATA,
    jobdata,
    ALL_DATA[d.earlyTerminationslow],
    ALL_DATA[d.earlyTerminationfast]
  )
}

function TestELbow () {
  var automatic_dataset = document.getElementById('select-dataset')
  automatic_dataset.options[2].selected = true

  var automatic_technique = document.getElementById('select-technique')
  automatic_technique.options[1].selected = true

  var automatic_partitions = document.getElementById('select-partitions')
  automatic_partitions.options[3].selected = true

  var automatic_cluster = document.getElementById('select-cluster')
  automatic_cluster.options[3].selected = true

  var automatic_elbow = document.getElementById('elbowLinechartCheck')
  automatic_elbow.checked = true
  changeElbowLinechart()

  var automatic_max_range_K = document.getElementById('select-maxK-Elbow')
  automatic_max_range_K.value = 7

  startComputation()
}
