# UnityBench-Mini3D

UnityBench-Mini3D evaluates LLM agents on 3D game development in Unity through **77 project-level tasks**, **1,178 held-out milestone tests**, and **seven development skills**. Tests check scene structure, component configuration, and runtime behavior inside the engine, with partial credit for completed milestones.

This repository contains the project website, including an interactive task explorer, initial/golden-reference comparisons, evaluation results, and citation information.

- **Paper:** [UnityBench-Mini3D: Evaluating LLM Agents for 3D Game Development in Unity](https://arxiv.org/abs/2610.35980)
- **Project page:** [unitybench.github.io/unitybench-mini3d](https://unitybench.github.io/unitybench-mini3d/) — available after a successful GitHub Pages deployment.

## Local preview

The site uses HTML, CSS, and JavaScript. No build step or Node.js dependencies are required.

Open `index.html` directly, or run the following command from the repository root:

```bash
python3 -m http.server 8000
```

Then open [localhost:8000](http://localhost:8000). HTTP previews load the JSON data directly. Opening the HTML file directly uses the bundled offline data snapshot.

After editing `assets/tasks.json` or `assets/results.json`, regenerate that snapshot for direct-file previews:

```bash
python3 tools/sync-data.py
```

The generator uses only the Python standard library. Commit the updated JSON and generated `assets/benchmark-data.js` together.

## Deploy with GitHub Pages

1. Keep the website files at the repository root, including `.github/` and `.nojekyll`.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main`, or run **Deploy GitHub Pages** manually from the **Actions** tab.

The workflow publishes the static files without a build step. If you use a different branch, update `branches` in `.github/workflows/pages.yml`. The deployment result provides the published URL.

## Files and maintenance

| File | Purpose |
| --- | --- |
| `index.html` | Page content, paper links, contributors, and citation |
| `style.css` | Layout, responsive styles, and Unity research colors |
| `script.js` | Task filters, comparisons, results sorting, and navigation |
| `assets/tasks.json` | Task descriptions, categories, difficulty, and image paths |
| `assets/results.json` | Model–harness evaluation data |
| `assets/tasks/` | Initial and golden-reference screenshots |
| `assets/benchmark-data.js` | Generated data for direct-file previews |
| `tools/sync-data.py` | Offline snapshot generator |
| `.github/workflows/pages.yml` | GitHub Pages deployment workflow |

In `results.json`, scores are percentages, `cost` is average API cost per task in USD, and `time` is average wall-clock time per task in minutes. Use `null` for unreported values. Update the source JSON files rather than editing the generated snapshot.
