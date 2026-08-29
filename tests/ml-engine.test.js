const assert = require('assert');
const { MatrixFactorization } = require('../js/ml-engine.js');

console.log('🧪 Running LearnPath Engine Test Suite...\n');

// Test 1: Initialization & Parameters
(function testInitialization() {
  const mf = new MatrixFactorization({ nFactors: 5, learningRate: 0.02, reg: 0.05, seed: 123 });
  assert.strictEqual(mf.k, 5, 'Factor dimensionality (k) should match input');
  assert.strictEqual(mf.lr, 0.02, 'Learning rate should match input');
  assert.strictEqual(mf.reg, 0.05, 'Regularization parameter should match input');
  assert.strictEqual(mf.isFitted, false, 'Model should initially not be fitted');
  console.log('✅ Test 1 Passed: Initialization & Hyperparameter assignment');
})();

// Test 2: Parameter Initialization Shape
(function testParamInit() {
  const mf = new MatrixFactorization({ nFactors: 4, seed: 42 });
  mf._initParams(10, 8);
  assert.strictEqual(mf.P.length, 10, 'P matrix row count should equal intern count (10)');
  assert.strictEqual(mf.P[0].length, 4, 'P matrix column count should equal factor count (4)');
  assert.strictEqual(mf.Q.length, 8, 'Q matrix row count should equal course count (8)');
  assert.strictEqual(mf.Q[0].length, 4, 'Q matrix column count should equal factor count (4)');
  assert.strictEqual(mf.bu.length, 10, 'User bias vector length should equal 10');
  assert.strictEqual(mf.bi.length, 8, 'Item bias vector length should equal 8');
  console.log('✅ Test 2 Passed: Parameter matrix shapes and bias vectors initialization');
})();

// Test 3: Weight Loading
(function testWeightLoading() {
  const mf = new MatrixFactorization();
  const mockWeights = {
    P: [[0.1, 0.2], [0.3, 0.4]],
    Q: [[0.5, 0.6], [0.7, 0.8]],
    bu: [0.01, -0.02],
    bi: [0.03, -0.04],
    mu: 3.5
  };
  mf.loadWeights(mockWeights);
  assert.strictEqual(mf.isFitted, true, 'Model should be fitted after loading weights');
  assert.strictEqual(mf.k, 2, 'Latent factor count should update to loaded weights dimension');
  assert.strictEqual(mf.mu, 3.5, 'Global mean mu should match loaded weights');
  console.log('✅ Test 3 Passed: Weight loading and state restoration');
})();

// Test 4: Single Prediction Calculation
(function testPrediction() {
  const mf = new MatrixFactorization({ useBias: true });
  mf.loadWeights({
    P: [[0.5, 0.5]],
    Q: [[0.4, 0.4]],
    bu: [0.1],
    bi: [0.2],
    mu: 3.0
  });
  // Prediction formula: P[u]*Q[i] + mu + bu[u] + bi[i] = (0.5*0.4 + 0.5*0.4) + 3.0 + 0.1 + 0.2 = 0.4 + 3.3 = 3.7
  const pred = mf._predictOne(0, 0);
  assert.strictEqual(Math.round(pred * 100) / 100, 3.7, 'Prediction should evaluate dot product plus biases');
  console.log('✅ Test 4 Passed: Matrix dot product + bias prediction formula');
})();

// Test 5: SGD Fit & Convergence
(async function testFitting() {
  const RTrain = [
    [5, 3, 0],
    [4, 0, 1],
    [1, 1, 5]
  ];
  const trainMask = [
    [true, true, false],
    [true, false, true],
    [true, true, true]
  ];
  const mf = new MatrixFactorization({ nFactors: 3, nEpochs: 50, learningRate: 0.02, reg: 0.01, seed: 42 });
  await mf.fit(RTrain, trainMask);
  
  assert.strictEqual(mf.isFitted, true, 'Model fit should complete successfully');
  assert.strictEqual(mf.trainRmseHistory.length, 50, 'Training history should contain 50 epochs');
  const initialRmse = mf.trainRmseHistory[0];
  const finalRmse = mf.trainRmseHistory[mf.trainRmseHistory.length - 1];
  assert.ok(finalRmse < initialRmse, `RMSE should decrease: initial ${initialRmse.toFixed(4)} -> final ${finalRmse.toFixed(4)}`);
  console.log(`✅ Test 5 Passed: SGD Optimization & Convergence (RMSE dropped from ${initialRmse.toFixed(4)} to ${finalRmse.toFixed(4)})`);

  // Test 6: Recommendations Output
  const recs = mf.recommend(0, 2, RTrain);
  assert.strictEqual(recs.length, 2, 'Should return requested top 2 recommendations');
  assert.ok(recs[0].score >= recs[1].score, 'Recommendations should be sorted descending by score');
  console.log('✅ Test 6 Passed: Top-N Recommendation generation and sorting');

  console.log('\n🎉 All 6 LearnPath Engine tests passed cleanly with 0 failures!');
})();
