#!/bin/bash
# Автоматическая установка WordPress на Timeweb Backend приложение

set -e

echo "🚀 Начинаем установку WordPress..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия wget
if ! command -v wget &> /dev/null; then
    echo -e "${RED}❌ wget не установлен. Устанавливаем...${NC}"
    apt-get update && apt-get install -y wget
fi

# Скачиваем WordPress
echo -e "${YELLOW}📥 Скачиваем WordPress...${NC}"
wget -q https://wordpress.org/latest.tar.gz
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при скачивании WordPress${NC}"
    exit 1
fi

# Распаковываем
echo -e "${YELLOW}📦 Распаковываем...${NC}"
tar -xzf latest.tar.gz
mv wordpress/* .
rm -rf wordpress latest.tar.gz

# Создаем wp-config.php
echo -e "${YELLOW}⚙️  Настраиваем wp-config.php...${NC}"
if [ ! -f wp-config.php ]; then
    cp wp-config-sample.php wp-config.php
    
    echo -e "${GREEN}✅ WordPress файлы установлены!${NC}"
    echo -e "${YELLOW}📝 Теперь нужно:${NC}"
    echo "1. Создать базу данных MySQL в панели Timeweb"
    echo "2. Отредактировать wp-config.php с данными БД:"
    echo "   - DB_NAME"
    echo "   - DB_USER"
    echo "   - DB_PASSWORD"
    echo "   - DB_HOST"
    echo ""
    echo "3. Открыть сайт в браузере для завершения установки"
    echo ""
    echo -e "${GREEN}📋 Команда для редактирования:${NC}"
    echo "nano wp-config.php"
else
    echo -e "${GREEN}✅ wp-config.php уже существует${NC}"
fi

echo -e "${GREEN}🎉 Установка завершена!${NC}"




