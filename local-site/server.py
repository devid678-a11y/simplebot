#!/usr/bin/env python3
"""
Простой HTTP сервер для локального тестирования сайта с AmoCRM интеграцией
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from urllib.parse import urlparse, parse_qs
import json

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        """Обработка POST запросов для AmoCRM интеграции"""
        if self.path == '/amocrm-callback':
            self.handle_amocrm_callback()
        elif self.path == '/test-form':
            self.handle_test_form()
        else:
            self.send_error(404)

    def handle_amocrm_callback(self):
        """Обработка callback от AmoCRM OAuth"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Парсим данные
        data = parse_qs(post_data.decode('utf-8'))
        code = data.get('code', [None])[0]
        state = data.get('state', [None])[0]
        
        print(f"AmoCRM Callback received:")
        print(f"Code: {code}")
        print(f"State: {state}")
        
        # Отправляем ответ
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        response = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>AmoCRM Authorization</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1 class="success">✅ Авторизация в AmoCRM успешна!</h1>
            <p>Теперь вы можете закрыть это окно и вернуться к сайту.</p>
            <script>
                // Закрываем окно через 3 секунды
                setTimeout(() => {
                    window.close();
                }, 3000);
            </script>
        </body>
        </html>
        """
        
        self.wfile.write(response.encode())

    def handle_test_form(self):
        """Тестовая обработка формы"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            print(f"Test form data received: {data}")
            
            # Симуляция обработки
            response_data = {
                "success": True,
                "message": "Данные получены успешно!",
                "data": data
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_error(500, f"Error processing form: {str(e)}")

def start_server(port=8000):
    """Запуск локального сервера"""
    try:
        with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
            print(f"Локальный сервер запущен на http://localhost:{port}")
            print(f"Рабочая директория: {os.getcwd()}")
            print(f"Откройте браузер: http://localhost:{port}")
            print("=" * 50)
            print("Доступные эндпоинты:")
            print(f"   • Главная страница: http://localhost:{port}")
            print(f"   • AmoCRM callback: http://localhost:{port}/amocrm-callback")
            print(f"   • Тест формы: http://localhost:{port}/test-form")
            print("=" * 50)
            print("Для остановки нажмите Ctrl+C")
            print()
            
            # Автоматически открываем браузер
            webbrowser.open(f'http://localhost:{port}')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nСервер остановлен")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"Порт {port} уже используется. Попробуйте другой порт.")
            print(f"Запустите: python server.py {port + 1}")
        else:
            print(f"Ошибка запуска сервера: {e}")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Неверный номер порта. Используется порт 8000.")
    
    start_server(port)
