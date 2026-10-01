FROM python:3.9-slim

WORKDIR /app

RUN pip install --no-cache-dir numpy==1.24.4 \
 && pip install --no-cache-dir scikit-learn==1.3.0

COPY pek-0.1.7-py3-none-any.whl .
RUN pip install --no-cache-dir ./pek-0.1.7-py3-none-any.whl

COPY frontend ./frontend

CMD ["python", "-m", "pek.server", "-p", "9786"]