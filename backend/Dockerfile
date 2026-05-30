# Multi-stage production image (D-010): non-root user, prod deps only.
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN python -m pip install --upgrade pip

COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/sikapa/.local/bin:${PATH}"

RUN groupadd --system sikapa && useradd --system --gid sikapa --create-home sikapa

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

RUN chmod +x docker-entrypoint.sh

RUN chown -R sikapa:sikapa /app

USER sikapa

EXPOSE 8000

CMD ["./docker-entrypoint.sh"]
