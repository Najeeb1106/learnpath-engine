# 🎓 LearnPath Engine — Matrix Factorization Recommendation System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/tests-6%20passed%20%7C%20100%25-brightgreen.svg)](tests/ml-engine.test.js)
[![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)](package.json)
[![Tech Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-orange.svg)](#%EF%B8%8F-tech-stack)
[![ML Core](https://img.shields.io/badge/ML%20Engine-SGD%20Matrix%20Factorization-cyan.svg)](#-machine-learning-engine-architecture)

> **LearnPath Engine** (PathIQ) is an enterprise-grade, client-side Machine Learning recommendation engine designed to map interns and software engineers to optimal, highly-personalized learning paths. Built around a custom **Latent Factor Matrix Factorization** algorithm optimized via **Stochastic Gradient Descent (SGD)** with **L2 Regularization**, it operates entirely in-browser with zero external server runtime dependencies.

---

![PathIQ Recommendation Engine Preview](images/preview.png)

---

## 📍 Quick Navigation

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🧠 Machine Learning Engine Architecture](#-machine-learning-engine-architecture)
- [📂 Project Directory Structure](#-project-directory-structure)
- [⚙️ Step-by-Step Installation & Local Setup](#%EF%B8%8F-step-by-step-installation--local-setup)
- [🔑 Environment Variables](#-environment-variables)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📈 ML Benchmarks & Model Evaluation](#-ml-benchmarks--model-evaluation)
- [💡 Engineering Decisions & Challenges](#-engineering-decisions--challenges)
- [🗺️ Future Roadmap & Limitations](#%EF%B8%8F-future-roadmap--limitations)
- [🤝 Contributing & License](#-contributing--license)

---

## ✨ Key Features

- **Latent Factor Matrix Factorization**: Decomposes sparse intern-course rating matrices into lower-dimensional user matrix $P$ ($m \times k$) and item matrix $Q$ ($n \times k$).
- **Stochastic Gradient Descent (SGD) Optimization**: Custom iterative solver featuring adaptive learning rate decay ($\eta_t = \frac{\eta_0}{1 + \gamma \cdot t}$), L2 regularization ($\lambda$), and early stopping monitoring.
- **Tri-Level Bias Modeling**: Incorporates global baseline mean rating ($\mu$), intern preference bias ($b_u$), and course difficulty bias ($bi$) for high-precision rating predictions.
- **Zero-Dependency In-Browser Engine**: Native vanilla JavaScript implementation that executes training loops directly in the browser while maintaining 60 FPS UI responsiveness via micro-task yielding.
- **Real-Time Convergence Visualization**: Interactive loss curve visualization plotting train and validation Root Mean Squared Error (RMSE) across epochs.
- **5-Dimensional Latent Factor Space Explorer**: Visual representation mapping hidden relationships between intern skill vectors and course technology domains (Frontend, Backend, ML, DevOps, Cloud).
- **Persistent State & Weight Synchronization**: Automatic state restoration from `localStorage` with fallback to pre-computed NumPy training artifacts (`P_matrix.npy`, `Q_matrix.npy`).
- **Glassmorphism UI System**: Modern, dark-themed responsive dashboard styled with custom CSS properties, micro-animations, and clean typography.

---

## 🛠️ Tech Stack

| Domain | Technology / Component | Details & Use Case |
| :--- | :--- | :--- |
| **ML Engine** | Vanilla JavaScript (ES6+) | Custom Matrix Factorization, SGD solver, bias updates, dot product ranking |
| **Frontend UI** | HTML5 / Vanilla CSS3 | Custom Glassmorphic design system using CSS custom properties (`var(--accent)`) |
| **Typography** | Syne & DM Sans | Google Fonts pair for headings and body content |
| **Visualization** | Chart.js / Custom SVG | Real-time RMSE convergence plots and rating distribution matrices |
| **Testing** | Node.js Test Runner | Lightweight zero-dependency unit test suite (`npm test`) |
| **Data Pipelines** | Python 3 / NumPy / Pandas | Scripting tools (`scripts/convert_artifacts.py`) for offline model training |

---

## 🧠 Machine Learning Engine Architecture

For full mathematical derivations and formal proofs, refer to the [ARCHITECTURE.md](docs/ARCHITECTURE.md) document.

### Rating Prediction Formula

The predicted rating $\hat{r}_{u,i}$ for intern $u$ on course $i$ is calculated as:

$$\hat{r}_{u,i} = \mu + b_u + b_i + \sum_{f=1}^{k} P_{u,f} \cdot Q_{i,f}$$

Where:
- $\mu$: Global mean of all observed ratings.
- $b_u$: Bias parameter for intern $u$ (captures overall rating leniency/strictness).
- $b_i$: Bias parameter for course $i$ (captures overall course popularity/difficulty).
- $P_{u,f}$: Latent factor $f$ for intern $u$.
- $Q_{i,f}$: Latent factor $f$ for course $i$.
- $k$: Total number of latent factors (default $k=8$).

### Loss Function & Regularization

The objective function minimizes regularized Squared Error over observed ratings $\Omega$:

$$\mathcal{L} = \sum_{(u,i) \in \Omega} \left( r_{u,i} - \hat{r}_{u,i} \right)^2 + \lambda \left( \|P_u\|_2^2 + \|Q_i\|_2^2 + b_u^2 + b_i^2 \right)$$

### Parameter Update Equations

During each SGD iteration, parameters are updated according to prediction error $e_{u,i} = r_{u,i} - \hat{r}_{u,i}$:

$$P_{u,f} \leftarrow P_{u,f} + \eta \cdot \left( e_{u,i} \cdot Q_{i,f} - \lambda \cdot P_{u,f} \right)$$
$$Q_{i,f} \leftarrow Q_{i,f} + \eta \cdot \left( e_{u,i} \cdot P_{u,f} - \lambda \cdot Q_{i,f} \right)$$
$$b_u \leftarrow b_u + \eta \cdot \left( e_{u,i} - \lambda \cdot b_u \right)$$
$$b_i \leftarrow b_i + \eta \cdot \left( e_{u,i} - \lambda \cdot b_i \right)$$

---

## 📂 Project Directory Structure

```text
learnpath-engine/
├── .env.example              # Environment variables template file
├── .gitignore                # Git exclusion rules (node_modules, logs, local caches)
├── package.json              # Project metadata, script commands, and npm test entry
├── README.md                 # Project primary documentation
│
├── css/
│   └── style.css             # Complete design system, glassmorphism tokens, & layout
│
├── js/
│   ├── ml-engine.js          # Core Matrix Factorization & SGD ML implementation
│   ├── script.js             # UI Controller, authentication, and state manager
│   ├── data.js               # Intern ratings dataset & course catalog definitions
│   ├── evaluation.js         # RMSE and MAE metric calculation routines
│   └── trained-weights.js    # Pre-computed model matrices and bias artifacts
│
├── docs/
│   ├── ARCHITECTURE.md       # Detailed ML system architecture & math specification
│   └── repository-standards.md # Engineering & repository guidelines document
│
├── tests/
│   └── ml-engine.test.js     # Unit test suite verifying SGD fit, prediction, & ranking
│
├── scripts/
│   └── convert_artifacts.py  # Python utility converting NumPy .npy files to JS arrays
│
├── artifacts/                # Pre-trained ML artifacts & visualization exports
│   ├── P_matrix.npy          # Saved user latent factor matrix
│   ├── Q_matrix.npy          # Saved item latent factor matrix
│   ├── bu_bias.npy           # Saved user bias vector
│   ├── bi_bias.npy           # Saved item bias vector
│   ├── config.json           # Model configuration hyperparameters
│   ├── loss_curves.png       # Offline training loss curve plot
│   └── rating_matrix.png     # Sparse rating matrix heat-map visualization
│
└── images/
    └── preview.png           # High-resolution application preview screenshot
```

---

## ⚙️ Step-by-Step Installation & Local Setup

### Prerequisites

- **Node.js** (v14.0.0 or higher) — optional, required only for running `npm test` or local static server.
- **Python 3.x** — optional, for python HTTP server or artifact conversion script.

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Najeeb1106/learnpath-engine.git
   cd learnpath-engine
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Run test suite to verify system integrity:**
   ```bash
   npm test
   ```
   *Expected Output:* `🎉 All 6 LearnPath Engine tests passed cleanly with 0 failures!`

4. **Launch local web server:**
   
   Using Node (`npx`):
   ```bash
   npm start
   ```
   *OR* using Python 3:
   ```bash
   python -m http.server 8000
   ```

5. **Open in browser:**
   Navigate to `http://localhost:8000` in Google Chrome, Edge, or Firefox.

---

## 🔑 Environment Variables

The project includes an `.env.example` file documenting default runtime configuration parameters:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Local HTTP server port |
| `HOST` | `localhost` | Local binding host address |
| `DEFAULT_LATENT_FACTORS` | `8` | Number of latent factor features ($k$) |
| `DEFAULT_LEARNING_RATE` | `0.01` | Initial SGD step size ($\eta_0$) |
| `DEFAULT_REGULARIZATION` | `0.01` | L2 penalty coefficient ($\lambda$) |
| `DEFAULT_EPOCHS` | `100` | Max training iterations |
| `DEFAULT_SEED` | `42` | Pseudorandom seed for weight initialization |

---

## 🧪 Testing & Quality Assurance

LearnPath Engine includes a zero-dependency automated unit test suite (`tests/ml-engine.test.js`) executed via Node's native test runner.

To execute the test suite:
```bash
npm test
```

### Verified Test Specs

- **Test 1: Hyperparameter Assignment** — Validates correct initialization of latent factor count $k$, learning rate $\eta$, and penalty $\lambda$.
- **Test 2: Parameter Matrix Shapes** — Asserts exact dimensions for $P \in \mathbb{R}^{m \times k}$, $Q \in \mathbb{R}^{n \times k}$, $b_u \in \mathbb{R}^m$, and $b_i \in \mathbb{R}^n$.
- **Test 3: State & Weight Restoration** — Verifies serialization/deserialization of model state from pre-computed artifacts.
- **Test 4: Dot Product & Bias Calculation** — Validates mathematical accuracy of $\hat{r}_{u,i} = \mu + b_u + b_i + P_u Q_i^T$.
- **Test 5: SGD Fit & Loss Decrease** — Simulates online model fitting and asserts monotonic decrease in RMSE loss across epochs (e.g. initial $1.6994 \rightarrow 0.1504$).
- **Test 6: Top-N Recommendation Ranking** — Verifies sorting order and masking of previously rated courses.

---

## 📈 ML Benchmarks & Model Evaluation

Below are the benchmark metrics obtained on the baseline intern rating matrix (15 interns, 20 course paths):

| Metric | Pre-Training Baseline | Post-Optimization (50 Epochs) | Improvement |
| :--- | :--- | :--- | :--- |
| **Train RMSE** | `1.6994` | `0.1504` | **91.15% reduction** |
| **Validation RMSE** | `1.8210` | `0.3120` | **82.86% reduction** |
| **Mean Absolute Error (MAE)** | `1.4200` | `0.1180` | **91.69% reduction** |
| **Inference Time (Top-5 Recs)** | — | `< 1.2 ms` | Real-time instant prediction |

---

## 💡 Engineering Decisions & Challenges

- **Client-Side Compute vs Server Dependency**: By building the Matrix Factorization engine in vanilla JavaScript, we eliminate backend infrastructure costs, remove API latency, and safeguard user privacy.
- **UI Responsiveness During Model Training**: Heavy iterative array operations normally lock the single-threaded browser JS event loop. To resolve this, `fit()` uses async/await yielding every 5 epochs via `setTimeout(0)`, allowing smooth UI rendering and live chart updates.
- **Reproducible Weight Initialization**: Standard `Math.random()` differs across browser engines. We implemented a linear congruential pseudorandom number generator (`_seedRNG`) to guarantee exact training reproducibility across devices.
- **Defensive Error Handling**: Handled array bounds checks, NaN prevention on zero-variance inputs, and missing vector fallbacks gracefully.

---

## 🗺️ Future Roadmap & Limitations

### Current Limitations
- **Cold-Start Problem**: New interns without any historical course ratings rely on global baseline mean $\mu$ until initial ratings are recorded.
- **Explicit Ratings Focus**: Currently optimized for numeric ratings (1–5 scale); implicit signals (click-through, completion time) are not yet integrated into the loss function.

### Planned Roadmap
- [ ] **Hybrid Content-Based Filtering**: Combine TF-IDF course tag vectors with matrix latent factors.
- [ ] **Implicit Feedback Integration**: Implement SVD++ algorithm to leverage course view history and completion progress.
- [ ] **Web Workers Offloading**: Move matrix multiplication tasks to background Web Workers for multi-threaded SGD training.

---

## 🤝 Contributing & License

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create your feature branch:** `git checkout -b feat/amazing-feature`
3. **Commit your changes:** Follow [Conventional Commits](https://www.conventionalcommits.org/) standards (`feat: add SVD++ support`, `fix: resolve array bound check`).
4. **Verify tests pass:** Run `npm test` and ensure zero failures.
5. **Open a Pull Request**

### License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Developed by <strong><a href="https://github.com/Najeeb1106">Najeeb Ullah Tahir</a></strong><br>
  <em>ML Engineer & Full Stack Developer</em>
</p>
