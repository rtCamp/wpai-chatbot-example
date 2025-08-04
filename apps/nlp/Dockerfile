FROM python:3.10-slim

WORKDIR /usr/src/app

COPY requirements.txt .
FROM python:3.10-slim

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
  python -m pip install --no-cache-dir numpy==1.23.5 && \
  python -m spacy download en_core_web_sm

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:3100", "--workers", "4", "--threads", "2", "--timeout", "120", "app:app"]