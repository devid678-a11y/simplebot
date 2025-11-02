// Simple CMS JavaScript
class SimpleCMS {
    constructor() {
        this.articles = this.loadArticlesFromStorage();
        this.currentArticleId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadArticles();
    }

    setupEventListeners() {
        // Add article form
        document.getElementById('addArticleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addArticle();
        });

        // Edit article form
        document.getElementById('editArticleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateArticle();
        });
    }

    // Article Management
    addArticle() {
        const form = document.getElementById('addArticleForm');
        const formData = new FormData(form);
        
        const article = {
            id: Date.now().toString(),
            title: formData.get('title'),
            excerpt: formData.get('excerpt'),
            content: formData.get('content'),
            category: formData.get('category'),
            status: formData.get('status'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.articles.push(article);
        this.saveArticlesToStorage();
        this.showMessage('Статья успешно создана!', 'success');
        this.closeModal('addModal');
        this.loadArticles();
        form.reset();
    }

    updateArticle() {
        const form = document.getElementById('editArticleForm');
        const formData = new FormData(form);
        const articleId = formData.get('id');

        const articleIndex = this.articles.findIndex(article => article.id === articleId);
        
        if (articleIndex !== -1) {
            this.articles[articleIndex] = {
                ...this.articles[articleIndex],
                title: formData.get('title'),
                excerpt: formData.get('excerpt'),
                content: formData.get('content'),
                category: formData.get('category'),
                status: formData.get('status'),
                updatedAt: new Date().toISOString()
            };

            this.saveArticlesToStorage();
            this.showMessage('Статья успешно обновлена!', 'success');
            this.closeModal('editModal');
            this.loadArticles();
        }
    }

    deleteArticle(articleId) {
        if (confirm('Вы уверены, что хотите удалить эту статью?')) {
            this.articles = this.articles.filter(article => article.id !== articleId);
            this.saveArticlesToStorage();
            this.showMessage('Статья удалена!', 'success');
            this.loadArticles();
        }
    }

    // UI Functions
    openAddModal() {
        document.getElementById('addModal').style.display = 'block';
    }

    openEditModal(articleId) {
        const article = this.articles.find(article => article.id === articleId);
        if (article) {
            const form = document.getElementById('editArticleForm');
            form.querySelector('input[name="id"]').value = article.id;
            form.querySelector('input[name="title"]').value = article.title;
            form.querySelector('textarea[name="excerpt"]').value = article.excerpt;
            form.querySelector('textarea[name="content"]').value = article.content;
            form.querySelector('select[name="category"]').value = article.category;
            form.querySelector('select[name="status"]').value = article.status;
            
            document.getElementById('editModal').style.display = 'block';
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    loadArticles() {
        const articlesList = document.getElementById('articlesList');
        const articlesContainer = document.getElementById('articlesContainer');
        
        if (this.articles.length === 0) {
            articlesContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Статей пока нет</div>';
        } else {
            articlesContainer.innerHTML = this.articles.map(article => `
                <div class="article-item">
                    <div>
                        <div class="article-title">${article.title}</div>
                        <div class="article-date">
                            ${new Date(article.createdAt).toLocaleDateString('ru-RU')} • 
                            ${this.getCategoryName(article.category)} • 
                            ${this.getStatusName(article.status)}
                        </div>
                    </div>
                    <div class="article-actions">
                        <button class="btn btn-edit btn-small" onclick="cms.openEditModal('${article.id}')">Редактировать</button>
                        <button class="btn btn-delete btn-small" onclick="cms.deleteArticle('${article.id}')">Удалить</button>
                    </div>
                </div>
            `).join('');
        }
        
        articlesList.classList.remove('hidden');
    }

    // Utility Functions
    getCategoryName(category) {
        const categories = {
            'news': 'Новости',
            'articles': 'Статьи',
            'cases': 'Кейсы'
        };
        return categories[category] || category;
    }

    getStatusName(status) {
        const statuses = {
            'draft': 'Черновик',
            'published': 'Опубликовано'
        };
        return statuses[status] || status;
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageClass = type === 'success' ? 'success-message' : 'error-message';
        
        messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
        
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 3000);
    }

    // Storage Functions
    saveArticlesToStorage() {
        localStorage.setItem('cms_articles', JSON.stringify(this.articles));
    }

    loadArticlesFromStorage() {
        const stored = localStorage.getItem('cms_articles');
        return stored ? JSON.parse(stored) : [];
    }

    // Export articles to JSON
    exportArticles() {
        const dataStr = JSON.stringify(this.articles, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'articles.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import articles from JSON
    importArticles(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedArticles = JSON.parse(e.target.result);
                this.articles = [...this.articles, ...importedArticles];
                this.saveArticlesToStorage();
                this.showMessage('Статьи успешно импортированы!', 'success');
                this.loadArticles();
            } catch (error) {
                this.showMessage('Ошибка при импорте файла!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global functions for HTML onclick events
function openAddModal() {
    cms.openAddModal();
}

function loadArticles() {
    cms.loadArticles();
}

function openSettings() {
    alert('Настройки будут добавлены в следующей версии!');
}

// Initialize CMS when page loads
let cms;
document.addEventListener('DOMContentLoaded', function() {
    cms = new SimpleCMS();
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
});

// Add some sample articles if none exist
if (!localStorage.getItem('cms_articles')) {
    const sampleArticles = [
        {
            id: '1',
            title: 'Добро пожаловать в CMS!',
            excerpt: 'Это пример статьи для демонстрации возможностей системы управления контентом.',
            content: 'Это первая статья в вашей CMS. Вы можете редактировать её, удалять или создавать новые статьи. Система автоматически сохраняет все изменения в локальном хранилище браузера.',
            category: 'news',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Как использовать CMS',
            excerpt: 'Краткое руководство по использованию системы управления контентом.',
            content: 'Для создания новой статьи нажмите кнопку "Создать статью". Заполните все поля и выберите категорию. Статья будет сохранена и появится в списке статей.',
            category: 'articles',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('cms_articles', JSON.stringify(sampleArticles));
}
