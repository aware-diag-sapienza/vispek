function parseNewBackendPartialResult(newResult) {
  const timestamp = Date.now()

  const metricObject = {
    earlyTermination: {
      slow: newResult.earlyTermination["slow-notify"] != undefined && newResult.earlyTermination["slow-notify"] == true ? true : false,
      fast: newResult.earlyTermination["fast-notify"] != undefined && newResult.earlyTermination["fast-notify"] == true ? true : false
    },
    labelsMetrics: {
      inertia: newResult.metrics.labelsValidationMetrics.inertia,
      dbIndex: newResult.metrics.labelsValidationMetrics.davies_bouldin,
      dunnIndex: newResult.metrics.labelsValidationMetrics.dunn_index,
      calinskyHarabasz: newResult.metrics.labelsValidationMetrics.calinski_harabasz,
      simplifiedSilhouette: newResult.metrics.labelsValidationMetrics.simplified_silhouette
    },
    partitionsMetrics: {
      inertia: newResult.metrics.partitionsValidationMetrics.inertia,
      dbIndex: newResult.metrics.partitionsValidationMetrics.davies_bouldin,
      dunnIndex: newResult.metrics.partitionsValidationMetrics.dunn_index,
      calinskyHarabasz: newResult.metrics.partitionsValidationMetrics.calinski_harabasz,
      simplifiedSilhouette: newResult.metrics.partitionsValidationMetrics.simplified_silhouette,
      adjustedRandScore: newResult.metrics.partitionsComparisonMetrics.ari,
      adjustedMutualInfoScore: newResult.metrics.partitionsComparisonMetrics.ami,
      averageAdjustedRandScore: newResult.metrics.partitionsComparisonMetrics.ari.map(d => d3.mean),
      averageAdjustedMutualInfoScore: newResult.metrics.partitionsComparisonMetrics.ami.map(d => d3.mean),
    },
    progressiveMetrics: {
      entriesStability: {
        '2': newResult.metrics.labelsProgressionMetrics.entries_stability_2,
        '3': newResult.metrics.labelsProgressionMetrics.entries_stability_3,
        '4': newResult.metrics.labelsProgressionMetrics.entries_stability_4,
        '5': newResult.metrics.labelsProgressionMetrics.entries_stability_5,
        '10': newResult.metrics.labelsProgressionMetrics.entries_stability_10,
        all: newResult.metrics.labelsProgressionMetrics.entries_stability_all
      },
      globalStability: {
        '2': d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_2),
        '3': d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_3),
        '4': d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_4),
        '5': d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_5),
        '10': d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_10),
        all: d3.mean(newResult.metrics.labelsProgressionMetrics.entries_stability_all)
      },
      partitionsGlobalStability: {
        '2': newResult.metrics.partitionsProgressionMetrics.global_stability_2,
        '3': newResult.metrics.partitionsProgressionMetrics.global_stability_3,
        '4': newResult.metrics.partitionsProgressionMetrics.global_stability_4,
        '5': newResult.metrics.partitionsProgressionMetrics.global_stability_5,
        '10': newResult.metrics.partitionsProgressionMetrics.global_stability_10,
        all: newResult.metrics.partitionsProgressionMetrics.global_stability_all
      },
      adjustedRandScore: d3.mean(newResult.metrics.partitionsComparisonMetrics.ari.map(d => d3.mean)),
      adjustedMutualInfoScore: d3.mean(newResult.metrics.partitionsComparisonMetrics.ami.map(d => d3.mean))
    }

  }

  const oldResultFormat = {
    jobId: newResult.taskId,
    iteration: newResult.info.iteration,
    timestamp: timestamp,
    isLast: newResult.info.last,
    info: {
        timestamp: timestamp,
        iteration: newResult.info.iteration,
        is_last: newResult.info.last,
        is_last_et: newResult.info.last,
        n_clusters: 2,
        n_runs: 2,
        best_run: newResult.info.bestRun,
        completed_runs: 0,
        completed_runs_status: newResult.runsStatus.runCompleted.split('-').map(d => d == 1 ? true : false),
        runs_iterations: newResult.runsStatus.runIteration.split('-').map(d => parseInt(d))
    },
    labels: newResult.labels,
    metrics: metricObject,
    partitions: newResult.partitions
  }


  return oldResultFormat
}





function parseNewBackendElbowPartialResult(newResult) {
  const timestamp = Date.now()

  const metricObject = {
    labelsMetrics: {
      inertia: newResult.metrics.labelsValidationMetrics.inertia,
      dbIndex: newResult.metrics.labelsValidationMetrics.davies_bouldin,
      dunnIndex: newResult.metrics.labelsValidationMetrics.dunn_index,
      calinskyHarabasz: newResult.metrics.labelsValidationMetrics.calinski_harabasz,
      simplifiedSilhouette: newResult.metrics.labelsValidationMetrics.simplified_silhouette
    },
    partitionsMetrics: {
      inertia: newResult.metrics.partitionsValidationMetrics.inertia,
      dbIndex: newResult.metrics.partitionsValidationMetrics.davies_bouldin,
      dunnIndex: newResult.metrics.partitionsValidationMetrics.dunn_index,
      calinskyHarabasz: newResult.metrics.partitionsValidationMetrics.calinski_harabasz,
      simplifiedSilhouette: newResult.metrics.partitionsValidationMetrics.simplified_silhouette,
      adjustedRandScore: newResult.metrics.partitionsComparisonMetrics.ari,
      adjustedMutualInfoScore: newResult.metrics.partitionsComparisonMetrics.ami,
      averageAdjustedRandScore: newResult.metrics.partitionsComparisonMetrics.ari.map(d => d3.mean),
      averageAdjustedMutualInfoScore: newResult.metrics.partitionsComparisonMetrics.ami.map(d => d3.mean),
    }
  }

  const result = {
    jobId: newResult.taskId,
    timestamp: Date.now(),
    k: newResult.info.n_clusters,
    seed: newResult.info.seed,
    elbowSeed: null,
    inertia: newResult.info.inertia,
    simplifiedSilhouette: newResult.metrics.labelsValidationMetrics.simplified_silhouette,
    isLast: newResult.info.last,
    elbowPoint: newResult.info.elbowPoint,
    metrics: metricObject,
    labels: newResult.labels
  }

  return result
}