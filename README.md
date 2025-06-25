# Rahmenabkommen-GPT 🇨🇭🇪🇺

> **"Ask your question about the new framework agreement between Switzerland and the EU."**
> Answers are neutral, factual, and exclusively based on official treaty texts – no opinions, interpretations, or speculation.

## What It Does

This app allows users to ask natural-language questions about the "Rahmenabkommen/Bilaterale III" (framework agreement) between Switzerland and the EU. It retrieves passages from official PDFs (e.g., Bilaterale III documents), indexes them as embeddings, and provides fact-based answers using a combination of semantic search and prompt completion.

## ⚙️ Tech Stack

### Backend
- **Python** 3.9-3.11
- **Flask** REST API
- **Gunicorn** (production WSGI server)
- **SQLite** for structured data
- **FAISS** for fast vector similarity search
- **Flask-Migrate** for DB schema versioning

### Frontend
- **Remix (React-based)** UI
- **Vite** as dev server/bundler
- **Node.js / npm**

## 📂 Shell Script Reference

### `api/bin/`

| Script            | Description |
|-------------------|-------------|
| `activate.sh`     | Activates a Python virtual environment from the project root. **Must** be run via `source` or `.` so the environment stays active in the current terminal session. |
| `setup.sh`        | Complete backend setup script if you are using a virtual environment for Python. Checks for Python, creates and activates a virtual environment, installs Python dependencies, and initializes or upgrades the SQLite database with Flask-Migrate. |
| `migrate.sh`      | Creates a new DB migration. First applies all existing migrations, then creates a new one with a provided description.<br>Usage: `./migrate.sh "Add table xyz"` |
| `preprocess.sh`  | Runs the Python preprocessing script `vector/preprocess.py` to extract, chunk, and prepare text data from PDFs for vector embedding. Must be run with the Python virtual environment activated. |
| `server.sh`       | Starts the Flask app with Gunicorn for production: 4 workers, bound to port `8000`, loading `main:app`. Uses `PYTHONPATH` to run in project root. |

### `ui/bin/`

| Script        | Description |
|---------------|-------------|
| `setup.sh`    | Installs all Node.js dependencies using `npm install`. Run this once before development or after cloning. |
| `server.sh`   | Starts the local Remix development server via `npm run dev`. Hot-reloads changes and serves the frontend. |

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/nicolaric/rahmenabkommen-gpt.git
cd rahmenabkommen-gpt
```

### 2. Backend Setup

```bash
cd api
source bin/activate.sh         # Activate Python virtualenv
bin/setup.sh                   # Full install + DB setup
bin/server.sh                  # Start API server
```

### 3. Frontend Setup

```bash
cd ui
bin/setup.sh                   # Install UI dependencies
bin/server.sh                  # Start Remix dev server
```

## 🧩 Architecture

```
┌──────────────────────────────┐
│         Remix / React        │
│         (UI frontend)        │
└─────────────┬────────────────┘
              │ HTTP (API)
┌─────────────▼────────────────┐
│    Flask (REST backend)      │
│  + Gunicorn + Flask-Migrate  │
└───────┬─────────────┬────────┘
        │             │
   SQLite DB      FAISS index
 (queries, logs) (PDF embeddings)
```

## 🧑‍💻 Dev Guidelines

> All contributors must follow this simple Git workflow:

1. **Create a new branch**
    ```bash
    git checkout -b feature/your-description
    ```

2. **Make your changes and commit.**

3. **Push and open a Pull Request**
    ```bash
    git push origin feature/your-description
    ```

4. **Request review, make any updates, and merge once approved.**

## 🧪 Testing

- Backend: If tests exist, run them with `pytest`
- Frontend: Uses standard Remix/React test tooling


## ✅ Requirements

- Python 3.9-3.11
- Node.js + npm
- Linux/macOS or WSL (for running shell scripts)

## 📄 License

MIT License. See [LICENSE](LICENSE.md).

## 🙏 Acknowledgments

This project is inspired by the need for transparency and neutrality in presenting legal frameworks to the public, especially concerning the evolving Switzerland–EU relationship.
