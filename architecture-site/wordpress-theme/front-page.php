<?php
/**
 * Шаблон главной страницы
 */
get_header();
?>

<div class="home">
    <!-- Hero Section -->
    <section class="hero" id="hero">
        <div class="hero-background">
            <?php 
            $hero_image = get_theme_mod('arch_bureau_hero_image', '');
            if ($hero_image) : 
            ?>
                <div class="hero-image" style="background-image: url('<?php echo esc_url($hero_image); ?>');"></div>
            <?php else : ?>
                <div class="hero-image"></div>
            <?php endif; ?>
            <div class="hero-overlay"></div>
        </div>
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1 class="hero-title">
                        <?php echo esc_html(get_theme_mod('arch_bureau_hero_title', 'АРХИТЕКТУРА')); ?>
                        <br>
                        <span class="accent"><?php echo esc_html(get_theme_mod('arch_bureau_hero_subtitle', 'БЕЗ КОМПРОМИССОВ')); ?></span>
                    </h1>
                    <p class="hero-description">
                        <?php echo esc_html(get_theme_mod('arch_bureau_hero_description', 'Создаем пространства, которые формируют будущее. Брутализм как философия дизайна. Чистота форм. Функциональность превыше всего.')); ?>
                    </p>
                    <div class="hero-actions">
                        <a href="<?php echo esc_url(home_url('/contact')); ?>" class="btn btn-primary">
                            НАЧАТЬ ПРОЕКТ
                        </a>
                        <a href="<?php echo esc_url(home_url('/blog')); ?>" class="btn btn-secondary">
                            СМОТРЕТЬ РАБОТЫ
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div class="hero-scroll-indicator">
            <span>СКРОЛЛ</span>
            <div class="scroll-arrow"></div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number" data-value="<?php echo esc_attr(get_theme_mod('arch_bureau_stats_projects', '150')); ?>">0</div>
                    <div class="stat-label">ПРОЕКТОВ</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" data-value="<?php echo esc_attr(get_theme_mod('arch_bureau_stats_years', '25')); ?>">0</div>
                    <div class="stat-label">ЛЕТ ОПЫТА</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" data-value="<?php echo esc_attr(get_theme_mod('arch_bureau_stats_awards', '50')); ?>">0</div>
                    <div class="stat-label">НАГРАД</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" data-value="<?php echo esc_attr(get_theme_mod('arch_bureau_stats_countries', '30')); ?>">0</div>
                    <div class="stat-label">СТРАН</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Projects Section -->
    <?php
    $projects_query = new WP_Query(array(
        'post_type'      => 'project',
        'posts_per_page' => 3,
        'post_status'    => 'publish',
    ));
    
    if (!$projects_query->have_posts()) {
        $projects_query = new WP_Query(array(
            'post_type'      => 'post',
            'posts_per_page' => 3,
            'post_status'    => 'publish',
            'category_name'  => 'projects',
        ));
    }
    ?>
    
    <?php if ($projects_query->have_posts()) : ?>
    <section class="projects-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">ПРОЕКТЫ</h2>
                <p class="section-subtitle">Выборочный портфель работ</p>
            </div>
            <div class="projects-grid">
                <?php while ($projects_query->have_posts()) : $projects_query->the_post(); 
                    $project_location = get_post_meta(get_the_ID(), '_project_location', true);
                    $project_category = get_post_meta(get_the_ID(), '_project_category', true);
                    $project_year = get_post_meta(get_the_ID(), '_project_year', true);
                ?>
                <div class="project-item">
                    <div class="project-image-wrapper">
                        <?php if (has_post_thumbnail()) : ?>
                            <div class="project-image" style="background-image: url('<?php echo esc_url(get_the_post_thumbnail_url(get_the_ID(), 'arch-bureau-project')); ?>');"></div>
                        <?php else : ?>
                            <div class="project-image" style="background-image: url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop');"></div>
                        <?php endif; ?>
                        <div class="project-overlay">
                            <div class="project-info">
                                <?php if ($project_category) : ?>
                                    <span class="project-category"><?php echo esc_html($project_category); ?></span>
                                <?php endif; ?>
                                <h3 class="project-title"><?php the_title(); ?></h3>
                                <p class="project-location"><?php echo $project_location ? esc_html($project_location) : get_the_date('Y'); ?></p>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endwhile; ?>
                <?php wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Services Section -->
    <?php
    $services_query = new WP_Query(array(
        'post_type'      => 'service',
        'posts_per_page' => 4,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ));
    ?>
    <?php if ($services_query->have_posts()) : ?>
    <section class="services-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">УСЛУГИ</h2>
                <p class="section-subtitle">Полный спектр архитектурных решений</p>
            </div>
            <div class="services-grid">
                <?php 
                $service_index = 1;
                while ($services_query->have_posts()) : $services_query->the_post();
                    $service_number = get_post_meta(get_the_ID(), '_service_number', true);
                    $service_description = get_post_meta(get_the_ID(), '_service_description', true);
                    if (!$service_number) {
                        $service_number = str_pad($service_index, 2, '0', STR_PAD_LEFT);
                    }
                ?>
                <div class="service-item">
                    <div class="service-number"><?php echo esc_html($service_number); ?></div>
                    <h3 class="service-title"><?php the_title(); ?></h3>
                    <p class="service-description"><?php echo $service_description ? esc_html($service_description) : get_the_excerpt(); ?></p>
                </div>
                <?php 
                $service_index++;
                endwhile; 
                wp_reset_postdata();
                ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Process Section -->
    <section class="process-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">ПРОЦЕСС РАБОТЫ</h2>
                <p class="section-subtitle">От концепции до реализации</p>
            </div>
            <div class="process-grid">
                <div class="process-card">
                    <div class="process-card-number">01</div>
                    <div class="process-card-content">
                        <h3 class="process-card-title">ИССЛЕДОВАНИЕ</h3>
                        <p class="process-card-description">Анализ участка, требований, контекста</p>
                    </div>
                    <div class="process-card-arrow">→</div>
                </div>
                <div class="process-card">
                    <div class="process-card-number">02</div>
                    <div class="process-card-content">
                        <h3 class="process-card-title">КОНЦЕПЦИЯ</h3>
                        <p class="process-card-description">Разработка архитектурной концепции</p>
                    </div>
                    <div class="process-card-arrow">→</div>
                </div>
                <div class="process-card">
                    <div class="process-card-number">03</div>
                    <div class="process-card-content">
                        <h3 class="process-card-title">ПРОЕКТИРОВАНИЕ</h3>
                        <p class="process-card-description">Детальная проработка проекта</p>
                    </div>
                    <div class="process-card-arrow">→</div>
                </div>
                <div class="process-card">
                    <div class="process-card-number">04</div>
                    <div class="process-card-content">
                        <h3 class="process-card-title">РАЗРАБОТКА</h3>
                        <p class="process-card-description">Техническая документация и согласования</p>
                    </div>
                    <div class="process-card-arrow">→</div>
                </div>
                <div class="process-card">
                    <div class="process-card-number">05</div>
                    <div class="process-card-content">
                        <h3 class="process-card-title">РЕАЛИЗАЦИЯ</h3>
                        <p class="process-card-description">Авторский надзор и реализация проекта</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Team Section -->
    <?php
    $team_query = new WP_Query(array(
        'post_type'      => 'team',
        'posts_per_page' => 3,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ));
    ?>
    <?php if ($team_query->have_posts()) : ?>
    <section class="team-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">КОМАНДА</h2>
                <p class="section-subtitle">Профессионалы с многолетним опытом</p>
            </div>
            <div class="team-grid">
                <?php while ($team_query->have_posts()) : $team_query->the_post();
                    $team_role = get_post_meta(get_the_ID(), '_team_role', true);
                    $team_experience = get_post_meta(get_the_ID(), '_team_experience', true);
                ?>
                <div class="team-member">
                    <div class="team-member-image-wrapper">
                        <?php if (has_post_thumbnail()) : ?>
                            <div class="team-member-image" style="background-image: url('<?php echo esc_url(get_the_post_thumbnail_url(get_the_ID(), 'arch-bureau-thumbnail')); ?>');"></div>
                        <?php else : ?>
                            <div class="team-member-image" style="background-image: url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80');"></div>
                        <?php endif; ?>
                    </div>
                    <div class="team-member-info">
                        <h3 class="team-member-name"><?php the_title(); ?></h3>
                        <p class="team-member-role"><?php echo $team_role ? esc_html($team_role) : 'АРХИТЕКТОР'; ?></p>
                        <p class="team-member-experience"><?php echo $team_experience ? esc_html($team_experience) : ''; ?></p>
                    </div>
                </div>
                <?php endwhile; ?>
                <?php wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Clients Section -->
    <?php
    $clients_query = new WP_Query(array(
        'post_type'      => 'client',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ));
    ?>
    <?php if ($clients_query->have_posts()) : ?>
    <section class="clients-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">КЛИЕНТЫ</h2>
                <p class="section-subtitle">Нам доверяют ведущие компании</p>
            </div>
            <div class="clients-grid">
                <?php while ($clients_query->have_posts()) : $clients_query->the_post();
                    $client_website = get_post_meta(get_the_ID(), '_client_website', true);
                ?>
                <div class="client-item">
                    <div class="client-logo">
                        <?php if (has_post_thumbnail()) : ?>
                            <?php echo get_the_post_thumbnail(get_the_ID(), 'full', array('style' => 'width: 80px; height: 80px; object-fit: contain;')); ?>
                        <?php else : ?>
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="20" y="20" width="40" height="40" stroke="currentColor" stroke-width="3"/>
                                <circle cx="40" cy="40" r="8" fill="currentColor"/>
                            </svg>
                        <?php endif; ?>
                    </div>
                    <p class="client-name"><?php the_title(); ?></p>
                </div>
                <?php endwhile; ?>
                <?php wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Awards Section -->
    <?php
    $awards_query = new WP_Query(array(
        'post_type'      => 'award',
        'posts_per_page' => 3,
        'post_status'    => 'publish',
        'orderby'        => 'meta_value_num',
        'meta_key'       => '_award_year',
        'order'          => 'DESC',
    ));
    ?>
    <?php if ($awards_query->have_posts()) : ?>
    <section class="awards-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">НАГРАДЫ</h2>
                <p class="section-subtitle">Признание профессионального сообщества</p>
            </div>
            <div class="awards-grid">
                <?php while ($awards_query->have_posts()) : $awards_query->the_post();
                    $award_year = get_post_meta(get_the_ID(), '_award_year', true);
                    $award_description = get_post_meta(get_the_ID(), '_award_description', true);
                ?>
                <div class="award-item">
                    <div class="award-year"><?php echo $award_year ? esc_html($award_year) : get_the_date('Y'); ?></div>
                    <h3 class="award-title"><?php the_title(); ?></h3>
                    <p class="award-description"><?php echo $award_description ? esc_html($award_description) : get_the_excerpt(); ?></p>
                </div>
                <?php endwhile; ?>
                <?php wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Testimonials Section -->
    <section class="testimonials-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">ОТЗЫВЫ</h2>
                <p class="section-subtitle">Что говорят наши клиенты</p>
            </div>
            <div class="testimonials-grid">
                <div class="testimonial-item">
                    <div class="testimonial-quote">"Профессиональный подход и внимание к деталям. Проект превзошел все ожидания."</div>
                    <div class="testimonial-author">
                        <div class="testimonial-author-image" style="background-image: url('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80');"></div>
                        <div class="testimonial-author-info">
                            <p class="testimonial-author-name">ИВАН СМИРНОВ</p>
                            <p class="testimonial-author-company">ГЕНЕРАЛЬНЫЙ ДИРЕКТОР, РОСАТОМ</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-item">
                    <div class="testimonial-quote">"Инновационные решения и современный подход к архитектуре. Рекомендуем."</div>
                    <div class="testimonial-author">
                        <div class="testimonial-author-image" style="background-image: url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80');"></div>
                        <div class="testimonial-author-info">
                            <p class="testimonial-author-name">ЕЛЕНА КОЗЛОВА</p>
                            <p class="testimonial-author-company">РУКОВОДИТЕЛЬ ПРОЕКТА, СБЕРБАНК</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- History Section -->
    <section class="history-section section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">ИСТОРИЯ</h2>
                <p class="section-subtitle">25 лет в архитектуре</p>
            </div>
            <div class="history-timeline">
                <div class="history-item">
                    <div class="history-year">1999</div>
                    <div class="history-content">
                        <h3 class="history-event">Основание бюро</h3>
                        <p class="history-description">Начало работы в архитектуре</p>
                    </div>
                    <div class="history-connector"></div>
                </div>
                <div class="history-item">
                    <div class="history-year">2005</div>
                    <div class="history-content">
                        <h3 class="history-event">Первый крупный проект</h3>
                        <p class="history-description">Жилой комплекс в Москве</p>
                    </div>
                    <div class="history-connector"></div>
                </div>
                <div class="history-item">
                    <div class="history-year">2010</div>
                    <div class="history-content">
                        <h3 class="history-event">Международное признание</h3>
                        <p class="history-description">Проекты в 10 странах</p>
                    </div>
                    <div class="history-connector"></div>
                </div>
                <div class="history-item">
                    <div class="history-year">2015</div>
                    <div class="history-content">
                        <h3 class="history-event">Премия года</h3>
                        <p class="history-description">Лучшее архитектурное бюро</p>
                    </div>
                    <div class="history-connector"></div>
                </div>
                <div class="history-item">
                    <div class="history-year">2020</div>
                    <div class="history-content">
                        <h3 class="history-event">150+ проектов</h3>
                        <p class="history-description">Новый рубеж достижений</p>
                    </div>
                    <div class="history-connector"></div>
                </div>
                <div class="history-item">
                    <div class="history-year">2024</div>
                    <div class="history-content">
                        <h3 class="history-event">Современные технологии</h3>
                        <p class="history-description">Внедрение BIM и устойчивого дизайна</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Philosophy Section -->
    <section class="philosophy-section section">
        <div class="container">
            <div class="philosophy-content">
                <div class="philosophy-text">
                    <h2 class="philosophy-title">ФИЛОСОФИЯ</h2>
                    <div class="philosophy-description">
                        <p>
                            Мы верим в силу простоты. Каждая линия имеет значение.
                            Каждая форма выполняет функцию. Брутализм — это не грубость,
                            это честность материала и конструкции.
                        </p>
                        <p>
                            Наш подход основан на трех принципах: функциональность,
                            долговечность и эстетическая чистота. Мы создаем архитектуру,
                            которая стоит веками.
                        </p>
                    </div>
                </div>
                <div class="philosophy-visual brutal-grid"></div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section section">
        <div class="container">
            <div class="cta-content">
                <h2 class="cta-title">ГОТОВЫ НАЧАТЬ ПРОЕКТ?</h2>
                <p class="cta-description">
                    Свяжитесь с нами сегодня и обсудим ваши идеи.
                    Создадим пространство, которое формирует будущее.
                </p>
                <div class="cta-actions">
                    <a href="<?php echo esc_url(home_url('/contact')); ?>" class="btn btn-primary btn-large">
                        СВЯЗАТЬСЯ С НАМИ
                    </a>
                    <a href="<?php echo esc_url(home_url('/blog')); ?>" class="btn btn-secondary btn-large">
                        СМОТРЕТЬ РАБОТЫ
                    </a>
                </div>
            </div>
        </div>
    </section>
</div>

<?php
get_footer();
?>

