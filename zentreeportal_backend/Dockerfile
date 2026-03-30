FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./

RUN apt-get update && \
    apt-get install -y \
      build-essential \
      gcc \
      g++ && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python3", "main.py"]