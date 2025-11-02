<?php
/**
 * Главная страница темы OXEM
 */

get_header(); ?>

<main class="main-content">
    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <h1 class="hero-title">
                <span class="title-line">
                    <span class="number">№1</span>
                    <span class="underline"></span>
                </span>
                <span class="title-line">
                    дизайн-<br>студия Москвы
                </span>
            </h1>

            <div class="hero-subtitle">
                <div class="subtitle-left">
                    <p>В категории веб-дизайн</p>
                    <p>Рейтинга Рунета'24</p>
                </div>
                <div class="subtitle-right">
                    <p>Создаем цифровые продукты,</p>
                    <p>которые покоряют с первого клика</p>
                </div>
            </div>

            <div class="hero-accent">
                <div class="blue-dot"></div>
            </div>
        </div>
    </section>

    <!-- Blog Section -->
    <section class="blog-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Наш Блог</h2>
                <p class="section-description">Последние новости и статьи</p>
            </div>
            
            <div class="blog-grid">
                <?php
                // Получаем последние посты
                $posts = get_posts(array(
                    'numberposts' => 6,
                    'post_status' => 'publish'
                ));
                
                if ($posts) :
                    foreach ($posts as $post) :
                        setup_postdata($post);
                        $custom_fields = get_post_custom($post->ID);
                        $excerpt = get_the_excerpt();
                        $category = get_the_category($post->ID);
                        $category_name = $category ? $category[0]->name : 'Без категории';
                        ?>
                        <article class="blog-card">
                            <div class="blog-card-image">
                                <?php if (has_post_thumbnail()) : ?>
                                    <?php the_post_thumbnail('medium'); ?>
                                <?php else : ?>
                                    <span><?php echo get_category_icon($category_name); ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="blog-card-content">
                                <h3 class="blog-card-title">
                                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                                </h3>
                                <p class="blog-card-excerpt"><?php echo $excerpt; ?></p>
                                <div class="blog-card-meta">
                                    <span><?php echo get_the_date(); ?></span>
                                    <span class="blog-card-category"><?php echo $category_name; ?></span>
                                </div>
                            </div>
                        </article>
                        <?php
                    endforeach;
                    wp_reset_postdata();
                else :
                ?>
                    <div style="text-align: center; color: #666; padding: 2rem; grid-column: 1 / -1;">
                        Статей пока нет. <a href="<?php echo admin_url('post-new.php'); ?>">Создайте первую статью</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- Contact Form Section -->
    <section class="contact-form-section">
        <div class="container">
            <div class="form-container">
                <h2 class="form-title">Связаться с нами</h2>
                <p class="form-description">Оставьте заявку и мы свяжемся с вами в течение 15 минут</p>
                
                <?php
                // Используем Contact Form 7 или создаем простую форму
                if (shortcode_exists('contact-form-7')) {
                    echo do_shortcode('[contact-form-7 id="1" title="Contact form"]');
                } else {
                    // Простая форма
                    ?>
                    <form class="contact-form" method="post" action="<?php echo admin_url('admin-ajax.php'); ?>">
                        <input type="hidden" name="action" value="submit_contact_form">
                        <div class="form-group">
                            <input type="text" name="name" placeholder="Ваше имя" required>
                        </div>
                        <div class="form-group">
                            <input type="email" name="email" placeholder="Email" required>
                        </div>
                        <div class="form-group">
                            <input type="tel" name="phone" placeholder="Телефон" required>
                        </div>
                        <div class="form-group">
                            <textarea name="message" placeholder="Сообщение" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="submit-btn">Отправить заявку</button>
                    </form>
                    <?php
                }
                ?>
            </div>
        </div>
    </section>
</main>

<?php get_footer(); ?>
