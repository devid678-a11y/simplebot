<?php
/**
 * Шаблон страницы контактов
 */
?>

<div class="contact-page">
    <div class="contact-hero">
        <div class="container">
            <h1 class="contact-hero-title">КОНТАКТЫ</h1>
            <p class="contact-hero-subtitle">Начнем ваш проект сегодня</p>
        </div>
    </div>

    <div class="contact-content section">
        <div class="container">
            <div class="contact-grid">
                <div class="contact-info-section">
                    <h2 class="contact-section-title">СВЯЖИТЕСЬ С НАМИ</h2>
                    <p class="contact-section-description">
                        Готовы обсудить ваш проект? Заполните форму или свяжитесь
                        с нами напрямую. Мы ответим в течение 24 часов.
                    </p>

                    <div class="contact-info-list">
                        <?php if (get_theme_mod('arch_bureau_address')) : ?>
                        <div class="contact-info-item">
                            <div class="contact-info-label">АДРЕС</div>
                            <div class="contact-info-value"><?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_address'))); ?></div>
                        </div>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_phone')) : ?>
                        <div class="contact-info-item">
                            <div class="contact-info-label">ТЕЛЕФОН</div>
                            <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', get_theme_mod('arch_bureau_phone'))); ?>" class="contact-info-value"><?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_phone'))); ?></a>
                        </div>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_email')) : ?>
                        <div class="contact-info-item">
                            <div class="contact-info-label">EMAIL</div>
                            <a href="mailto:<?php echo esc_attr(get_theme_mod('arch_bureau_email')); ?>" class="contact-info-value"><?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_email'))); ?></a>
                        </div>
                        <?php endif; ?>
                        <?php if (get_theme_mod('arch_bureau_hours')) : ?>
                        <div class="contact-info-item">
                            <div class="contact-info-label">ЧАСЫ РАБОТЫ</div>
                            <div class="contact-info-value"><?php echo strtoupper(esc_html(get_theme_mod('arch_bureau_hours'))); ?></div>
                        </div>
                        <?php endif; ?>
                    </div>

                    <div class="contact-visual brutal-grid"></div>
                </div>

                <div class="contact-form-section">
                    <?php
                    // Используем Contact Form 7 или стандартную форму
                    if (function_exists('wpcf7_contact_form')) {
                        echo do_shortcode('[contact-form-7 id="1" title="Контактная форма"]');
                    } else {
                    ?>
                        <form class="contact-form" id="contactForm" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('arch_bureau_contact_form', 'arch_bureau_nonce'); ?>
                            <input type="hidden" name="action" value="arch_bureau_contact_form">
                            
                            <div class="form-group">
                                <label for="name" class="form-label">ИМЯ *</label>
                                <input type="text" id="name" name="name" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label for="email" class="form-label">EMAIL *</label>
                                <input type="email" id="email" name="email" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label for="phone" class="form-label">ТЕЛЕФОН</label>
                                <input type="tel" id="phone" name="phone" class="form-input">
                            </div>

                            <div class="form-group">
                                <label for="project" class="form-label">ТИП ПРОЕКТА</label>
                                <select id="project" name="project" class="form-input">
                                    <option value="">ВЫБЕРИТЕ ТИП</option>
                                    <option value="residential">ЖИЛОЙ</option>
                                    <option value="commercial">КОММЕРЧЕСКИЙ</option>
                                    <option value="cultural">КУЛЬТУРНЫЙ</option>
                                    <option value="other">ДРУГОЙ</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="message" class="form-label">СООБЩЕНИЕ *</label>
                                <textarea id="message" name="message" class="form-input form-textarea" rows="6" required></textarea>
                            </div>

                            <div class="form-success" id="formSuccess" style="display: none;">
                                ✓ Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
                            </div>

                            <button type="submit" class="form-submit-btn" id="submitBtn">
                                ОТПРАВИТЬ
                            </button>
                        </form>
                    <?php } ?>
                </div>
            </div>
        </div>
    </div>
</div>

