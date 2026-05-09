/**
 * PathIQ ML Engine
 * Matrix Factorization via Stochastic Gradient Descent (SGD)
 * Ported from Python/NumPy implementation in PathIQ_MF_Training.ipynb
 */

class MatrixFactorization {
  constructor({
    nFactors = 8,
    learningRate = 0.01,
    reg = 0.01,
    nEpochs = 100,
    useBias = true,
    lrDecay = 0.0,
    patience = 10,
    seed = 42,
    onEpochEnd = null
  } = {}) {
    this.k = nFactors;
    this.lr = learningRate;
    this.reg = reg;
    this.nEpochs = nEpochs;
    this.useBias = useBias;
    this.lrDecay = lrDecay;
    this.patience = patience;
    this.seed = seed;
    this.onEpochEnd = onEpochEnd;

    this.trainRmseHistory = [];
    this.valRmseHistory = [];
    this.isFitted = false;
    
    // Pseudo-random number generator for reproducibility
    this._rng = this._seedRNG(seed);
  }

  loadWeights(weights) {
    if (!weights) return;
    
    // Handle both flat structure and nested structure
    const pVal = weights.P || (weights.params ? weights.params.P : null);
    const qVal = weights.Q || (weights.params ? weights.params.Q : null);
    const buVal = weights.bu || (weights.params ? weights.params.bu : null);
    const biVal = weights.bi || (weights.params ? weights.params.bi : null);
    const muVal = weights.mu !== undefined ? weights.mu : 
                 (weights.config && weights.config.global_mean !== undefined ? weights.config.global_mean : 0);

    if (pVal) this.P = pVal;
    if (qVal) this.Q = qVal;
    if (buVal) this.bu = buVal instanceof Float32Array ? buVal : new Float32Array(buVal);
    if (biVal) this.bi = biVal instanceof Float32Array ? biVal : new Float32Array(biVal);
    this.mu = muVal;
    
    if (this.P && this.P.length > 0) {
        this.k = this.P[0].length;
    }
    this.isFitted = true;
  }

  _seedRNG(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  _randomNormal(mean = 0, std = 0.1) {
    let u = 0, v = 0;
    while (u === 0) u = this._rng();
    while (v === 0) v = this._rng();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * std + mean;
  }

  _initParams(m, n) {
    this.P = Array.from({ length: m }, () => 
      Array.from({ length: this.k }, () => this._randomNormal(0, 0.1))
    );
    this.Q = Array.from({ length: n }, () => 
      Array.from({ length: this.k }, () => this._randomNormal(0, 0.1))
    );
    this.mu = 0.0;
    this.bu = new Float32Array(m).fill(0);
    this.bi = new Float32Array(n).fill(0);
  }

  _predictOne(u, i) {
    if (!this.P || !this.Q || !this.P[u] || !this.Q[i]) return 0;
    
    let score = 0;
    const k = Math.min(this.k, this.P[u].length, this.Q[i].length);
    for (let f = 0; f < k; f++) {
      score += this.P[u][f] * this.Q[i][f];
    }
    if (this.useBias && this.bu && this.bi) {
      score += (this.mu || 0) + (this.bu[u] || 0) + (this.bi[i] || 0);
    }
    return score;
  }

  predictMatrix(m, n) {
    const RHat = Array.from({ length: m }, () => new Float32Array(n));
    for (let u = 0; u < m; u++) {
      for (let i = 0; i < n; i++) {
        RHat[u][i] = this._predictOne(u, i);
      }
    }
    return RHat;
  }

  _calculateRmse(R, mask) {
    let mse = 0;
    let count = 0;
    for (let u = 0; u < R.length; u++) {
      for (let i = 0; i < R[u].length; i++) {
        if (mask[u][i]) {
          const error = R[u][i] - this._predictOne(u, i);
          mse += error * error;
          count++;
        }
      }
    }
    return Math.sqrt(mse / count);
  }

  async fit(RTrain, trainMask, RVal = null, valMask = null) {
    const m = RTrain.length;
    const n = RTrain[0].length;
    this._initParams(m, n);

    if (this.useBias) {
      let sum = 0;
      let count = 0;
      for (let u = 0; u < m; u++) {
        for (let i = 0; i < n; i++) {
          if (trainMask[u][i]) {
            sum += RTrain[u][i];
            count++;
          }
        }
      }
      this.mu = sum / count;
    }

    const trainPairs = [];
    for (let u = 0; u < m; u++) {
      for (let i = 0; i < n; i++) {
        if (trainMask[u][i]) trainPairs.push([u, i]);
      }
    }

    const hasVal = RVal !== null && valMask !== null;
    let bestValRmse = Infinity;
    let bestParams = null;
    let patienceCounter = 0;

    for (let epoch = 1; epoch <= this.nEpochs; epoch++) {
      const lr = this.lr / (1 + this.lrDecay * epoch);

      // Shuffle pairs
      for (let i = trainPairs.length - 1; i > 0; i--) {
        const j = Math.floor(this._rng() * (i + 1));
        [trainPairs[i], trainPairs[j]] = [trainPairs[j], trainPairs[i]];
      }

      // SGD updates
      for (const [u, i] of trainPairs) {
        const rUi = RTrain[u][i];
        const eUi = rUi - this._predictOne(u, i);

        // Update factors
        for (let f = 0; f < this.k; f++) {
          const puF = this.P[u][f];
          const qiF = this.Q[i][f];
          
          this.P[u][f] += lr * (eUi * qiF - this.reg * puF);
          this.Q[i][f] += lr * (eUi * puF - this.reg * qiF);
        }

        // Update biases
        if (this.useBias) {
          this.bu[u] += lr * (eUi - this.reg * this.bu[u]);
          this.bi[i] += lr * (eUi - this.reg * this.bi[i]);
        }
      }

      const trainRmse = this._calculateRmse(RTrain, trainMask);
      this.trainRmseHistory.push(trainRmse);

      let valRmse = null;
      if (hasVal) {
        valRmse = this._calculateRmse(RVal, valMask);
        this.valRmseHistory.push(valRmse);

        if (valRmse < bestValRmse) {
          bestValRmse = valRmse;
          bestParams = {
            P: JSON.parse(JSON.stringify(this.P)),
            Q: JSON.parse(JSON.stringify(this.Q)),
            bu: new Float32Array(this.bu),
            bi: new Float32Array(this.bi)
          };
          patienceCounter = 0;
        } else {
          patienceCounter++;
          if (patienceCounter >= this.patience) {
            console.log(`Early stopping at epoch ${epoch}`);
            break;
          }
        }
      }

      if (this.onEpochEnd) {
        this.onEpochEnd(epoch, trainRmse, valRmse);
      }

      // Allow UI thread to breathe
      if (epoch % 5 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    if (hasVal && bestParams) {
      this.P = bestParams.P;
      this.Q = bestParams.Q;
      this.bu = bestParams.bu;
      this.bi = bestParams.bi;
    }

    this.isFitted = true;
    return this;
  }

  recommend(internIdx, topN = 5, RKnown = null) {
    if (!this.isFitted) throw new Error("Model not fitted");
    if (internIdx === null || internIdx === undefined || internIdx < 0 || internIdx >= this.P.length) {
        return [];
    }
    
    const m = this.P.length;
    const n = this.Q.length;
    const scores = [];
    
    for (let i = 0; i < n; i++) {
      let score = this._predictOne(internIdx, i);
      
      // If already rated, exclude by setting to -Infinity
      if (RKnown && RKnown[internIdx] && RKnown[internIdx][i] !== null && RKnown[internIdx][i] !== 0) {
        score = -Infinity;
      }
      
      scores.push({ index: i, score });
    }
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}
