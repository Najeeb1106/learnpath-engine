# LearnPath Engine — System Architecture & Design Specification

> High-level architectural specification, matrix factorization mathematical foundation, data flow pipelines, and component interaction models.

---

## 1. System Overview

**LearnPath Engine** is a client-side Machine Learning system that provides personalized learning path recommendations for tech interns using **Latent Factor Matrix Factorization** optimized via **Stochastic Gradient Descent (SGD)** with **L2 Regularization**.

```
                           ┌─────────────────────────────────────────┐
                           │            User Interface               │
                           │   (HTML5 / Glassmorphism Design CSS)    │
                           └────────────────────┬────────────────────┘
                                                │ Events / State
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │          UI Controller / Router         │
                           │              (js/script.js)             │
                           └──────────────┬───────────┬──────────────┘
                                          │           │
                     Model Weights & State│           │Data Matrix
                                          ▼           ▼
┌───────────────────────────────────────────┐       ┌───────────────────────────────────────────┐
│           Storage & Artifacts             │       │            ML Compute Engine              │
│  - Pre-trained Weights (js/trained-weights)│       │          (js/ml-engine.js)               │
│  - LocalStorage State Persistence         │       │  - Matrix Initialization & RNG Seed       │
│  - Python NumPy Converters                │       │  - SGD Optimization & Bias Calculations  │
└───────────────────────────────────────────┘       │  - Top-N Ranking & Evaluation Metrics    │
                                                    └───────────────────────────────────────────┘
```

---

## 2. Recommendation Engine Mathematical Model

### 2.1 Latent Factor Matrix Factorization

Given an intern-course rating matrix $R \in \mathbb{R}^{m \times n}$ where $m$ is the number of interns and $n$ is the number of courses, we approximate $R$ as the product of two lower-rank matrices:

$$\hat{R} = P Q^T$$

where:
- $P \in \mathbb{R}^{m \times k}$ represents intern latent factor profiles
- $Q \in \mathbb{R}^{n \times k}$ represents course latent factor profiles
- $k \ll \min(m, n)$ is the latent factor dimension (default $k=8$)

### 2.2 Rating Prediction with Biases

To account for global rating trends, systematic intern rating tendencies, and course difficulty bias, we incorporate bias terms into the prediction formula:

$$\hat{r}_{u,i} = \mu + b_u + b_i + P_u \cdot Q_i^T$$

where:
- $\mu$: Global mean of observed ratings
- $b_u$: Bias of intern $u$ (e.g., strict vs lenient grader)
- $b_i$: Bias of course $i$ (e.g., universally high-rated or difficult course)
- $P_u \in \mathbb{R}^k$: Latent factor vector for intern $u$
- $Q_i \in \mathbb{R}^k$: Latent factor vector for course $i$

### 2.3 Regularized Objective Function

The parameters $\{P, Q, b_u, b_i\}$ are learned by minimizing the regularized mean squared error over observed ratings $\Omega$:

$$\mathcal{L} = \frac{1}{2} \sum_{(u,i) \in \Omega} \left( r_{u,i} - \hat{r}_{u,i} \right)^2 + \frac{\lambda}{2} \sum_{u} \|P_u\|_2^2 + \frac{\lambda}{2} \sum_{i} \|Q_i\|_2^2 + \frac{\lambda}{2} \sum_{u} b_u^2 + \frac{\lambda}{2} \sum_{i} b_i^2$$

where $\lambda$ is the L2 regularization hyperparameter to prevent overfitting.

### 2.4 Stochastic Gradient Descent (SGD) Update Rules

For each observed rating $r_{u,i}$, compute prediction error $e_{u,i} = r_{u,i} - \hat{r}_{u,i}$. Parameters are updated per step with learning rate $\eta$:

$$P_{u,f} \leftarrow P_{u,f} + \eta \left( e_{u,i} Q_{i,f} - \lambda P_{u,f} \right)$$

$$Q_{i,f} \leftarrow Q_{i,f} + \eta \left( e_{u,i} P_{u,f} - \lambda Q_{i,f} \right)$$

$$b_u \leftarrow b_u + \eta \left( e_{u,i} - \lambda b_u \right)$$

$$b_i \leftarrow b_i + \eta \left( e_{u,i} - \lambda b_i \right)$$

---

## 3. Data Flow & Layer Breakdown

### 3.1 Data Preparation (`js/data.js`)
- Standardized rating matrix initialization
- Course taxonomy categorization (Frontend, Backend, ML, DevOps, Security, Cloud)
- Intern skill baseline metadata

### 3.2 Machine Learning Engine (`js/ml-engine.js`)
- **Deterministic RNG**: Custom linear congruential generator for reproducible matrix initializations across browsers
- **Non-blocking Training Loop**: Asynchronous epoch execution yielding to the browser event loop (`setTimeout(0)`) every 5 epochs to maintain 60fps UI responsiveness
- **Early Stopping Monitor**: Tracks validation RMSE and triggers early stop when loss fails to decrease for `patience` consecutive epochs

### 3.3 Evaluation Engine (`js/evaluation.js`)
- Root Mean Squared Error (RMSE): $\text{RMSE} = \sqrt{\frac{1}{|\Omega|} \sum_{(u,i)\in\Omega} (r_{u,i} - \hat{r}_{u,i})^2}$
- Mean Absolute Error (MAE): $\text{MAE} = \frac{1}{|\Omega|} \sum_{(u,i)\in\Omega} |r_{u,i} - \hat{r}_{u,i}|$

### 3.4 Data Pipeline Converter (`scripts/convert_artifacts.py`)
- Reads trained NumPy arrays (`.npy`) generated by Python model training pipelines
- Exports sanitized, serialized JavaScript artifacts into `js/trained-weights.js`

---

## 4. Security & Performance Considerations

1. **Client-Side Data Privacy**: All ML computations occur in-browser; intern evaluations never transmit over external networks.
2. **Memory Efficiency**: Factor matrices use typed arrays (`Float32Array`) for lightweight footprint (< 500 KB total memory overhead).
3. **Storage Sanitization**: Input vectors are validated and sanitized prior to `localStorage` synchronization.
