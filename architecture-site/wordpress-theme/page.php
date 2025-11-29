<?php
/**
 * Шаблон страниц
 */
get_header();
?>

<?php while (have_posts()) : the_post(); ?>
    <?php
    $page_slug = get_post_field('post_name', get_post());
    
    // Если это страница контактов, используем специальный шаблон
    if ($page_slug === 'contact') {
        get_template_part('template-parts/page', 'contact');
    } else {
    ?>
        <div class="page-content">
            <div class="page-hero">
                <div class="container">
                    <h1 class="page-title"><?php the_title(); ?></h1>
                </div>
            </div>

            <div class="page-body section">
                <div class="container">
                    <div class="page-content-wrapper">
                        <?php the_content(); ?>
                    </div>
                </div>
            </div>
        </div>
    <?php } ?>
<?php endwhile; ?>

<?php
get_footer();
?>

