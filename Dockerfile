FROM python:3.9-slim

WORKDIR /app

# Install only runtime deps to keep image small
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir "fastapi>=0.95.0" "uvicorn[standard]>=0.22.0"

COPY . /app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
