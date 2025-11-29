FROM python:3.10-slim

# Установка системных зависимостей (ffmpeg нужен для yt-dlp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копируем файлы зависимостей
COPY requirements.txt .

# Установка Python-зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бота
COPY bot.py .

# Запуск бота
CMD ["python", "bot.py"]

