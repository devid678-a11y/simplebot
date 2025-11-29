    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3 class="footer-title">ARCH BUREAU</h3>
                    <p class="footer-description">
                        Архитектурное бюро, создающее пространства будущего.
                        Брутализм. Функциональность. Вневременность.
                    </p>
                </div>

                <div class="footer-section">
                    <h4 class="footer-heading">НАВИГАЦИЯ</h4>
                    <nav class="footer-nav">
                        <?php
                        wp_nav_menu(array(
                            'theme_location' => 'footer',
                            'container'      => false,
                            'menu_class'     => 'footer-nav-menu',
                            'fallback_cb'    => 'arch_bureau_footer_fallback_menu',
                            'items_wrap'     => '<ul class="%2$s">%3$s</ul>',
                        ));
                        ?>
                    </nav>
                </div>

                <div class="footer-section">
                    <h4 class="footer-heading">КОНТАКТЫ</h4>
                    <div class="footer-contact">
                        <?php if (get_theme_mod('arch_bureau_email')) : ?>
                            <a href="mailto:<?php echo esc_attr(get_theme_mod('arch_bureau_email')); ?>" class="footer-link">
                                <?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_email'))); ?>
                            </a>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_phone')) : ?>
                            <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', get_theme_mod('arch_bureau_phone'))); ?>" class="footer-link">
                                <?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_phone'))); ?>
                            </a>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_address')) : ?>
                            <p class="footer-address">
                                <?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_address'))); ?>
                            </p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="footer-section">
                    <h4 class="footer-heading">СОЦИАЛЬНЫЕ СЕТИ</h4>
                    <div class="footer-social">
                        <?php if (get_theme_mod('arch_bureau_instagram')) : ?>
                            <a href="<?php echo esc_url(get_theme_mod('arch_bureau_instagram')); ?>" target="_blank" rel="noopener" class="footer-social-link">INSTAGRAM</a>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_facebook')) : ?>
                            <a href="<?php echo esc_url(get_theme_mod('arch_bureau_facebook')); ?>" target="_blank" rel="noopener" class="footer-social-link">FACEBOOK</a>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_linkedin')) : ?>
                            <a href="<?php echo esc_url(get_theme_mod('arch_bureau_linkedin')); ?>" target="_blank" rel="noopener" class="footer-social-link">LINKEDIN</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div class="footer-bottom">
                <p class="footer-copyright">
                    © <?php echo date('Y'); ?> ARCH BUREAU. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
                </p>
                <p class="footer-design">
                    ДИЗАЙН В СТИЛЕ БРУТАЛИЗМ
                </p>
            </div>
        </div>
    </footer>

    <!-- Scroll to Top Button -->
    <button class="scroll-to-top" id="scrollToTop" aria-label="Scroll to top">
        ↑
    </button>
</div>

<?php wp_footer(); ?>
</body>
</html>

<?php
/**
 * Функция для fallback меню в header
 */
function arch_bureau_fallback_menu() {
    echo '<ul class="nav-menu">';
    echo '<li><a href="' . esc_url(home_url('/')) . '" class="nav-link">ГЛАВНАЯ</a></li>';
    echo '<li><a href="' . esc_url(home_url('/blog')) . '" class="nav-link">БЛОГ</a></li>';
    echo '<li><a href="' . esc_url(home_url('/contact')) . '" class="nav-link">КОНТАКТЫ</a></li>';
    echo '</ul>';
}

/**
 * Функция для fallback меню в footer
 */
function arch_bureau_footer_fallback_menu() {
    echo '<ul class="footer-nav-menu">';
    echo '<li><a href="' . esc_url(home_url('/')) . '" class="footer-link">ГЛАВНАЯ</a></li>';
    echo '<li><a href="' . esc_url(home_url('/blog')) . '" class="footer-link">БЛОГ</a></li>';
    echo '<li><a href="' . esc_url(home_url('/contact')) . '" class="footer-link">КОНТАКТЫ</a></li>';
    echo '</ul>';
}
?>

