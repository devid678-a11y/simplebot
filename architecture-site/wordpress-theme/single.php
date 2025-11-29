<?php
/**
 * Шаблон отдельной записи блога
 */
get_header();
?>

<div class="article-page">
    <?php while (have_posts()) : the_post(); ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class('article'); ?>>
            <?php if (has_post_thumbnail()) : ?>
                <div class="article-hero">
                    <div class="article-hero-image" style="background-image: url('<?php echo esc_url(get_the_post_thumbnail_url(get_the_ID(), 'arch-bureau-hero')); ?>');"></div>
                    <div class="article-header-content">
                        <div class="container">
                            <a href="<?php echo esc_url(home_url('/blog')); ?>" class="article-back-link">← НАЗАД К БЛОГУ</a>
                            <div class="article-meta-header">
                                <?php
                                $categories = get_the_category();
                                if (!empty($categories)) :
                                ?>
                                    <span class="article-category-badge"><?php echo esc_html(strtoupper($categories[0]->name)); ?></span>
                                <?php endif; ?>
                                <span class="article-date"><?php echo strtoupper(get_the_date('d F Y')); ?></span>
                            </div>
                            <h1 class="article-title"><?php the_title(); ?></h1>
                            <div class="article-author">
                                <span><?php echo strtoupper(get_the_author()); ?></span>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <div class="article-content">
                <div class="container">
                    <?php if (!has_post_thumbnail()) : ?>
                        <header class="article-header">
                            <div class="article-meta">
                                <span class="article-date"><?php echo strtoupper(get_the_date('d F Y')); ?></span>
                                <?php
                                $categories = get_the_category();
                                if (!empty($categories)) :
                                ?>
                                    <span class="article-category"><?php echo esc_html(strtoupper($categories[0]->name)); ?></span>
                                <?php endif; ?>
                            </div>
                            <h1 class="article-title"><?php the_title(); ?></h1>
                            <div class="article-author">
                                <span><?php echo strtoupper(get_the_author()); ?></span>
                            </div>
                        </header>
                    <?php endif; ?>

                    <div class="article-body">
                        <?php the_content(); ?>
                    </div>

                    <?php
                    // Похожие записи
                    $related_posts = get_posts(array(
                        'category__in'   => wp_get_post_categories(get_the_ID()),
                        'posts_per_page' => 3,
                        'post__not_in'   => array(get_the_ID()),
                    ));

                    if (!empty($related_posts)) :
                    ?>
                        <div class="related-posts">
                            <h2 class="related-posts-title">ПОХОЖИЕ СТАТЬИ</h2>
                            <div class="related-posts-grid">
                                <?php foreach ($related_posts as $related_post) : setup_postdata($related_post); ?>
                                    <a href="<?php echo esc_url(get_permalink($related_post->ID)); ?>" class="related-post-card">
                                        <?php if (has_post_thumbnail($related_post->ID)) : ?>
                                            <div class="related-post-image" style="background-image: url('<?php echo esc_url(get_the_post_thumbnail_url($related_post->ID, 'arch-bureau-thumbnail')); ?>');"></div>
                                        <?php endif; ?>
                                        <div class="related-post-content">
                                            <span class="related-post-date"><?php echo strtoupper(get_the_date('d F Y', $related_post->ID)); ?></span>
                                            <h3 class="related-post-title"><?php echo get_the_title($related_post->ID); ?></h3>
                                        </div>
                                    </a>
                                <?php endforeach; ?>
                                <?php wp_reset_postdata(); ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </article>
    <?php endwhile; ?>
</div>

<?php
get_footer();
?>

