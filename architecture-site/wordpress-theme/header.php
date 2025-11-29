<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="app">
    <!-- Progress Bar -->
    <div class="progress-bar-container">
        <div class="progress-bar" id="progressBar"></div>
    </div>

    <!-- Header -->
    <header class="header" id="header">
        <div class="container">
            <div class="header-content">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="logo">
                    <span class="logo-main">ARCH</span>
                    <span class="logo-sub">BUREAU</span>
                </a>
                
                <nav class="nav" id="mainNav">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'primary',
                        'container'      => false,
                        'menu_class'     => 'nav-menu',
                        'fallback_cb'    => 'arch_bureau_fallback_menu',
                        'items_wrap'     => '<ul class="%2$s">%3$s</ul>',
                    ));
                    ?>
                </nav>

                <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </div>
    </header>

    <main>

