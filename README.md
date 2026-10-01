# vispek

> VISPEK: a Visual Interactive System for Progressive Ensemble K-Means Clustering.<br>
> M. Angelini, G. Blasilli, G. Cazzetta, S. Lenti, A. Palleschi, G. Santucci<br>
> AVI - _18th International Conference on Advanced Visual Interfaces_, 2026
> https://doi.org/10.1145/3811427.3811436

```
@inproceedings{10.1145/3811427.3811436,
  author = {Angelini, Marco and Blasilli, Graziano and Cazzetta, Giorgio and Lenti, Simone and Palleschi, Alessia and Santucci, Giuseppe},
  title = {VISPEK: a Visual Interactive System for Progressive Ensemble K-Means Clustering},
  year = {2026},
  isbn = {9798400723421},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  doi = {10.1145/3811427.3811436},
  booktitle = {Proceedings of the 2026 International Conference on Advanced Visual Interfaces},
  articleno = {28},
  numpages = {9},
  series = {AVI '26}
}
```

---


This project has a backend (`pek` server) and a frontend (static web app). You can run both in Docker, so you don't need to install Python, numpy, scikit-learn, or `pek` locally, or run them directly on your machine.

## Index

- [Prerequisites](#prerequisites)
- [Project layout](#project-layout)
- [Option 1: Run with Docker](#option-1-run-with-docker)
  - [Open the website](#open-the-website)
  - [Stop](#stop)
  - [Run in the background](#run-in-the-background)
- [Option 2: Run without Docker](#option-2-run-without-docker)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose (included in Docker Desktop)

## Project layout

```
.
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── pek-0.1.7-py3-none-any.whl   # local pek build (the PyPI version is not compatible)
└── frontend/                    # static web app (index.html, config.js, ...)
```

## Option 1: Run with Docker

From the project root, build and start both services:

```bash
docker compose up --build
```

The first build takes a minute or two. Wait until the backend log shows:

```
Running on all addresses (0.0.0.0)
```

## Open the website

Go to:

**http://localhost:8000**

The backend API listens on port 9786 (`http://localhost:9786`). It has no page of its own, so opening it in a browser returns a 404. That is expected.

## Stop

Press `Ctrl+C` in the terminal where it is running, then clean up the containers:

```bash
docker compose down
```

## Run in the background

```bash
docker compose up --build -d
docker compose logs -f        # follow logs
docker compose down           # stop and remove containers
```

## Option 2: Run without Docker

### Backend

Use **Python 3.9**. Create and activate a virtual environment (recommended):

```bash
python3.9 -m venv .venv
source .venv/bin/activate
```

Install numpy first, then scikit-learn, using these exact versions and in this order:

```bash
pip install numpy==1.24.4
pip install scikit-learn==1.3.0
```

Then install `pek` from the local wheel file:

```bash
pip install ./pek-0.1.7-py3-none-any.whl
```

The version of `pek` on PyPI is not compatible with this client, so you must install the local file.

Start the server on the port the frontend expects (see `frontend/config.js`):

```bash
python -m pek.server -p 9786
```

The `-p PORT` option is optional. If you omit it, the server uses its default port, which must then match `serverAddress` in `frontend/config.js`.

### Frontend

In a second terminal, from the project root, start the client:

```bash
python client.py
```

It serves the `frontend/` folder at http://localhost:8000 and opens it in your browser automatically.

## Configuration

| Service  | Port | Description                              |
|----------|------|------------------------------------------|
| frontend | 8000 | Static web app served from `frontend/`   |
| backend  | 9786 | `pek` server (Flask-SocketIO)            |

The frontend reads the backend address from `frontend/config.js` (`serverAddress: 'http://localhost:9786'`). If you change the backend port, update it in three places: `docker-compose.yml` (the `command` and `ports`), the `CMD` in the `Dockerfile`, and `serverAddress` in `config.js`.

To use a different frontend port, change the left side of the mapping in `docker-compose.yml`, for example `"8080:8000"`, and open http://localhost:8080.

## Troubleshooting

- **404 when opening http://localhost:9786.** Use http://localhost:8000 instead. Port 9786 is the API.
- **Port already in use.** Another program is using port 8000 or 9786. Stop it or change the port mapping as described above.
- **Backend exits with "The Werkzeug web server is not designed to run in production".** Make sure the `backend` service in `docker-compose.yml` has `tty: true` and `stdin_open: true`.
- **Page loads but nothing works.** Open the browser console and check that requests to `localhost:9786` succeed. Check the container status with `docker compose ps`.
- **After changing code or the frontend files.** Rebuild with `docker compose up --build`.


