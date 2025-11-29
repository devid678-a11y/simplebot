<?php
/**
 * Шаблон страницы 404
 */
get_header();
?>

<div class="error-404-page">
    <div class="error-404-hero">
        <div class="container">
            <h1 class="error-404-title">404</h1>
            <p class="error-404-subtitle">СТРАНИЦА НЕ НАЙДЕНА</p>
        </div>
    </div>

    <div class="error-404-content section">
        <div class="container">
            <div class="error-404-message">
                <p>Запрашиваемая страница не существует или была перемещена.</p>
                <div class="error-404-actions">
                    <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">
                        НА ГЛАВНУЮ
                    </a>
                    <a href="<?php echo esc_url(home_url('/blog')); ?>" class="btn btn-secondary">
                        В БЛОГ
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
get_footer();
?>

