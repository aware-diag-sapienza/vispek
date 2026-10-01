if (window.system == undefined) window.system = {}
system.scatterplotElbow = function () {
  const that = this

  this.plotDigitIndex = null
  this.width = null
  this.height = null
  this.margin = { top: 5, right: 10, bottom: 5, left: 10 }
  this.coordData = null
  this.tot_rows = 5000
  this.start_computation = null
  this.scale_label = d3.scaleOrdinal(d3.schemeCategory10)

  this.scale_color = [
    '#3366cc',
    '#dc3912',
    '#ff9900',
    '#109618',
    '#d6616b',
    '#990099',
    '#0099c6',
    '#dd4477',
    '#66aa00',
    '#b82e2e',
    '#17becf',
    '#bcbd22',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#759EF1',
    '#FFD40B',
    '#52DA2E',
    '#0ED1E3',
    '#0C292B',
    '#697374'
  ]
  this.scale_color_stability = ['#9e9ac8', '#3f007d'] //['#dadaeb','red','#bcbddc', '#9e9ac8','#807dba','#6a51a3','#4a1486']
  this.scale_color_stability_linear = d3
    .scaleThreshold()
    .domain([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.9, 0.99])
    .range([
      '#fcfbfd',
      '#efedf5',
      '#dadaeb',
      '#bcbddc',
      '#9e9ac8',
      '#807dba',
      '#6a51a3',
      '#54278f',
      '#3f007d'
    ])
  this.tensorResultComputation = {}
  this.datasetComputed = []
  this.LABEL_EARLY_TERMINATION = []
  this.STABILITY_EARLY_TERMINATION = []
  this.scatterplot_early
  this.ELBOW_DATA_COMPLETE = []
  this.WINDOWK = []

  this.widthZoomWindow = null
  this.heightZoomWindow = null

  let stage
  let layer
  let nodes = []
  let tooltipLayer

  let tooltip

  this.scale_x = null
  this.scale_y = null
  this.readCsv = null
  this.coordinates = null
  this.first_iteration = true

  this.widthSmallMultiple = null
  this.early_termination = null

  function sleep (time) {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  this.reset = () => {
    nodes = []
    this.start_computation = null
    this.scale_x = null
    this.scale_y = null
    this.readCsv = null
    this.coordinates = null
    this.early_termination = null
    this.first_iteration = true
    this.LABEL_EARLY_TERMINATION = []
    this.ELBOW_DATA_COMPLETE = []

    d3.select('#information-info').html('')
    d3.select('.item-information').style('visibility', 'hidden')
    d3.selectAll('.scatter')
      .style('border-style', 'solid')
      .style('border-width', '0px')
    d3.selectAll('.konvajs-content').remove('*')
  }

  this.initKonva = () => {

    console.log('sto inizializzando il KONVA per lo scatterplt di elbow')
    console.log('doc')
    console.log(document.getElementById('elbow-scatterplot-1'))
    this.width = document
      .getElementById('elbow-scatterplot-1')
      .getBoundingClientRect().width
    this.height = document
      .getElementById('elbow-scatterplot-1')
      .getBoundingClientRect().height
    this.plotDigitIndex = new Int32Array(this.width * this.height)
    this.plotDigitIndex.fill(-1)

    stage = new Konva.Stage({
      container: 'elbow-scatterplot-1',
      width: this.width - this.margin.left - this.margin.right,
      height: this.height - this.margin.top - this.margin.bottom
    })
    layer = new Konva.Layer()
    stage.add(layer)
  }

  function setupTooltip () {
    tooltipLayer = new Konva.Layer()
    tooltip = new Konva.Label({
      opacity: 0.75,
      visible: false,
      listening: false
    })
    tooltip.add(
      new Konva.Tag({
        fill: 'black',
        pointerDirection: 'down',
        pointerWidth: 10,
        pointerHeight: 10
      })
    )
    tooltip.add(
      new Konva.Text({
        test: '',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white'
      })
    )
    tooltipLayer.add(tooltip)
    stage.add(tooltipLayer)
    stage.on('mouseover mousemove', function (evt) {
      let node = evt.target
      if (node) {
        let mousePos = node.getStage().getPointerPosition()
        tooltip.position({
          x: mousePos.x,
          y: mousePos.y - 5
        })
        tooltip.getText().setText(node.getId())
        if (node.getId()) {
          tooltip.show()
        } else {
          tooltip.hide()
        }
        tooltipLayer.batchDraw()
      }
    })
    stage.on('mouseout', function (evt) {
      tooltip.hide()
      tooltipLayer.draw()
    })
    //
    /*let scaleBy = 1.05;
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      let oldScale = stage.scaleX();
  
      let mousePointTo = {
        x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
      };
  
      let newScale = e.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
  
      let newPos = {
        x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
        y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
      };
      for (let node of nodes) {
        let rad = node.getRadius();
        if (e.deltaY > 0) {
          node.setRadius(rad/scaleBy);
        }
        else {
          node.setRadius(rad * scaleBy);
        }
      }
      stage.position(newPos);
      stage.batchDraw();
    });*/
  }

  this.updateScatterplot = (elbowdata, k, lastCalculation) => {
    let labels
    let stability
    let PLOT_SCATTERPLOT = $('input[name="plot-scatterplot"]:checked').val()
    stability_window = $('#select-window-stability').val()

    this.ELBOW_DATA_COMPLETE.push(lastCalculation)

    /*if(!this.scatterplot_early && ALL_DATA[CURRENT_ITERATION].metrics.earlyTermination.fast){
    this.scatterplot_early = true;
    this.STABILITY_EARLY_TERMINATION = ALL_DATA[CURRENT_ITERATION].metrics.progressiveMetrics.entriesStability[stability_window]
  }*/

    if (PLOT_SCATTERPLOT === 'cluster') {
      labels = elbowdata.filter(e => e.k === k)[0].labels
      stability = elbowdata.filter(e => e.k === k)[0].metrics.progressiveMetrics
        .entriesStability[stability_window] // qui la stability la faccio come il cluster label
      //stability = new Array(labels.length).fill(1)
    } else {
      labels = elbowdata.filter(e => e.k === k)[0].labels
      stability = elbowdata.filter(e => e.k === k)[0].metrics.progressiveMetrics
        .entriesStability[stability_window]
      //stability = new Array(labels.length).fill(1)
    }

    plotCoordsKonva(that.tot_rows, k, false, labels, stability)

    if (this.early_termination) {
      console.log('DA CAPIRE COSA FARE')
      //system.scatterplotFixed.updateScatterplot(false,true, system.scatterplotElbow.scale_x,system.scatterplotElbow.scale_y,system.scatterplotElbow.LABEL_EARLY_TERMINATION,system.scatterplotElbow.STABILITY_EARLY_TERMINATION);
    }
  }

  this.updateScatterplotEarlyTermination = (
    labels,
    final_ars,
    iteration_ET,
    stability
  ) => {
    if (this.early_termination === null) {
      this.LABEL_EARLY_TERMINATION = labels
      this.STABILITY_EARLY_TERMINATION = stability

      d3.select('#information-info').html(
        ' Early Termination Fast - Iteration #' +
          iteration_ET +
          '   <b>ARI<b/>: ' +
          (1 - final_ars).toFixed(4)
      ) // devo aggiornare qui
      /*
      system.scatterplotFixed.updateScatterplot(
        false,
        true,
        that.scale_x,
        that.scale_y,
        this.LABEL_EARLY_TERMINATION,
        this.STABILITY_EARLY_TERMINATION
      ) //useScale,useColor, scaleX,ScaleY
      this.early_termination = true
      */
    }
  }

  this.addSmallMultiple = k => {
    var maxValue =
      parseInt(d3.select('#select-maxK-Elbow').property('value')) -
      parseInt(d3.select('#select-minK-Elbow').property('value')) +
      1
    const width_minima =
      document.getElementById('small-multiples').getBoundingClientRect().width /
      8
    this.widthSmallMultiple =
      document.getElementById('small-multiples').getBoundingClientRect().width /
      8
    this.heightSmallMultiple =
      (this.height * this.widthSmallMultiple) / this.width

    d3.select('#small-multiples')
      .append('div')
      .attr('class', 'div-small-multiple')
      .attr('id', 'div-small-' + k)

    d3.select('#div-small-' + k)
      .append('canvas')
      .attr('class', () => 'canvas-small-multiple')
      .attr('id', 'canvas-sm-' + k)
      .attr('width', this.widthSmallMultiple)
      .attr('height', this.heightSmallMultiple)
      .style('margin-botton', '10px')

    d3.select('#div-small-' + k)
      .append('p')
      .attr('class', 'labels-small-multiple')
      .attr('id', 'label-p-' + k)
      .style('text-align', 'center')
      .html('K = ' + k)

    console.log(
      d3.select('#canvas-sm-' + k),
      document.getElementById('canvas-sm-' + k)
    )
    var canvas_selected = document.getElementById('canvas-sm-' + k)
    var dataURL = stage.toDataURL()
    console.log('edc', this.ELBOW_DATA_COMPLETE)
    this.ELBOW_DATA_COMPLETE[this.ELBOW_DATA_COMPLETE.length - 1]['URIData'] =
      dataURL
    var ctx = canvas_selected.getContext('2d')
    var img = new Image()
    img.src = dataURL
    img.onload = () => {
      ctx.drawImage(
        img,
        0,
        0,
        this.width,
        this.height,
        0,
        0,
        this.widthSmallMultiple,
        this.heightSmallMultiple
      ) // Or at whatever offset you like
    }
/*
    if (this.WINDOWK.length < 5) {
      this.WINDOWK.push(k)
      console.log('this.WINDOWK', this.WINDOWK)
      // system.scatterplotElbow.drawZoomWindow(this.WINDOWK.length)
    }

    d3.select('#canvas-sm-' + k).attr('class', () => {
      console.log('SONO QUI', this.WINDOWK.includes(k), this.WINDOWK, k)
      if (this.WINDOWK.includes(k))
        return 'canvas-small-multiple canvas-selected'
      else return 'canvas-small-multiple canvas-not-selected'
    })
      */
  }

  this.drawZoomWindow = num_window => {
    this.widthZoomWindow =
      document.getElementById('window-1').getBoundingClientRect().width - 35
    this.heightZoomWindow = (this.height * this.widthZoomWindow) / this.width

    d3.select('#window-' + num_window)
      .append('canvas')
      .attr('class', 'canvas-zoom-window')
      .attr('id', 'canvas-zw-' + num_window)
      .attr('width', this.widthZoomWindow - 5)
      .attr('height', this.heightZoomWindow)

    console.log('window-' + num_window, num_window)
    var canvas_selected = document.getElementById('canvas-zw-' + num_window)
    var ctx = canvas_selected.getContext('2d')
    var img = new Image()
    img.src = this.ELBOW_DATA_COMPLETE.filter(edc => {
      console.log(edc.k == this.WINDOWK[num_window - 1])
      return edc.k == this.WINDOWK[num_window - 1]
    })[0]['URIData']
    img.onload = () => {
      ctx.drawImage(
        img,
        0,
        0,
        this.width,
        this.height,
        0,
        0,
        this.widthZoomWindow,
        this.heightZoomWindow
      ) // Or at whatever offset you like
    }

    console.log(this.ELBOW_DATA_COMPLETE)
  }

  function scaleClusterStability (metrica, cluster, stability) {
    if (metrica == 'cluster') {
      return that.scale_color[+cluster]
    } else {
      if (stability <= 0.2) {
        return '#a0a0a0'
      }
      if (stability > 0.2 && stability <= 0.8) {
        return '#808080'
      }
      if (stability > 0.8) {
        return that.scale_color[+cluster]
      }
    }
  }

  function scaleOpacityStability (metrica, cluster, stability) {
    if (!$('#stable-check').is(':checked') && stability > 0.8) {
      return 0
    }
    if (
      !$('#midstable-check').is(':checked') &&
      stability > 0.2 &&
      stability <= 0.8
    ) {
      return 0
    }

    if (!$('#unstable-check').is(':checked') && stability <= 0.2) {
      return 0
    }
    return 3.5
  }

  function plotCoordsKonva (numberPoints, k, useScale, labels, stability) {
    if (stability != 0) {
      d3.select('#number-stable').html(
        '(' + stability.filter(d => d > 0.8).length + ')'
      )
      d3.select('#number-midstable').html(
        '(' + stability.filter(d => d > 0.2 && d <= 0.8).length + ')'
      )
      d3.select('#number-unstable').html(
        '(' + stability.filter(d => d <= 0.2).length + ')'
      )
    }
    // first time create the points
    const kWidth = stage.width()
    const kHeight = stage.height()
    let PLOT_SCATTERPLOT = $('input[name="plot-scatterplot"]:checked').val()

    // UPDATE NUMBER OF STABLE POINTS

    if (nodes.length === 0) {
      setupTooltip()
      for (let i = 0; i < that.tot_rows; i++) {
        const xcoord = Math.round(that.scale_x(that.coordData[i][0]))
        const ycoord = Math.round(that.scale_y(that.coordData[i][1]))

        let colorlabel
        let opacitypoint

        colorlabel = scaleClusterStability(
          PLOT_SCATTERPLOT,
          labels[i],
          stability[i]
        )
        opacitypoint = scaleOpacityStability(
          PLOT_SCATTERPLOT,
          labels[i],
          stability[i]
        )

        let node = new Konva.Circle({
          x: xcoord,
          y: ycoord,
          radius: opacitypoint,
          fill: colorlabel, // + colStr,
          //visible: opacitypoint,
          id:
            'i:' +
            i +
            '\nc: ' +
            labels[i] +
            '\nx: ' +
            that.coordData[i][0] +
            '\ny:' +
            that.coordData[i][1]
        })
        layer.add(node)
        nodes.push(node)
      }
    } else {
      for (let i = 0; i < numberPoints; i++) {
        nodes[i].attrs.fill = scaleClusterStability(
          PLOT_SCATTERPLOT,
          labels[i],
          stability[i]
        )
        nodes[i].attrs.radius = scaleOpacityStability(
          PLOT_SCATTERPLOT,
          labels[i],
          stability[i]
        )
      }
    }
    layer.batchDraw()

    d3.selectAll('.scatter')
      .style('border-style', 'solid')
      .style('border-width', '1px')

    system.scatterplotElbow.addSmallMultiple(k)
  }

  function plotCoordsKonvaStability (labels) {
    // first time create the points
    let current_it = ALL_DATA.length - 1
    for (let i = 0; i < nodes.length; i++) {
      const colorlabel = that.scale_color_stability[labels[i]]
      nodes[i].attrs.fill = colorlabel
    }

    layer.batchDraw()

    d3.selectAll('.scatter')
      .style('border-style', 'solid')
      .style('border-width', '1px')
  }

  async function generateDataForScatterplot (
    dataset_projection,
    k,
    labelIteration,
    stability
  ) {
    that.tot_rows = dataset_projection.length

    system.scatterplotFixed.tot_rows = that.tot_rows

    let xs = []

    let first_feature = []
    let second_feature = []

    that.coordData = dataset_projection
    system.scatterplotFixed.coordData = dataset_projection

    for (let i = 0; i < that.tot_rows; i++) {
      let array0 = dataset_projection[i]
      first_feature.push(+array0[0])
      second_feature.push(+array0[1])
      xs = xs.concat(array0)
    }
    that.scale_x = d3
      .scaleLinear()
      .domain([d3.min(first_feature), d3.max(first_feature)])
      .range([10, stage.width() - 10])

    that.scale_y = d3
      .scaleLinear()
      .domain([d3.min(second_feature), d3.max(second_feature)])
      .range([10, stage.height() - 10])

    if (that.first_iteration) {
      plotCoordsKonva(that.tot_rows, k, true, labelIteration, stability)
      //system.scatterplotFixed.updateScatterplot(true,false, that.scale_x,that.scale_y,labelIteration,stability);//useScale,useColor, scaleX,ScaleY
      that.first_iteration = false
    } else {
      plotCoordsKonva(that.tot_rows, k, true, labelIteration, stability)
      //system.scatterplotFixed.updateScatterplot(true,true, that.scale_x,that.scale_y,labelIteration,stability);//useScale,useColor, scaleX,ScaleY
    }
  }

  this.createData = (csvUrl, k, elbowdata, lastCalculation) => {
    console.log(
      '------>',
      k,
      elbowdata,
      elbowdata.filter(e => e.k === k)
    )

    system.scatterplotElbow.reset()
    // system.scatterplotFixed.reset()
    system.scatterplotElbow.initKonva()
    // system.scatterplotFixed.initKonva()
    let PLOT_SCATTERPLOT = $('input[name="plot-scatterplot"]:checked').val()
    stability_window = $('#select-window-stability').val()
    this.WINDOWK = []
    this.ELBOW_DATA_COMPLETE = []
    this.scatterplot_early = false

    let stability_cluster
    stability_cluster = elbowdata.filter(e => e.k === k)[0].labels
    this.ELBOW_DATA_COMPLETE.push(lastCalculation)
    generateDataForScatterplot(
      csvUrl,
      k,
      elbowdata.filter(e => e.k === k)[0].labels,
      stability_cluster
    )
  }

  this.createDataProjection = (csvUrl, labelCluster) => {
    system.scatterplotElbow.reset()
    // system.scatterplotFixed.reset()
    system.scatterplotElbow.initKonva()
    // system.scatterplotFixed.initKonva()
    that.first_iteration = false

    let PLOT_SCATTERPLOT = $('input[name="plot-scatterplot"]:checked').val()
    console.log('PLOT_SCATTERPLOT', PLOT_SCATTERPLOT)

    let stability_cluster
    if (PLOT_SCATTERPLOT === 'cluster') {
      stability_cluster = labelCluster
    } else {
      //stability_cluster = ALL_DATA[CURRENT_ITERATION].metrics.progressiveMetrics[PLOT_SCATTERPLOT]
      stability_cluster =
        ALL_DATA[CURRENT_ITERATION].metrics.progressiveMetrics.entriesStability[
          stability_window
        ]
    }

    generateDataForScatterplot(csvUrl, labelCluster, stability_cluster)
  }

  function displayTexture (gl, texture, diameter) {
    var framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    )

    // Read the contents of the framebuffer
    var fdata = new Float32Array(diameter * diameter * 4)
    gl.readPixels(0, 0, diameter, diameter, gl.RGBA, gl.FLOAT, fdata)

    //gl.deleteFramebuffer(framebuffer);

    let color = 0
    function getMax (prev, cur, ind) {
      if (ind % 4 === color) {
        return prev < cur ? cur : prev
      }
      return prev
    }
    function getMin (prev, cur, ind) {
      if (ind % 4 === color) {
        return prev < cur ? prev : cur
      }
      return prev
    }
    color = 0
    const rangeMaxR = fdata.reduce(getMax, -1e6)
    const rangeMinR = fdata.reduce(getMin, 1e6)
    color = 1
    const rangeMaxG = fdata.reduce(getMax, -1e6)
    const rangeMinG = fdata.reduce(getMin, 1e6)
    color = 2
    const rangeMaxB = fdata.reduce(getMax, -1e6)
    const rangeMinB = fdata.reduce(getMin, 1e6)

    const rData = new Int32Array(diameter * diameter * 4)
    const bData = new Int32Array(diameter * diameter * 4)
    const gData = new Int32Array(diameter * diameter * 4)
    const rgbData = [rData, bData, gData]
    const rgbMins = [rangeMinR, rangeMinG, rangeMinB]
    const rgbMaxs = [rangeMaxR, rangeMaxG, rangeMaxB]

    // split and scale the first three components
    for (let i = 0; i < diameter * diameter * 4; i++) {
      const colIdx = i % 4
      const pixIdx = Math.floor(i / 4) * 4
      if (colIdx < 3) {
        let val = 0
        if (colIdx > 0) {
          val = Math.floor(
            (255 * fdata[i]) / (rgbMaxs[colIdx] - rgbMins[colIdx])
          )
        } else {
          val = Math.floor((255 * fdata[i]) / rgbMaxs[colIdx])
        }
        if (colIdx === 0) {
          // svalues are 0 - 255 range
          rgbData[colIdx][pixIdx] = 255
          rgbData[colIdx][pixIdx + 1] = 255 - val
          rgbData[colIdx][pixIdx + 2] = 255 - val
        }
        if (colIdx === 1 || colIdx == 2) {
          // Vx Vy val is in range -127 -> 127
          if (val >= 0) {
            rgbData[colIdx][pixIdx] = 255
            rgbData[colIdx][pixIdx + 1] = 255 - 2 * val
            rgbData[colIdx][pixIdx + 2] = 255 - 2 * val
          } else {
            rgbData[colIdx][pixIdx + 2] = 255
            rgbData[colIdx][pixIdx] = 255 - 2 * Math.abs(val)
            rgbData[colIdx][pixIdx + 1] = 255 - 2 * Math.abs(val)
          }
        }
        rgbData[colIdx][pixIdx + 3] = 255
      }
    }
  }

  function displayImage (data, diameter, id) {
    const imageTensor = tf.tensor3d(data, [diameter, diameter, 4], 'int32')
    const resizeImage = tf.image.resizeNearestNeighbor(imageTensor, [256, 256])
    const resizeData = resizeImage.dataSync()
    // Create a 2D canvas to store the result
    var canvas = document.getElementById(id)
    canvas.width = 256
    canvas.height = 256
    var context = canvas.getContext('2d')

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(256, 256)
    imageData.data.set(resizeData)
    context.putImageData(imageData, 0, 0)

    var img = new Image()
    img.src = canvas.toDataURL()
    return img
  }

  this.smallMultiples = {
    dms: {
      width: 0,
      height: 0
    },
    konva: {},
    proj: [],
    scaleX: _ => {},
    scaleY: _ => {}
  }

  this.updateSmallDms = () => {
    const { width: pw, height: ph } = document.getElementById('elbow-scatterplot-1').getBoundingClientRect()
    const whratio = pw / ph
    this.smallMultiples.dms.height = document.getElementById('small-multiples').getBoundingClientRect().height - 36
    this.smallMultiples.dms.width = this.smallMultiples.dms.height * whratio
    console.log('w', pw, 'h', ph)
    console.log(this.smallMultiples.dms)
  }

  this.updateSmallScales = (proj) => {
    this.smallMultiples.proj = proj
    const xa = []
    const ya = []
    for (let i = 0; i < proj.length; i++) {
      xa.push(proj[i][0])
      ya.push(proj[i][1])
    }
    this.smallMultiples.scaleX = d3.scaleLinear()
      .domain([d3.min(xa), d3.max(xa)])
      .range([10, this.smallMultiples.dms.width - 10])
    this.smallMultiples.scaleY = d3.scaleLinear()
      .domain([d3.min(ya), d3.max(ya)])
      .range([10, this.smallMultiples.dms.height - 10])
  }

  this.handleNewResult = (proj, result, elbowData) => {
    console.log('pr', proj)
    console.log('rs', result)
    console.log('ed', elbowData)
    this.initSmallMultiple(result.k)
    //this.ELBOW_DATA_COMPLETE.push(elbowData[elbowData.length - 1])
    //this.addSmallMultiple(result.k)
    this.initSmallKonva(result.k)
    this.plotSmallKonva(result.k, result.labels)
  }

  this.initSmallMultiple = (k) => {
    d3.select('#small-multiples')
      .append('div')
      .attr('class', 'div-small-multiple')
      .attr('id', 'div-small-' + k)
    d3.select('#div-small-' + k)
      .append('div')
      .attr('class', 'canvas-small-multiple')
      .attr('id', 'canv-small-' + k)
    /*d3.select('#div-small-' + k)
      .append('canvas')
      .attr('class', () => 'canvas-small-multiple')
      .attr('id', 'canvas-sm-' + k)
      .attr('width', this.smallMultiples.dms.width)
      .attr('height', this.smallMultiples.dms.height)*/
    d3.select('#div-small-' + k)
      .append('div')
      .attr('class', 'labels-small-multiple')
      .attr('id', 'label-p-' + k)
      .style('text-align', 'center')
      .html('K = ' + k)
  }

  this.initSmallKonva = (k) => {
    this.smallMultiples.konva[k] = {
      stage: new Konva.Stage({
        container: 'canv-small-' + k,
        width: this.smallMultiples.dms.width,
        height: this.smallMultiples.dms.height
      }),
      layer: new Konva.Layer()
    }
    this.smallMultiples.konva[k].stage.add(this.smallMultiples.konva[k].layer)
  }

  this.plotSmallKonva = (k, labels) => {
    for (let i = 0; i < this.smallMultiples.proj.length; i++) {
      const x = Math.round(this.smallMultiples.scaleX(this.smallMultiples.proj[i][0]))
      const y = Math.round(this.smallMultiples.scaleY(this.smallMultiples.proj[i][1]))
      const fill = scaleClusterStability('cluster', labels[i])
      radius = 2
      const node = new Konva.Circle({
        x,
        y,
        fill,
        radius,
        id: 'i-' + i + '-l-' + labels[i]
      })
      this.smallMultiples.konva[k].layer.add(node)
    }
    this.smallMultiples.konva[k].layer.batchDraw()
  }

  /**
   * Handle the mousemove event to explore the points in the
   * plot canvas.
   * @param plotCanv
   * @param e
   */
  function plotExplore (plotCtx, e) {
    const x = e.clientX - plotCtx.canvas.offsetLeft
    const y = e.clientY - plotCtx.canvas.offsetTop
    const digitIndex = this.plotDigitIndex[y * plotCanv.width + x]
    if (digitIndex >= 1) {
      const labelEl = document.getElementById('sampId')
      labelEl.innerText = labelSet[digitIndex]
    }
  }

  function restart () {
    cancel = true
    setTimeout(async () => {
      initKonva()
      await system.scatterplotElbow.getData()
    }, 1000)
  }

  return this
}.call({})
