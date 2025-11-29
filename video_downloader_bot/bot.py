import asyncio
import logging
import os
import glob
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import FSInputFile
import yt_dlp

# ВСТАВЬ СЮДА СВОЙ ТОКЕН ОТ @BotFather
API_TOKEN = "8440327310:AAHhKU4uUm_YfHJsPbum2v7gMw3ogIX5cs0"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота и диспетчера
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Настройки для yt-dlp
# Мы будем скачивать видео в папку downloads
DOWNLOAD_PATH = "downloads"

if not os.path.exists(DOWNLOAD_PATH):
    os.makedirs(DOWNLOAD_PATH)

def download_video(url):
    """
    Скачивает видео с помощью yt-dlp.
    Возвращает путь к скачанному файлу или None в случае ошибки.
    """
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  # Приоритет mp4
        'outtmpl': f'{DOWNLOAD_PATH}/%(id)s.%(ext)s', # Шаблон имени файла
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            return filename
    except Exception as e:
        logging.error(f"Error downloading {url}: {e}")
        return None

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer("Привет! Отправь мне ссылку на видео из TikTok, Instagram (Reels) или YouTube (Shorts/Video), и я попробую его скачать.")

@dp.message(F.text)
async def handle_message(message: types.Message):
    url = message.text.strip()
    
    # Простая проверка на ссылку
    if not url.startswith(("http://", "https://")):
        await message.answer("Это не похоже на ссылку. Пожалуйста, отправь корректный URL.")
        return

    status_msg = await message.answer("⏳ Начинаю скачивание... Подождите немного.")

    try:
        # Запускаем блокирующую функцию скачивания в отдельном потоке, чтобы не блокировать бота
        loop = asyncio.get_running_loop()
        file_path = await loop.run_in_executor(None, download_video, url)

        if file_path and os.path.exists(file_path):
            await status_msg.edit_text("📤 Загружаю видео в Telegram...")
            
            video_file = FSInputFile(file_path)
            await message.answer_video(video_file, caption="Вот ваше видео! 🎥")
            
            # Удаляем файл после отправки, чтобы не засорять диск
            try:
                os.remove(file_path)
            except Exception as e:
                logging.error(f"Could not remove file {file_path}: {e}")
                
            await status_msg.delete()
        else:
            await status_msg.edit_text("❌ Не удалось скачать видео. Возможно, ссылка некорректна или видео недоступно (например, приватный аккаунт).")

    except Exception as e:
        logging.error(f"Global error: {e}")
        await status_msg.edit_text("❌ Произошла ошибка при обработке вашего запроса.")

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    print("Бот запущен!")
    asyncio.run(main())

