# Руководство по внедрению улучшений торговой системы

## Что будет добавлено:

1. **numpy** для расчетов технических индикаторов
2. **Фильтрация новостей** - исключение личных историй о кражах
3. **Расширенные источники новостей** - добавлено 3 новых RSS-ленты
4. **Технические индикаторы**: RSI, MACD, Bollinger Bands
5. **Улучшенная стратегия** - вход по комбинации индикаторов (минимум 3 из 5 условий)
6. **Статистика торговли** - Win Rate, средний профит/убыток, Profit Factor

## Шаги внедрения:

### 1. Добавить numpy в импорты (строка 16)

После строки `import json` добавить:
```python
import numpy as np
```

### 2. Добавить функции фильтрации новостей (после строки 229, перед get_real_news)

Вставить следующий код:
```python
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
```

### 3. Обновить функцию get_real_news (заменить строки 231-271)

Заменить функцию `get_real_news` на:
```python
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
```

### 4. Добавить технические индикаторы (после get_news_sentiment, перед run_cycle)

Вставить перед функцией `run_cycle`:
```python
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
```

### 5. Обновить run_cycle (заменить строки 312-393)

Заменить функцию `run_cycle` на улучшенную версию с индикаторами:
```python
    def run_cycle(self):
        try:
            # 1. Получаем цену (ПРИОРИТЕТ - быстро!)
            try:
                ticker = self.exchange.fetch_ticker(self.symbol)
                current_price = ticker['last']
            except Exception as e:
                self.add_log(f"⚠️ Ошибка получения цены: {str(e)[:50]}")
                if self.state['price_history']:
                    current_price = self.state['price_history'][-1]['price']
                else:
                    current_price = 0
                    return
            
            # 2. Обновляем историю
            self.state['price_history'].append({'time': datetime.now(), 'price': current_price})
            if len(self.state['price_history']) > 200:  # Увеличили для индикаторов
                self.state['price_history'].pop(0)
            
            # 3. Анализ новостей
            sentiment = self.get_news_sentiment()
            self.state['sentiment'] = sentiment
            
            # 4. Вычисляем технические индикаторы
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
            
            # 5. Улучшенная торговая логика
            if self.state['position']:
                entry = self.state['position']['entry_price']
                amount = self.state['position']['amount']
                
                # Take Profit
                if current_price >= entry * (1 + self.tp):
                    profit = amount * (current_price - entry)
                    self.state['balance'] += amount * current_price
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'SELL (TP)', 
                        'price': current_price, 'profit': profit
                    })
                    self.add_log(f"✅ TP! Продано по {current_price}. Профит: +{profit:.2f}")
                    self.state['position'] = None
                    save_bot_data(self.state)
                
                # Stop Loss
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
                # УЛУЧШЕННЫЕ УСЛОВИЯ ВХОДА
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
                
                # Вход если выполнено минимум 3 из 5 условий
                if sum(conditions_met) >= 3:
                    investment = self.state['balance'] * self.risk
                    amount = investment / current_price
                    self.state['balance'] -= investment
                    self.state['position'] = {'entry_price': current_price, 'amount': amount}
                    self.state['trades'].append({
                        'time': datetime.now(), 'type': 'BUY', 
                        'price': current_price, 'profit': 0
                    })
                    self.add_log(f"🚀 ВХОД! Куплено по {current_price} (RSI:{rsi:.1f}, MACD:{macd:.2f})")
                    save_bot_data(self.state)

            self.state['balance_history'].append({'time': datetime.now(), 'balance': self.state['balance']})
            self.state['last_update'] = datetime.now()
            
            if len(self.state['balance_history']) % 30 == 0:
                save_bot_data(self.state)
            
        except Exception as e:
            self.add_log(f"Ошибка: {str(e)}")
```

### 6. Обновить инициализацию state (строки 120-127 и 130-142)

В обоих местах (где создается `st.session_state.bot_state`) добавить:
```python
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'bb_upper': 0.0,
            'bb_lower': 0.0,
```

### 7. Добавить функцию статистики (перед интерфейсом, после класса TradingBot)

Вставить перед строкой `# ==========================================` (строка 395):
```python
def calculate_statistics(trades):
    """Вычисляет статистику торговли."""
    if not trades:
        return {}
    
    df = pd.DataFrame(trades)
    winning_trades = df[df['profit'] > 0]
    losing_trades = df[df['profit'] < 0]
    
    total_trades = len(df)
    win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
    avg_profit = winning_trades['profit'].mean() if len(winning_trades) > 0 else 0
    avg_loss = abs(losing_trades['profit'].mean()) if len(losing_trades) > 0 else 0
    total_profit = df['profit'].sum()
    
    return {
        'total_trades': total_trades,
        'win_rate': win_rate,
        'avg_profit': avg_profit,
        'avg_loss': avg_loss,
        'total_profit': total_profit,
        'profit_factor': avg_profit / avg_loss if avg_loss > 0 else 0
    }
```

### 8. Обновить интерфейс - добавить метрики индикаторов (после строки 441)

После строки 441 (после метрики "Статус") добавить:
```python
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
```

### 9. Добавить статистику торговли (после строки 477, перед "Логи и Сделки")

После строки 477 (после вкладки "Новости") добавить:
```python
# Статистика торговли
if st.session_state.bot_state.get('trades'):
    stats = calculate_statistics(st.session_state.bot_state['trades'])
    st.subheader("📊 Статистика торговли")
    stat_cols = st.columns(5)
    with stat_cols[0]:
        st.metric("Всего сделок", stats['total_trades'])
    with stat_cols[1]:
        st.metric("Win Rate", f"{stats['win_rate']:.1f}%")
    with stat_cols[2]:
        st.metric("Средний профит", f"{stats['avg_profit']:.2f}")
    with stat_cols[3]:
        st.metric("Средний убыток", f"{stats['avg_loss']:.2f}")
    with stat_cols[4]:
        st.metric("Общий профит", f"{stats['total_profit']:.2f}")
```

### 10. Обновить requirements.txt

Добавить `numpy` в файл `requirements.txt`:
```
numpy
```

## После внедрения:

1. Установите numpy: `pip install numpy`
2. Перезапустите бота
3. Проверьте работу фильтрации новостей и индикаторов

## Преимущества:

- ✅ Фильтрация исключает личные истории о кражах
- ✅ Больше источников новостей (6 RSS вместо 3)
- ✅ Технические индикаторы для более точных решений
- ✅ Комбинированная стратегия (минимум 3 из 5 условий)
- ✅ Детальная статистика торговли
