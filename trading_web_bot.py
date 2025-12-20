import os
import time
import logging
import threading
from datetime import datetime, timedelta
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv
import ccxt
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import requests
from bs4 import BeautifulSoup
import feedparser
import re
import json
import numpy as np

# ==========================================
# Настройки и Состояние
# ==========================================

load_dotenv()

# Настройка страницы Streamlit
st.set_page_config(page_title="Bybit Trading Bot Panel", layout="wide")

# Файл для сохранения истории
DATA_FILE = 'trading_bot_data.json'

# ==========================================
# Функции сохранения/загрузки данных
# ==========================================

def save_bot_data(state):
    """Сохраняет состояние бота в файл."""
    try:
        # Подготавливаем данные для сохранения (конвертируем datetime в строки)
        data_to_save = {
            'balance': state['balance'],
            'position': state['position'],
            'price_history': [
                {
                    'time': item['time'].isoformat() if isinstance(item['time'], datetime) else item['time'],
                    'price': item['price']
                }
                for item in state['price_history']
            ],
            'balance_history': [
                {
                    'time': item['time'].isoformat() if isinstance(item['time'], datetime) else item['time'],
                    'balance': item['balance']
                }
                for item in state['balance_history']
            ],
            'trades': [
                {
                    'time': trade['time'].isoformat() if isinstance(trade['time'], datetime) else trade['time'],
                    'type': trade['type'],
                    'price': trade['price'],
                    'profit': trade['profit']
                }
                for trade in state['trades']
            ],
            'last_update': state['last_update'].isoformat() if isinstance(state['last_update'], datetime) else state['last_update']
        }
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Ошибка сохранения данных: {e}")

def load_bot_data():
    """Загружает состояние бота из файла."""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Конвертируем строки обратно в datetime
            return {
                'balance': data.get('balance', 1000.0),
                'position': data.get('position', None),
                'price_history': [
                    {
                        'time': datetime.fromisoformat(item['time']) if isinstance(item['time'], str) else item['time'],
                        'price': item['price']
                    }
                    for item in data.get('price_history', [])
                ],
                'balance_history': [
                    {
                        'time': datetime.fromisoformat(item['time']) if isinstance(item['time'], str) else item['time'],
                        'balance': item['balance']
                    }
                    for item in data.get('balance_history', [])
                ],
                'trades': [
                    {
                        'time': datetime.fromisoformat(trade['time']) if isinstance(trade['time'], str) else trade['time'],
                        'type': trade['type'],
                        'price': trade['price'],
                        'profit': trade['profit']
                    }
                    for trade in data.get('trades', [])
                ],
                'last_update': datetime.fromisoformat(data['last_update']) if isinstance(data.get('last_update'), str) else data.get('last_update', datetime.now())
            }
    except Exception as e:
        print(f"Ошибка загрузки данных: {e}")
    
    # Возвращаем начальные значения если файл не найден или ошибка
    return None

# Глобальный объект состояния для обмена данными между потоками
if 'bot_state' not in st.session_state:
    # Пытаемся загрузить сохраненные данные
    loaded_data = load_bot_data()
    
    if loaded_data:
        st.session_state.bot_state = {
            **loaded_data,
            'sentiment': 0.0,
            'sma': 0.0,
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'bb_upper': 0.0,
            'bb_lower': 0.0,
            'atr': 0.0,
            'adx': 0.0,
            'current_drawdown': 0.0,
            'max_drawdown': loaded_data.get('max_drawdown', 0.0),
            'trading_paused': loaded_data.get('trading_paused', False),
            'running': False,
            'logs': [],
            'latest_news': []
        }
    else:
        # Начальные значения если нет сохраненных данных
        st.session_state.bot_state = {
            'balance': 1000.0,
            'position': None,
            'price_history': [],
            'balance_history': [{'time': datetime.now(), 'balance': 1000.0}],
            'trades': [],
            'sentiment': 0.0,
            'sma': 0.0,
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'bb_upper': 0.0,
            'bb_lower': 0.0,
            'atr': 0.0,
            'adx': 0.0,
            'current_drawdown': 0.0,
            'max_drawdown': 0.0,
            'trading_paused': False,
            'last_update': datetime.now(),
            'running': False,
            'logs': [],
            'latest_news': []
        }

# ==========================================
# Логика бота (Background Thread)
# ==========================================

class TradingBot:
    def __init__(self, state):
        self.state = state
        self.symbol = 'BTC/USDT'
        self.risk = 0.1
        self.tp = 0.005
        self.sl = 0.003
        self.sentiment_threshold = 0.2
        self.sma_periods = 10
        
        # Кеш новостей (обновляем каждые 5 минут)
        self.news_cache = {
            'news': [],
            'sentiment': 0.0,
            'last_update': None
        }
        
        # Инициализация биржи
        self.exchange = ccxt.bybit({
            'apiKey': os.getenv('BYBIT_API_KEY'),
            'secret': os.getenv('BYBIT_SECRET_KEY'),
            'enableRateLimit': True,
        })
        self.analyzer = SentimentIntensityAnalyzer()

    def add_log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.state['logs'].insert(0, f"[{timestamp}] {message}")
        if len(self.state['logs']) > 50:
            self.state['logs'].pop()

    def fetch_news_from_rss(self, url, max_items=5):
        """Получает новости из RSS-ленты (быстро, с таймаутом)."""
        try:
            # Используем requests для быстрой загрузки с таймаутом
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=3)
            response.raise_for_status()
            feed = feedparser.parse(response.content)
            news_items = []
            for entry in feed.entries[:max_items]:
                title = entry.get('title', '')
                if title:
                    news_items.append(title)
                description = entry.get('description', '')
                if description and len(description) > 20:
                    # Быстрая очистка HTML
                    clean_desc = BeautifulSoup(description, 'html.parser').get_text()
                    if clean_desc:
                        news_items.append(clean_desc[:150])  # Короче для скорости
            return news_items
        except Exception:
            # Не логируем каждую ошибку RSS, чтобы не засорять логи
            return []

    def fetch_news_from_website(self, url, selector='h2, h3, .title, .headline'):
        """Парсит новости с веб-сайта (быстро, с коротким таймаутом)."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            # Уменьшенный таймаут для быстрой загрузки
            response = requests.get(url, headers=headers, timeout=2)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            news_items = []
            # Ищем заголовки новостей (ограничиваем количество для скорости)
            for tag in soup.select(selector)[:10]:  # Максимум 10 элементов
                text = tag.get_text(strip=True)
                if text and len(text) > 20 and len(text) < 200:
                    # Фильтруем только крипто-связанные заголовки
                    crypto_keywords = ['bitcoin', 'btc', 'crypto', 'ethereum', 'blockchain', 
                                     'trading', 'market', 'price', 'coin']
                    if any(keyword in text.lower() for keyword in crypto_keywords):
                        news_items.append(text)
                        if len(news_items) >= 3:  # Меньше новостей для скорости
                            break
            return news_items
        except Exception:
            # Не логируем ошибки парсинга, чтобы не засорять логи
            return []
    
    def is_market_relevant(self, news_text):
        """Проверяет, релевантна ли новость для рынка (исключает личные истории)."""
        text_lower = news_text.lower()
        
        # ИСКЛЮЧАЕМ: Личные истории, кражи у пользователей
        personal_story_keywords = [
            'user lost', 'user stolen', 'individual lost', 'person lost',
            'hacked wallet', 'stolen from user', 'scammed user',
            'lost their', 'his wallet', 'her wallet', 'my wallet',
            'personal loss', 'private key stolen', 'phishing victim',
            'victim lost', 'scammed out of', 'lost access to'
        ]
        
        # Если это личная история - исключаем
        if any(keyword in text_lower for keyword in personal_story_keywords):
            return False
        
        # ВКЛЮЧАЕМ: Макро-новости, влияющие на рынок
        market_keywords = [
            'bitcoin price', 'btc price', 'crypto market', 'market cap',
            'institutional', 'adoption', 'regulation', 'sec', 'government',
            'exchange', 'trading volume', 'bullish', 'bearish', 'trend',
            'upgrade', 'protocol', 'network', 'mining', 'halving',
            'etf', 'approval', 'ban', 'legal', 'partnership',
            'bank', 'payment', 'integration', 'launch', 'announcement',
            'whale', 'institution', 'corporate', 'company'
        ]
        
        # Должна содержать хотя бы одно ключевое слово о рынке
        return any(keyword in text_lower for keyword in market_keywords)
    
    def filter_news_by_relevance(self, news_list):
        """Фильтрует новости по релевантности для рынка."""
        filtered = []
        seen = set()  # Для удаления дубликатов
        
        for news in news_list:
            # Удаляем дубликаты (по первым 50 символам)
            news_hash = news[:50].lower().strip()
            if news_hash in seen:
                continue
            seen.add(news_hash)
            
            # Проверяем релевантность
            if self.is_market_relevant(news):
                filtered.append(news)
        
        return filtered

    def get_real_news(self):
        """Собирает реальные новости из разных источников с фильтрацией."""
        all_news = []
        
        # 1. RSS-ленты (расширенный список источников)
        rss_sources = [
            'https://cointelegraph.com/rss',
            'https://www.coindesk.com/arc/outboundfeeds/rss/',
            'https://bitcoinmagazine.com/.rss/full/',
            'https://www.theblock.co/rss.xml',
            'https://decrypt.co/feed',
            'https://cryptonews.com/news/feed/',
        ]
        
        for rss_url in rss_sources:
            news = self.fetch_news_from_rss(rss_url, max_items=4)
            all_news.extend(news)
            if len(all_news) >= 20:  # Берем больше для фильтрации
                break
        
        # 2. Парсинг веб-сайтов (резервный вариант)
        if len(all_news) < 10:
            web_sources = [
                ('https://www.coindesk.com/', 'h2 a, h3 a, .headline'),
                ('https://cointelegraph.com/', 'h2 a, .post-card-inline__title'),
                ('https://www.theblock.co/', 'h2 a, h3 a'),
            ]
            for url, selector in web_sources:
                news = self.fetch_news_from_website(url, selector)
                all_news.extend(news)
                if len(all_news) >= 20:
                    break
        
        # 3. Фильтруем по релевантности (убираем личные истории)
        filtered_news = self.filter_news_by_relevance(all_news)
        
        # 4. Fallback на заглушку если ничего не получилось
        if not filtered_news:
            self.add_log("⚠️ Не удалось получить релевантные новости, используем заглушку")
            filtered_news = [
                "Bitcoin adoption increases as major banks start offering crypto services.",
                "Bybit launches new features for paper trading to help beginners.",
                "Market analysts predict a bullish trend for BTC in the coming weeks.",
                "Ethereum upgrade successfully completed, reducing gas fees.",
                "Global economy shows signs of recovery, boosting investor confidence in crypto."
            ]
        else:
            self.add_log(f"📰 Отфильтровано: {len(all_news)} → {len(filtered_news)} релевантных новостей")
        
        return filtered_news[:10]  # Максимум 10 новостей

    def get_news_sentiment(self):
        """Анализирует настроение реальных новостей с кешированием."""
        try:
            now = datetime.now()
            # Обновляем новости каждые 5 минут (не блокируем основной цикл)
            if (self.news_cache['last_update'] is None or 
                (now - self.news_cache['last_update']).total_seconds() > 300):
                
                # Пытаемся получить новости, но не ждем долго
                try:
                    news = self.get_real_news()
                    if news:
                        scores = []
                        for article in news:
                            score = self.analyzer.polarity_scores(article)
                            scores.append(score['compound'])
                        
                        if scores:
                            avg_sentiment = sum(scores) / len(scores)
                            self.news_cache = {
                                'news': news,
                                'sentiment': avg_sentiment,
                                'last_update': now
                            }
                            # Сохраняем новости в state для отображения
                            self.state['latest_news'] = news[:5]  # Последние 5 новостей
                            self.add_log(f"📰 Обновлено: {len(news)} новостей, sentiment: {avg_sentiment:.2f}")
                            return avg_sentiment
                except Exception as e:
                    # Если новости не загрузились - используем кеш или нейтральное значение
                    self.add_log(f"⚠️ Новости не загружены, используем кеш")
            
            # Возвращаем кешированное значение (быстро, не блокирует)
            return self.news_cache.get('sentiment', 0.0)
            
        except Exception as e:
            # В случае любой ошибки возвращаем нейтральное значение
            return self.news_cache.get('sentiment', 0.0)
    
    def calculate_rsi(self, prices, period=14):
        """Вычисляет RSI (Relative Strength Index)."""
        if len(prices) < period + 1:
            return None
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_macd(self, prices, fast=12, slow=26, signal=9):
        """Вычисляет MACD."""
        if len(prices) < slow:
            return None, None, None
        
        prices_array = np.array(prices)
        ema_fast = pd.Series(prices_array).ewm(span=fast).mean().iloc[-1]
        ema_slow = pd.Series(prices_array).ewm(span=slow).mean().iloc[-1]
        macd_line = ema_fast - ema_slow
        
        # Signal line (EMA от MACD)
        if len(prices) >= slow + signal:
            macd_series = pd.Series(prices_array).ewm(span=fast).mean() - pd.Series(prices_array).ewm(span=slow).mean()
            signal_line = macd_series.ewm(span=signal).mean().iloc[-1]
        else:
            signal_line = None
        
        return macd_line, signal_line, macd_line - signal_line if signal_line else None
    
    def calculate_bollinger_bands(self, prices, period=20, std_dev=2):
        """Вычисляет Bollinger Bands."""
        if len(prices) < period:
            return None, None, None
        
        prices_array = np.array(prices[-period:])
        sma = np.mean(prices_array)
        std = np.std(prices_array)
        
        upper_band = sma + (std_dev * std)
        lower_band = sma - (std_dev * std)
        
        return upper_band, sma, lower_band
    
    def calculate_atr(self, prices, period=14):
        """Вычисляет ATR (Average True Range) для оценки волатильности."""
        if len(prices) < period + 1:
            return None
        
        true_ranges = []
        for i in range(1, len(prices)):
            tr = abs(prices[i] - prices[i-1])
            true_ranges.append(tr)
        
        if len(true_ranges) < period:
            return None
        
        atr = np.mean(true_ranges[-period:])
        return atr
    
    def calculate_adx(self, prices, period=14):
        """Вычисляет ADX (Average Directional Index) - сила тренда."""
        if len(prices) < period * 2:
            return None
        
        # Упрощенный ADX (без +DI и -DI)
        price_changes = np.diff(prices[-period*2:])
        positive_changes = price_changes[price_changes > 0]
        negative_changes = abs(price_changes[price_changes < 0])
        
        if len(positive_changes) == 0 and len(negative_changes) == 0:
            return 0
        
        avg_plus = np.mean(positive_changes) if len(positive_changes) > 0 else 0
        avg_minus = np.mean(negative_changes) if len(negative_changes) > 0 else 0
        
        if avg_plus + avg_minus == 0:
            return 0
        
        dx = 100 * abs(avg_plus - avg_minus) / (avg_plus + avg_minus)
        return min(dx, 100)  # Ограничиваем до 100
    
    def is_trading_hours(self):
        """Проверяет, можно ли торговать в текущее время (избегаем низколиквидные часы)."""
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()  # 0 = понедельник, 6 = воскресенье
        
        # Не торгуем в выходные
        if weekday >= 5:  # Суббота или воскресенье
            return False
        
        # Торгуем только в активные часы (UTC+3 для Москвы)
        # Азиатская сессия: 2-10 UTC (5-13 МСК)
        # Европейская сессия: 8-16 UTC (11-19 МСК)
        # Американская сессия: 13-21 UTC (16-00 МСК)
        # Объединяем: 5-23 МСК (активные часы)
        if 5 <= hour < 23:
            return True
        
        return False
    
    def calculate_drawdown(self):
        """Вычисляет текущую просадку от максимального баланса."""
        if not self.state.get('balance_history'):
            return 0.0
        
        balances = [x['balance'] for x in self.state['balance_history']]
        if not balances:
            return 0.0
        
        peak = max(balances)
        current = self.state['balance']
        drawdown = ((peak - current) / peak) * 100 if peak > 0 else 0.0
        
        # Сохраняем максимальную просадку
        max_drawdown = self.state.get('max_drawdown', 0.0)
        if drawdown > max_drawdown:
            self.state['max_drawdown'] = drawdown
        
        return drawdown
    
    def update_trailing_stop(self, entry_price, current_price, trailing_percent=0.003):
        """Обновляет трейлинг-стоп (следует за ценой вверх)."""
        if 'trailing_stop' not in self.state['position']:
            # Инициализируем трейлинг-стоп на уровне SL
            self.state['position']['trailing_stop'] = entry_price * (1 - self.sl)
        
        trailing_stop = self.state['position']['trailing_stop']
        
        # Если цена выросла, поднимаем трейлинг-стоп
        if current_price > entry_price:
            new_trailing = current_price * (1 - trailing_percent)
            if new_trailing > trailing_stop:
                trailing_stop = new_trailing
                self.state['position']['trailing_stop'] = trailing_stop
        
        return trailing_stop
    
    def partial_close(self, position, close_percent=0.5):
        """Частично закрывает позицию (закрывает часть, оставляет остальное с трейлингом)."""
        entry = position['entry_price']
        amount = position['amount']
        current_price = self.state['price_history'][-1]['price'] if self.state['price_history'] else entry
        
        # Закрываем часть позиции
        close_amount = amount * close_percent
        remaining_amount = amount * (1 - close_percent)
        
        profit = close_amount * (current_price - entry)
        self.state['balance'] += close_amount * current_price
        
        # Обновляем позицию
        self.state['position']['amount'] = remaining_amount
        self.state['position']['partial_closed'] = True
        
        self.state['trades'].append({
            'time': datetime.now(),
            'type': 'SELL (Partial)',
            'price': current_price,
            'profit': profit
        })
        
        self.add_log(f"📊 Частичное закрытие: {close_percent*100:.0f}% по {current_price}. Профит: +{profit:.2f}")
        save_bot_data(self.state)
        
        return remaining_amount

    def run_cycle(self):
        try:
            # 1. Получаем цену (ПРИОРИТЕТ - быстро!)
            try:
                ticker = self.exchange.fetch_ticker(self.symbol)
                current_price = ticker['last']
            except Exception as e:
                self.add_log(f"⚠️ Ошибка получения цены: {str(e)[:50]}")
                # Используем последнюю известную цену
                if self.state['price_history']:
                    current_price = self.state['price_history'][-1]['price']
                else:
                    current_price = 0
                    return  # Выходим если нет данных
            
            # 2. Обновляем историю
            self.state['price_history'].append({'time': datetime.now(), 'price': current_price})
            if len(self.state['price_history']) > 200:  # Увеличили для индикаторов
                self.state['price_history'].pop(0)
            
            # 3. Анализ новостей
            sentiment = self.get_news_sentiment()
            self.state['sentiment'] = sentiment
            
            # 4. Проверка времени торговли
            if not self.is_trading_hours():
                # Не торгуем вне активных часов
                if self.state.get('last_trading_hours_warning') != datetime.now().strftime('%Y-%m-%d %H'):
                    self.add_log("⏰ Вне активных торговых часов, ожидание...")
                    self.state['last_trading_hours_warning'] = datetime.now().strftime('%Y-%m-%d %H')
                # Но продолжаем обновлять индикаторы и проверять выходы из позиций
            
            # 5. Вычисляем технические индикаторы
            prices = [x['price'] for x in self.state['price_history']]
            sma = sum(prices[-self.sma_periods:]) / len(prices[-self.sma_periods:]) if len(prices) >= self.sma_periods else 0
            self.state['sma'] = sma
            
            # RSI
            rsi = self.calculate_rsi(prices)
            self.state['rsi'] = rsi if rsi else 50  # Нейтральное значение
            
            # MACD
            macd, signal, histogram = self.calculate_macd(prices)
            self.state['macd'] = macd if macd else 0
            self.state['macd_signal'] = signal if signal else 0
            self.state['macd_histogram'] = histogram if histogram else 0
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = self.calculate_bollinger_bands(prices)
            self.state['bb_upper'] = bb_upper if bb_upper else current_price
            self.state['bb_lower'] = bb_lower if bb_lower else current_price
            
            # ATR (для динамического управления рисками)
            atr = self.calculate_atr(prices)
            self.state['atr'] = atr if atr else 0
            
            # ADX (сила тренда)
            adx = self.calculate_adx(prices)
            self.state['adx'] = adx if adx else 0
            
            # Просадка
            drawdown = self.calculate_drawdown()
            self.state['current_drawdown'] = drawdown
            
            # 6. Защита от просадки - останавливаем торговлю при большой просадке
            max_allowed_drawdown = 20.0  # 20% максимальная просадка
            if drawdown > max_allowed_drawdown and self.state.get('trading_paused') != True:
                self.state['trading_paused'] = True
                self.add_log(f"🛑 ТОРГОВЛЯ ПРИОСТАНОВЛЕНА! Просадка {drawdown:.2f}% превысила лимит {max_allowed_drawdown}%")
                save_bot_data(self.state)
            
            # 7. Улучшенная торговая логика с трейлинг-стопом и частичным закрытием
            if self.state['position']:
                entry = self.state['position']['entry_price']
                amount = self.state['position']['amount']
                partial_closed = self.state['position'].get('partial_closed', False)
                
                # Обновляем трейлинг-стоп
                trailing_stop = self.update_trailing_stop(entry, current_price)
                
                # Частичное закрытие при достижении первого TP (50% позиции)
                if not partial_closed and current_price >= entry * (1 + self.tp):
                    remaining = self.partial_close(self.state['position'], 0.5)
                    amount = remaining  # Обновляем amount для дальнейших проверок
                
                # Полное закрытие по трейлинг-стопу
                if current_price <= trailing_stop:
                    profit = amount * (current_price - entry)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (Trailing Stop)', 
                        'price': current_price, 'profit': profit
                    })
                    self.add_log(f"📉 Trailing Stop! Продано по {current_price}. Профит: +{profit:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
                
                # Полное закрытие по второму TP (если частично закрыли)
                elif partial_closed and current_price >= entry * (1 + self.tp * 1.5):
                    profit = amount * (current_price - entry)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (TP Full)', 
                        'price': current_price, 'profit': profit
                    })
                    self.add_log(f"✅ TP Full! Продано по {current_price}. Профит: +{profit:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
                
                # Stop Loss (только если не сработал трейлинг-стоп)
                elif current_price <= entry * (1 - self.sl):
                    loss = amount * (entry - current_price)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (SL)', 
                        'price': current_price, 'profit': -loss
                    })
                    self.add_log(f"❌ SL! Продано по {current_price}. Убыток: -{loss:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
            else:
                # Проверяем, не приостановлена ли торговля
                if self.state.get('trading_paused', False):
                    return  # Не открываем новые позиции при приостановке
                
                # УЛУЧШЕННЫЕ УСЛОВИЯ ВХОДА с ADX фильтром
                conditions_met = []
                
                # Базовое условие: SMA
                if len(prices) >= self.sma_periods:
                    conditions_met.append(current_price < sma)  # Цена ниже средней
                
                # Условие: Sentiment
                conditions_met.append(sentiment > self.sentiment_threshold)
                
                # Условие: RSI (не перекуплен)
                if rsi:
                    conditions_met.append(rsi < 70)  # Не перекуплен
                
                # Условие: MACD (бычий сигнал)
                if macd and signal:
                    conditions_met.append(macd > signal)  # MACD выше сигнальной линии
                
                # Условие: Bollinger Bands (цена близко к нижней полосе)
                if bb_lower:
                    conditions_met.append(current_price <= bb_middle)  # Цена ниже средней полосы
                
                # Условие: ADX (сила тренда) - дополнительный фильтр
                if adx:
                    conditions_met.append(adx > 20)  # Есть тренд (ADX > 20)
                
                # Вход если выполнено минимум 3 из 6 условий И в активные часы
                if sum(conditions_met) >= 3 and self.is_trading_hours():
                    # Динамическое управление рисками на основе ATR
                    base_risk = self.risk
                    if atr and current_price > 0:
                        # Адаптируем риск к волатильности (больше волатильность = меньше риск)
                        volatility_factor = min(atr / current_price, 0.05) / 0.01  # Нормализуем
                        adjusted_risk = base_risk * (1 - volatility_factor * 0.3)  # Уменьшаем риск на 30% при высокой волатильности
                        investment = self.state['balance'] * adjusted_risk
                    else:
                        investment = self.state['balance'] * base_risk
                    
                    amount = investment / current_price
                    self.state['balance'] -= investment
                    self.state['position'] = {
                        'entry_price': current_price, 
                        'amount': amount,
                        'partial_closed': False,
                        'trailing_stop': current_price * (1 - self.sl)
                    }
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'BUY', 
                        'price': current_price, 'profit': 0
                    })
                    self.add_log(f"🚀 ВХОД! Куплено по {current_price} (RSI:{rsi:.1f}, MACD:{macd:.2f}, ADX:{adx:.1f})")
                    # Сохраняем данные после покупки
                    save_bot_data(self.state)

            self.state['balance_history'].append({'time': datetime.now(), 'balance': self.state['balance']})
            self.state['last_update'] = datetime.now()
            
            # Периодическое сохранение (каждые 30 секунд или при изменении баланса)
            if len(self.state['balance_history']) % 30 == 0:
                save_bot_data(self.state)
            
        except Exception as e:
            self.add_log(f"Ошибка: {str(e)}")

def calculate_statistics(trades, balance_history, initial_balance=1000.0):
    """Вычисляет расширенную статистику торговли."""
    if not trades:
        return {
            'total_trades': 0,
            'win_rate': 0,
            'avg_profit': 0,
            'avg_loss': 0,
            'total_profit': 0,
            'profit_factor': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'max_drawdown': 0,
            'recovery_factor': 0
        }
    
    df = pd.DataFrame(trades)
    winning_trades = df[df['profit'] > 0]
    losing_trades = df[df['profit'] < 0]
    
    total_trades = len(df)
    win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
    avg_profit = winning_trades['profit'].mean() if len(winning_trades) > 0 else 0
    avg_loss = abs(losing_trades['profit'].mean()) if len(losing_trades) > 0 else 0
    total_profit = df['profit'].sum()
    profit_factor = avg_profit / avg_loss if avg_loss > 0 else 0
    
    # Sharpe Ratio (риск-скорректированная доходность)
    if len(balance_history) > 1:
        returns = []
        for i in range(1, len(balance_history)):
            prev_bal = balance_history[i-1]['balance']
            curr_bal = balance_history[i]['balance']
            if prev_bal > 0:
                ret = (curr_bal - prev_bal) / prev_bal
                returns.append(ret)
        
        if returns:
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            sharpe_ratio = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0  # Годовая нормализация
            
            # Sortino Ratio (только отрицательная волатильность)
            negative_returns = [r for r in returns if r < 0]
            downside_std = np.std(negative_returns) if negative_returns else 0
            sortino_ratio = (mean_return / downside_std * np.sqrt(252)) if downside_std > 0 else 0
        else:
            sharpe_ratio = 0
            sortino_ratio = 0
    else:
        sharpe_ratio = 0
        sortino_ratio = 0
    
    # Max Drawdown
    if balance_history:
        balances = [x['balance'] for x in balance_history]
        peak = balances[0]
        max_dd = 0
        for bal in balances:
            if bal > peak:
                peak = bal
            dd = ((peak - bal) / peak) * 100 if peak > 0 else 0
            if dd > max_dd:
                max_dd = dd
    else:
        max_dd = 0
    
    # Recovery Factor (прибыль / максимальная просадка)
    recovery_factor = total_profit / max_dd if max_dd > 0 else 0
    
    return {
        'total_trades': total_trades,
        'win_rate': win_rate,
        'avg_profit': avg_profit,
        'avg_loss': avg_loss,
        'total_profit': total_profit,
        'profit_factor': profit_factor,
        'sharpe_ratio': sharpe_ratio,
        'sortino_ratio': sortino_ratio,
        'max_drawdown': max_dd,
        'recovery_factor': recovery_factor
    }

# ==========================================
# Интерфейс (Streamlit UI)
# ==========================================

st.title("📈 Bybit AI Trading Dashboard")

# Сайдбар с настройками
with st.sidebar:
    st.header("Конфигурация")
    api_key = st.text_input("API Key", value=os.getenv('BYBIT_API_KEY') or "", type="password")
    secret_key = st.text_input("Secret Key", value=os.getenv('BYBIT_SECRET_KEY') or "", type="password")
    
    st.divider()
    risk = st.slider("Риск на сделку (%)", 1, 50, 10)
    tp = st.slider("Take Profit (%)", 0.1, 5.0, 0.5)
    sl = st.slider("Stop Loss (%)", 0.1, 5.0, 0.3)
    
    if st.button("Запустить бота", use_container_width=True, type="primary"):
        st.session_state.bot_state['running'] = True
        st.toast("Бот запущен!")
        
    if st.button("Остановить", use_container_width=True):
        st.session_state.bot_state['running'] = False
        st.toast("Бот остановлен")
    
    # Кнопка возобновления торговли
    if st.session_state.bot_state.get('trading_paused', False):
        if st.button("▶️ Возобновить торговлю", use_container_width=True, type="primary"):
            st.session_state.bot_state['trading_paused'] = False
            st.toast("✅ Торговля возобновлена!")
    
    st.divider()
    if st.button("💾 Сохранить данные", use_container_width=True):
        save_bot_data(st.session_state.bot_state)
        st.toast("✅ Данные сохранены!")
    
    # Показываем информацию о сохранении
    if os.path.exists(DATA_FILE):
        file_time = datetime.fromtimestamp(os.path.getmtime(DATA_FILE))
        st.caption(f"Последнее сохранение: {file_time.strftime('%H:%M:%S')}")

# Основная панель
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Баланс USDT", f"{st.session_state.bot_state['balance']:.2f}")
with col2:
    price = st.session_state.bot_state['price_history'][-1]['price'] if st.session_state.bot_state['price_history'] else 0
    st.metric("Цена BTC", f"{price:.2f}")
with col3:
    st.metric("Sentiment", f"{st.session_state.bot_state['sentiment']:.22f}")
with col4:
    status = "В ПОЗИЦИИ" if st.session_state.bot_state['position'] else "ОЖИДАНИЕ"
    st.metric("Статус", status)

# Метрики индикаторов
col5, col6, col7 = st.columns(3)
with col5:
    rsi_val = st.session_state.bot_state.get('rsi', 50)
    rsi_color = "🟢" if rsi_val < 30 else "🔴" if rsi_val > 70 else "🟡"
    st.metric("RSI", f"{rsi_val:.1f}", delta=None)
    st.caption(rsi_color + (" Перепродан" if rsi_val < 30 else " Перекуплен" if rsi_val > 70 else " Нейтрально"))

with col6:
    macd_val = st.session_state.bot_state.get('macd', 0)
    st.metric("MACD", f"{macd_val:.2f}")

with col7:
    bb_lower = st.session_state.bot_state.get('bb_lower', 0)
    bb_upper = st.session_state.bot_state.get('bb_upper', 0)
    if bb_lower and bb_upper:
        price = st.session_state.bot_state['price_history'][-1]['price'] if st.session_state.bot_state['price_history'] else 0
        bb_position = ((price - bb_lower) / (bb_upper - bb_lower) * 100) if (bb_upper - bb_lower) > 0 else 50
        st.metric("BB Position", f"{bb_position:.1f}%")

# Дополнительные индикаторы
col8, col9, col10 = st.columns(3)
with col8:
    atr_val = st.session_state.bot_state.get('atr', 0)
    st.metric("ATR (Волатильность)", f"{atr_val:.2f}")

with col9:
    adx_val = st.session_state.bot_state.get('adx', 0)
    adx_color = "🟢" if adx_val > 25 else "🟡" if adx_val > 20 else "🔴"
    st.metric("ADX (Сила тренда)", f"{adx_val:.1f}", delta=None)
    st.caption(adx_color + (" Сильный тренд" if adx_val > 25 else " Слабый тренд" if adx_val > 20 else " Нет тренда"))

with col10:
    dd_val = st.session_state.bot_state.get('current_drawdown', 0.0)
    dd_color = "🔴" if dd_val > 15 else "🟡" if dd_val > 5 else "🟢"
    st.metric("Просадка", f"{dd_val:.2f}%", delta=None)
    st.caption(dd_color + (" Критично" if dd_val > 15 else " Внимание" if dd_val > 5 else " Норма"))

# Графики
tab1, tab2, tab3 = st.tabs(["График цены", "История баланса", "Новости"])

with tab1:
    if st.session_state.bot_state['price_history']:
        df_price = pd.DataFrame(st.session_state.bot_state['price_history'])
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df_price['time'], y=df_price['price'], name="BTC/USDT"))
        fig.update_layout(height=400, margin=dict(l=0, r=0, t=0, b=0))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Ожидание данных о цене...")

with tab2:
    if st.session_state.bot_state['balance_history']:
        df_bal = pd.DataFrame(st.session_state.bot_state['balance_history'])
        fig_bal = go.Figure()
        fig_bal.add_trace(go.Scatter(x=df_bal['time'], y=df_bal['balance'], fill='tozeroy', name="Equity"))
        fig_bal.update_layout(height=400, margin=dict(l=0, r=0, t=0, b=0))
        st.plotly_chart(fig_bal, use_container_width=True)

with tab3:
    st.subheader("📰 Последние новости (обновляются каждые 5 минут)")
    if st.session_state.bot_state['latest_news']:
        ui_analyzer = SentimentIntensityAnalyzer()
        for i, news_item in enumerate(st.session_state.bot_state['latest_news'], 1):
            # Анализируем каждую новость для цветовой индикации
            score = ui_analyzer.polarity_scores(news_item)['compound']
            color = "🟢" if score > 0.1 else "🔴" if score < -0.1 else "🟡"
            st.markdown(f"{color} **Новость {i}:** {news_item[:150]}...")
            st.caption(f"Sentiment: {score:.2f}")
            st.divider()
    else:
        st.info("Новости загружаются...")

# Статистика торговли
if st.session_state.bot_state.get('trades'):
    stats = calculate_statistics(
        st.session_state.bot_state['trades'],
        st.session_state.bot_state.get('balance_history', []),
        1000.0
    )
    st.subheader("📊 Статистика торговли")
    
    # Основные метрики
    stat_cols1 = st.columns(5)
    with stat_cols1[0]:
        st.metric("Всего сделок", stats['total_trades'])
    with stat_cols1[1]:
        st.metric("Win Rate", f"{stats['win_rate']:.1f}%")
    with stat_cols1[2]:
        st.metric("Средний профит", f"{stats['avg_profit']:.2f}")
    with stat_cols1[3]:
        st.metric("Средний убыток", f"{stats['avg_loss']:.2f}")
    with stat_cols1[4]:
        st.metric("Общий профит", f"{stats['total_profit']:.2f}")
    
    # Продвинутые метрики
    st.subheader("📈 Продвинутая аналитика")
    stat_cols2 = st.columns(5)
    with stat_cols2[0]:
        sharpe_color = "🟢" if stats['sharpe_ratio'] > 1 else "🟡" if stats['sharpe_ratio'] > 0 else "🔴"
        st.metric("Sharpe Ratio", f"{stats['sharpe_ratio']:.2f}", delta=None)
        st.caption(sharpe_color + (" Отлично" if stats['sharpe_ratio'] > 1 else " Нормально" if stats['sharpe_ratio'] > 0 else " Плохо"))
    with stat_cols2[1]:
        st.metric("Sortino Ratio", f"{stats['sortino_ratio']:.2f}")
    with stat_cols2[2]:
        dd_color = "🔴" if stats['max_drawdown'] > 15 else "🟡" if stats['max_drawdown'] > 5 else "🟢"
        st.metric("Max Drawdown", f"{stats['max_drawdown']:.2f}%", delta=None)
        st.caption(dd_color + (" Критично" if stats['max_drawdown'] > 15 else " Внимание" if stats['max_drawdown'] > 5 else " Норма"))
    with stat_cols2[3]:
        st.metric("Profit Factor", f"{stats['profit_factor']:.2f}")
    with stat_cols2[4]:
        st.metric("Recovery Factor", f"{stats['recovery_factor']:.2f}")
    
    # Текущая просадка
    current_dd = st.session_state.bot_state.get('current_drawdown', 0.0)
    if current_dd > 0:
        st.warning(f"⚠️ Текущая просадка: {current_dd:.2f}%")
    
    # Статус торговли
    if st.session_state.bot_state.get('trading_paused', False):
        st.error("🛑 ТОРГОВЛЯ ПРИОСТАНОВЛЕНА из-за превышения лимита просадки!")

# Логи и Сделки
c1, c2 = st.columns([1, 1])
with c1:
    st.subheader("Последние сделки")
    if st.session_state.bot_state['trades']:
        st.table(pd.DataFrame(st.session_state.bot_state['trades']).tail(5))
    else:
        st.write("Сделок пока нет")

with c2:
    st.subheader("Лог событий")
    st.code("\n".join(st.session_state.bot_state['logs'][:10]), language="text")

# Показываем информацию о загруженных данных
if st.session_state.bot_state.get('trades'):
    st.sidebar.success(f"📊 Загружено: {len(st.session_state.bot_state['trades'])} сделок")

# Фоновый цикл (запускается только один раз)
if st.session_state.bot_state['running']:
    bot = TradingBot(st.session_state.bot_state)
    
    # Быстрая инициализация: получаем цену сразу при первом запуске
    if not st.session_state.bot_state['price_history']:
        try:
            ticker = bot.exchange.fetch_ticker(bot.symbol)
            initial_price = ticker['last']
            st.session_state.bot_state['price_history'].append({
                'time': datetime.now(), 
                'price': initial_price
            })
            bot.add_log(f"✅ Подключено! Начальная цена: {initial_price:.2f}")
            # Сохраняем при первом запуске
            save_bot_data(st.session_state.bot_state)
        except Exception as e:
            bot.add_log(f"⚠️ Ошибка подключения: {str(e)[:50]}")
    
    bot.run_cycle()
    time.sleep(1) # Небольшая пауза
    st.rerun()
