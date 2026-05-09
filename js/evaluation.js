/**
 * PathIQ Evaluation Module
 * Handles baseline models and recommendation metrics (Precision@K, Recall@K).
 */

class Evaluator {
  /**
   * Calculate Precision@K and Recall@K
   * @param {MatrixFactorization} model 
   * @param {Array<Float32Array>} R Ground truth matrix
   * @param {Array<Uint8Array>} mask Mask of ratings
   * @param {number} k Number of recommendations to evaluate
   * @param {number} threshold Rating threshold for "relevance" (default 4.0)
   */
  static evaluate(model, R, mask, k = 3, threshold = 4.0) {
    const M = R.length;
    const N = R[0].length;
    
    let totalPrecision = 0;
    let totalRecall = 0;
    let count = 0;

    for (let u = 0; u < M; u++) {
      // Get relevant items for this user (rated >= threshold)
      const relevantItems = [];
      for (let i = 0; i < N; i++) {
        if (mask[u][i] === 1 && R[u][i] >= threshold) {
          relevantItems.push(i);
        }
      }

      if (relevantItems.length === 0) continue;

      // Get top-K recommendations (ignoring mask for evaluation on test set if we had one, 
      // but here we evaluate on the known ratings as per simplified PRD scope)
      const recommendations = model.recommend(u, k, []); // Passing empty array so it doesn't filter out rated items
      const recommendedIndices = recommendations.map(r => r.index);

      // Intersection
      const hits = recommendedIndices.filter(idx => relevantItems.includes(idx)).length;

      totalPrecision += hits / k;
      totalRecall += hits / relevantItems.length;
      count++;
    }

    return {
      precision: count > 0 ? totalPrecision / count : 0,
      recall: count > 0 ? totalRecall / count : 0,
      k: k
    };
  }

  /**
   * Calculate RMSE for a simple baseline: Global Mean
   */
  static getGlobalMeanRMSE(R, mask) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < R.length; i++) {
      for (let j = 0; j < R[i].length; j++) {
        if (mask[i][j] === 1) {
          sum += R[i][j];
          count++;
        }
      }
    }
    const globalMean = sum / count;
    
    let sqError = 0;
    for (let i = 0; i < R.length; i++) {
      for (let j = 0; j < R[i].length; j++) {
        if (mask[i][j] === 1) {
          sqError += Math.pow(R[i][j] - globalMean, 2);
        }
      }
    }
    return Math.sqrt(sqError / count);
  }

  /**
   * Calculate RMSE for a simple baseline: Intern (User) Mean
   */
  static getInternMeanRMSE(R, mask) {
    let sqError = 0;
    let count = 0;
    
    for (let i = 0; i < R.length; i++) {
      let sum = 0;
      let userCount = 0;
      for (let j = 0; j < R[i].length; j++) {
        if (mask[i][j] === 1) {
          sum += R[i][j];
          userCount++;
        }
      }
      const userMean = userCount > 0 ? sum / userCount : 3.0; // Fallback
      
      for (let j = 0; j < R[i].length; j++) {
        if (mask[i][j] === 1) {
          sqError += Math.pow(R[i][j] - userMean, 2);
          count++;
        }
      }
    }
    return Math.sqrt(sqError / count);
  }
}
