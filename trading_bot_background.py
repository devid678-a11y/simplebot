"""
Фоновая версия торгового бота (без UI)
Работает постоянно, даже если компьютер в спящем режиме
(при условии отключения спящего режима или использования VPS)
"""

import os
import time
import json
from datetime import datetime
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import ccxt
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import requests
from bs4 import BeautifulSoup
import feedparser

load_dotenv()

# Файл для сохранения истории
# Адаптация для работы в облаке (Railway, Render, etc.)
if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER') or os.getenv('PYTHONANYWHERE_SITE'):
    # В облаке используем рабочую директорию
    DATA_FILE = os.path.join(os.getcwd(), 'trading_bot_data.json')
else:
    # Локально
    DATA_FILE = 'trading_bot_data.json'

def save_bot_data(state):
    """Сохраняет состояние бота в файл."""
    try:
        data_to_save = {
            'balance': state['balance'],
            'position': state.get('position'),
            'price_history': [
                {
                    'time': item['time'].isoformat() if isinstance(item['time'], datetime) else item['time'],
                    'price': item['price']
                }
                for item in state.get('price_history', [])
            ],
            'balance_history': [
                {
                    'time': item['time'].isoformat() if isinstance(item['time'], datetime) else item['time'],
                    'balance': item['balance']
                }
                for item in state.get('balance_history', [])
            ],
            'trades': [
                {
                    'time': trade['time'].isoformat() if isinstance(trade['time'], datetime) else trade['time'],
                    'type': trade['type'],
                    'price': trade['price'],
                    'profit': trade['profit']
                }
                for trade in state.get('trades', [])
            ],
            'last_update': state.get('last_update', datetime.now()).isoformat() if isinstance(state.get('last_update'), datetime) else state.get('last_update'),
            'max_drawdown': state.get('max_drawdown', 0.0),
            'trading_paused': state.get('trading_paused', False)
        }
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 Данные сохранены")
    except Exception as e:
        print(f"Ошибка сохранения данных: {e}")

def load_bot_data():
    """Загружает состояние бота из файла."""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
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
                'last_update': datetime.fromisoformat(data['last_update']) if isinstance(data.get('last_update'), str) else data.get('last_update', datetime.now()),
                'max_drawdown': data.get('max_drawdown', 0.0),
                'trading_paused': data.get('trading_paused', False),
                'logs': []
            }
    except Exception as e:
        print(f"Ошибка загрузки данных: {e}")
    
    return {
        'balance': 1000.0,
        'position': None,
        'price_history': [],
        'balance_history': [{'time': datetime.now(), 'balance': 1000.0}],
        'trades': [],
        'last_update': datetime.now(),
        'max_drawdown': 0.0,
        'trading_paused': False,
        'logs': []
    }

class TradingBotBackground:
    def __init__(self, state):
        self.state = state
        self.symbol = 'BTC/USDT'
        self.risk = 0.1
        self.tp = 0.005
        self.sl = 0.003
        self.sentiment_threshold = 0.2
        self.sma_periods = 10
        
        self.news_cache = {
            'news': [],
            'sentiment': 0.0,
            'last_update': None
        }
        
        self.exchange = ccxt.bybit({
            'apiKey': os.getenv('BYBIT_API_KEY'),
            'secret': os.getenv('BYBIT_SECRET_KEY'),
            'enableRateLimit': True,
        })
        self.analyzer = SentimentIntensityAnalyzer()

    def log(self, message):
        """Логирование в консоль и файл."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        
        # Сохраняем в state
        self.state.setdefault('logs', []).insert(0, log_message)
        if len(self.state['logs']) > 100:
            self.state['logs'].pop()

    def fetch_news_from_rss(self, url, max_items=5):
        """Получает новости из RSS-ленты."""
        try:
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
                    clean_desc = BeautifulSoup(description, 'html.parser').get_text()
                    if clean_desc:
                        news_items.append(clean_desc[:150])
            return news_items
        except Exception:
            return []

    def fetch_news_from_website(self, url, selector='h2, h3, .title, .headline'):
        """Парсит новости с веб-сайта."""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=2)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            news_items = []
            for tag in soup.select(selector)[:10]:
                text = tag.get_text(strip=True)
                if text and len(text) > 20 and len(text) < 200:
                    crypto_keywords = ['bitcoin', 'btc', 'crypto', 'ethereum', 'blockchain', 
                                     'trading', 'market', 'price', 'coin']
                    if any(keyword in text.lower() for keyword in crypto_keywords):
                        news_items.append(text)
                        if len(news_items) >= 3:
                            break
            return news_items
        except Exception:
            return []

    def is_market_relevant(self, news_text):
        """Проверяет релевантность новости."""
        text_lower = news_text.lower()
        personal_story_keywords = [
            'user lost', 'user stolen', 'individual lost', 'person lost',
            'hacked wallet', 'stolen from user', 'scammed user',
            'lost their', 'his wallet', 'her wallet', 'my wallet',
            'personal loss', 'private key stolen', 'phishing victim',
            'victim lost', 'scammed out of', 'lost access to'
        ]
        if any(keyword in text_lower for keyword in personal_story_keywords):
            return False
        
        market_keywords = [
            'bitcoin price', 'btc price', 'crypto market', 'market cap',
            'institutional', 'adoption', 'regulation', 'sec', 'government',
            'exchange', 'trading volume', 'bullish', 'bearish', 'trend',
            'upgrade', 'protocol', 'network', 'mining', 'halving',
            'etf', 'approval', 'ban', 'legal', 'partnership',
            'bank', 'payment', 'integration', 'launch', 'announcement',
            'whale', 'institution', 'corporate', 'company'
        ]
        return any(keyword in text_lower for keyword in market_keywords)

    def filter_news_by_relevance(self, news_list):
        """Фильтрует новости по релевантности."""
        filtered = []
        seen = set()
        for news in news_list:
            news_hash = news[:50].lower().strip()
            if news_hash in seen:
                continue
            seen.add(news_hash)
            if self.is_market_relevant(news):
                filtered.append(news)
        return filtered

    def get_real_news(self):
        """Собирает реальные новости."""
        all_news = []
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
            if len(all_news) >= 20:
                break
        
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
        
        filtered_news = self.filter_news_by_relevance(all_news)
        
        if not filtered_news:
            filtered_news = [
                "Bitcoin adoption increases as major banks start offering crypto services.",
                "Bybit launches new features for paper trading to help beginners.",
                "Market analysts predict a bullish trend for BTC in the coming weeks.",
                "Ethereum upgrade successfully completed, reducing gas fees.",
                "Global economy shows signs of recovery, boosting investor confidence in crypto."
            ]
        else:
            self.log(f"📰 Отфильтровано: {len(all_news)} → {len(filtered_news)} релевантных новостей")
        
        return filtered_news[:10]

    def get_news_sentiment(self):
        """Анализирует настроение новостей."""
        try:
            now = datetime.now()
            if (self.news_cache['last_update'] is None or 
                (now - self.news_cache['last_update']).total_seconds() > 300):
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
                            self.log(f"📰 Обновлено: {len(news)} новостей, sentiment: {avg_sentiment:.2f}")
                            return avg_sentiment
                except Exception as e:
                    self.log(f"⚠️ Новости не загружены, используем кеш")
            
            return self.news_cache.get('sentiment', 0.0)
        except Exception as e:
            return self.news_cache.get('sentiment', 0.0)

    def calculate_rsi(self, prices, period=14):
        """Вычисляет RSI."""
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
        """Вычисляет ATR."""
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
        """Вычисляет ADX."""
        if len(prices) < period * 2:
            return None
        
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
        return min(dx, 100)

    def is_trading_hours(self):
        """Проверяет активные торговые часы."""
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()
        
        if weekday >= 5:
            return False
        
        if 5 <= hour < 23:
            return True
        
        return False

    def calculate_drawdown(self):
        """Вычисляет просадку."""
        if not self.state.get('balance_history'):
            return 0.0
        
        balances = [x['balance'] for x in self.state['balance_history']]
        if not balances:
            return 0.0
        
        peak = max(balances)
        current = self.state['balance']
        drawdown = ((peak - current) / peak) * 100 if peak > 0 else 0.0
        
        max_drawdown = self.state.get('max_drawdown', 0.0)
        if drawdown > max_drawdown:
            self.state['max_drawdown'] = drawdown
        
        return drawdown

    def update_trailing_stop(self, entry_price, current_price, trailing_percent=0.003):
        """Обновляет трейлинг-стоп."""
        if 'trailing_stop' not in self.state['position']:
            self.state['position']['trailing_stop'] = entry_price * (1 - self.sl)
        
        trailing_stop = self.state['position']['trailing_stop']
        
        if current_price > entry_price:
            new_trailing = current_price * (1 - trailing_percent)
            if new_trailing > trailing_stop:
                trailing_stop = new_trailing
                self.state['position']['trailing_stop'] = trailing_stop
        
        return trailing_stop

    def partial_close(self, position, close_percent=0.5):
        """Частично закрывает позицию."""
        entry = position['entry_price']
        amount = position['amount']
        current_price = self.state['price_history'][-1]['price'] if self.state['price_history'] else entry
        
        close_amount = amount * close_percent
        remaining_amount = amount * (1 - close_percent)
        
        profit = close_amount * (current_price - entry)
        self.state['balance'] += close_amount * current_price
        
        self.state['position']['amount'] = remaining_amount
        self.state['position']['partial_closed'] = True
        
        self.state['trades'].append({
            'time': datetime.now(),
            'type': 'SELL (Partial)',
            'price': current_price,
            'profit': profit
        })
        
        self.log(f"📊 Частичное закрытие: {close_percent*100:.0f}% по {current_price}. Профит: +{profit:.2f}")
        save_bot_data(self.state)
        
        return remaining_amount

    def run_cycle(self):
        """Основной цикл торговли."""
        try:
            # Получаем цену
            try:
                ticker = self.exchange.fetch_ticker(self.symbol)
                current_price = ticker['last']
            except Exception as e:
                self.log(f"⚠️ Ошибка получения цены: {str(e)[:50]}")
                if self.state['price_history']:
                    current_price = self.state['price_history'][-1]['price']
                else:
                    return
            
            # Обновляем историю
            self.state['price_history'].append({'time': datetime.now(), 'price': current_price})
            if len(self.state['price_history']) > 200:
                self.state['price_history'].pop(0)
            
            # Анализ новостей
            sentiment = self.get_news_sentiment()
            self.state['sentiment'] = sentiment
            
            # Вычисляем индикаторы
            prices = [x['price'] for x in self.state['price_history']]
            sma = sum(prices[-self.sma_periods:]) / len(prices[-self.sma_periods:]) if len(prices) >= self.sma_periods else 0
            
            rsi = self.calculate_rsi(prices)
            macd, signal, histogram = self.calculate_macd(prices)
            bb_upper, bb_middle, bb_lower = self.calculate_bollinger_bands(prices)
            atr = self.calculate_atr(prices)
            adx = self.calculate_adx(prices)
            
            # Просадка
            drawdown = self.calculate_drawdown()
            
            # Защита от просадки
            max_allowed_drawdown = 20.0
            if drawdown > max_allowed_drawdown and not self.state.get('trading_paused', False):
                self.state['trading_paused'] = True
                self.log(f"🛑 ТОРГОВЛЯ ПРИОСТАНОВЛЕНА! Просадка {drawdown:.2f}% превысила лимит {max_allowed_drawdown}%")
                save_bot_data(self.state)
            
            # Торговая логика
            if self.state['position']:
                entry = self.state['position']['entry_price']
                amount = self.state['position']['amount']
                partial_closed = self.state['position'].get('partial_closed', False)
                
                trailing_stop = self.update_trailing_stop(entry, current_price)
                
                if not partial_closed and current_price >= entry * (1 + self.tp):
                    remaining = self.partial_close(self.state['position'], 0.5)
                    amount = remaining
                
                if current_price <= trailing_stop:
                    profit = amount * (current_price - entry)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (Trailing Stop)', 
                        'price': current_price, 'profit': profit
                    })
                    self.log(f"📉 Trailing Stop! Продано по {current_price}. Профит: +{profit:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
                
                elif partial_closed and current_price >= entry * (1 + self.tp * 1.5):
                    profit = amount * (current_price - entry)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (TP Full)', 
                        'price': current_price, 'profit': profit
                    })
                    self.log(f"✅ TP Full! Продано по {current_price}. Профит: +{profit:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
                
                elif current_price <= entry * (1 - self.sl):
                    loss = amount * (entry - current_price)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (SL)', 
                        'price': current_price, 'profit': -loss
                    })
                    self.log(f"❌ SL! Продано по {current_price}. Убыток: -{loss:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
            else:
                if self.state.get('trading_paused', False):
                    return
                
                conditions_met = []
                
                if len(prices) >= self.sma_periods:
                    conditions_met.append(current_price < sma)
                
                conditions_met.append(sentiment > self.sentiment_threshold)
                
                if rsi:
                    conditions_met.append(rsi < 70)
                
                if macd and signal:
                    conditions_met.append(macd > signal)
                
                if bb_lower:
                    conditions_met.append(current_price <= bb_middle)
                
                if adx:
                    conditions_met.append(adx > 20)
                
                if sum(conditions_met) >= 3 and self.is_trading_hours():
                    base_risk = self.risk
                    if atr and current_price > 0:
                        volatility_factor = min(atr / current_price, 0.05) / 0.01
                        adjusted_risk = base_risk * (1 - volatility_factor * 0.3)
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
                    self.log(f"🚀 ВХОД! Куплено по {current_price} (RSI:{rsi:.1f if rsi else 0}, MACD:{macd:.2f if macd else 0}, ADX:{adx:.1f if adx else 0})")
                    save_bot_data(self.state)

            self.state['balance_history'].append({'time': datetime.now(), 'balance': self.state['balance']})
            self.state['last_update'] = datetime.now()
            
            if len(self.state['balance_history']) % 30 == 0:
                save_bot_data(self.state)
            
        except Exception as e:
            self.log(f"Ошибка: {str(e)}")

def main():
    """Главная функция - запуск бота в фоновом режиме."""
    print("=" * 60)
    print("🤖 ТОРГОВЫЙ БОТ (ФОНОВЫЙ РЕЖИМ)")
    print("=" * 60)
    print(f"Запуск: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Бот будет работать постоянно, проверяя рынок каждую секунду")
    print("Для остановки нажмите Ctrl+C")
    print("=" * 60)
    
    # Загружаем состояние
    state = load_bot_data()
    bot = TradingBotBackground(state)
    
    # Показываем текущий статус
    balance = state['balance']
    position = state.get('position')
    trades_count = len(state.get('trades', []))
    
    print(f"\n📊 Текущий статус:")
    print(f"   Баланс: {balance:.2f} USDT")
    print(f"   Позиция: {'В позиции' if position else 'Ожидание'}")
    print(f"   Всего сделок: {trades_count}")
    print(f"   Просадка: {state.get('max_drawdown', 0.0):.2f}%")
    if state.get('trading_paused', False):
        print(f"   ⚠️ ТОРГОВЛЯ ПРИОСТАНОВЛЕНА")
    print()
    
    # Основной цикл
    cycle_count = 0
    try:
        while True:
            bot.run_cycle()
            cycle_count += 1
            
            # Периодический отчет каждые 60 циклов (1 минута)
            if cycle_count % 60 == 0:
                current_balance = bot.state['balance']
                price = bot.state['price_history'][-1]['price'] if bot.state['price_history'] else 0
                sentiment = bot.state.get('sentiment', 0.0)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 💰 Баланс: {current_balance:.2f} | Цена: {price:.2f} | Sentiment: {sentiment:.2f}")
            
            time.sleep(1)  # Пауза 1 секунда между циклами
            
    except KeyboardInterrupt:
        print("\n\n🛑 Остановка бота...")
        save_bot_data(bot.state)
        print("✅ Данные сохранены. До свидания!")
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        save_bot_data(bot.state)
        print("✅ Данные сохранены перед выходом.")

if __name__ == "__main__":
    main()
