import numpy as np
import json
import os

artifacts_dir = 'pathiq_artifacts'
output_file = 'pathiq_app/js/trained-weights.js'

data = {}

# Load matrices
if os.path.exists(os.path.join(artifacts_dir, 'P_matrix.npy')):
    data['P'] = np.load(os.path.join(artifacts_dir, 'P_matrix.npy')).tolist()
if os.path.exists(os.path.join(artifacts_dir, 'Q_matrix.npy')):
    data['Q'] = np.load(os.path.join(artifacts_dir, 'Q_matrix.npy')).tolist()
if os.path.exists(os.path.join(artifacts_dir, 'bu_bias.npy')):
    data['bu'] = np.load(os.path.join(artifacts_dir, 'bu_bias.npy')).tolist()
if os.path.exists(os.path.join(artifacts_dir, 'bi_bias.npy')):
    data['bi'] = np.load(os.path.join(artifacts_dir, 'bi_bias.npy')).tolist()

# Load config
if os.path.exists(os.path.join(artifacts_dir, 'config.json')):
    with open(os.path.join(artifacts_dir, 'config.json'), 'r') as f:
        data['config'] = json.load(f)

js_content = f"const trainedWeights = {json.dumps(data)};\n"

with open(output_file, 'w') as f:
    f.write(js_content)

print(f"Generated {output_file}")
