<?php
/**
 * Шаблон архива
 */
get_header();
?>

<div class="blog-page">
    <div class="blog-hero">
        <div class="container">
            <h1 class="blog-hero-title">
                <?php
                if (is_category()) {
                    echo strtoupper(single_cat_title('', false));
                } elseif (is_tag()) {
                    echo strtoupper(single_tag_title('', false));
                } elseif (is_author()) {
                    echo strtoupper(get_the_author());
                } elseif (is_date()) {
                    echo strtoupper(get_the_date('F Y'));
                } else {
                    echo 'АРХИВ';
                }
                ?>
            </h1>
            <p class="blog-hero-subtitle">
                <?php
                if (is_category()) {
                    echo category_description();
                } elseif (is_tag()) {
                    echo tag_description();
                } else {
                    echo 'Архив записей';
                }
                ?>
            </p>
        </div>
    </div>

    <div class="blog-content section">
        <div class="container">
            <?php if (have_posts()) : ?>
                <div class="blog-posts">
                    <?php while (have_posts()) : the_post(); ?>
                        <article id="post-<?php the_ID(); ?>" <?php post_class('blog-post'); ?>>
                            <a href="<?php the_permalink(); ?>" class="blog-post-link">
                                <?php if (has_post_thumbnail()) : ?>
                                    <div class="post-image-wrapper">
                                        <div class="post-image" style="background-image: url('<?php echo esc_url(get_the_post_thumbnail_url(get_the_ID(), 'large')); ?>');"></div>
                                        <?php
                                        $categories = get_the_category();
                                        if (!empty($categories)) :
                                        ?>
                                            <div class="post-category-badge"><?php echo esc_html(strtoupper($categories[0]->name)); ?></div>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>
                                
                                <div class="post-content">
                                    <div class="post-meta">
                                        <span class="post-date"><?php echo strtoupper(get_the_date('d F Y')); ?></span>
                                    </div>
                                    <h2 class="post-title"><?php the_title(); ?></h2>
                                    <div class="post-excerpt">
                                        <?php the_excerpt(); ?>
                                    </div>
                                    <span class="post-read-more">ЧИТАТЬ →</span>
                                </div>
                            </a>
                        </article>
                    <?php endwhile; ?>
                </div>

                <?php
                // Пагинация
                the_posts_pagination(array(
                    'mid_size'  => 2,
                    'prev_text' => '←',
                    'next_text' => '→',
                ));
                ?>
            <?php else : ?>
                <div style="text-align: center; padding: 60px 0;">
                    <p>Постов не найдено</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php
get_footer();
?>

