<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?><?php bloginfo('name'); ?></title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<!-- Header Section -->
<header class="navbar">
    <div class="nav-container">
        <!-- Logo -->
        <div class="nav-logo">
            <a href="<?php echo home_url(); ?>" class="logo-link">
                <span class="logo-circle">O</span>
                <span class="logo-text">XEM</span>
            </a>
        </div>

        <!-- Navigation -->
        <nav class="nav">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'menu_class' => 'nav-list',
                'container' => false,
                'fallback_cb' => 'default_menu'
            ));
            ?>
        </nav>

        <!-- CTA Button -->
        <div class="header-cta">
            <a href="#contact" class="cta-button">Работать с нами</a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu">
        <nav class="mobile-nav">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'menu_class' => 'mobile-nav-list',
                'container' => false,
                'fallback_cb' => 'default_mobile_menu'
            ));
            ?>
        </nav>
    </div>
</header>

<?php
// Функция для дефолтного меню
function default_menu() {
    echo '<ul class="nav-list">';
    echo '<li><a href="' . home_url() . '" class="nav-link">Главная</a></li>';
    echo '<li><a href="' . home_url('/services') . '" class="nav-link">Услуги</a></li>';
    echo '<li><a href="' . home_url('/cases') . '" class="nav-link">Кейсы</a></li>';
    echo '<li><a href="' . home_url('/about') . '" class="nav-link">О компании</a></li>';
    echo '<li><a href="' . home_url('/contact') . '" class="nav-link">Контакты</a></li>';
    echo '</ul>';
}

// Функция для мобильного меню
function default_mobile_menu() {
    echo '<ul class="mobile-nav-list">';
    echo '<li><a href="' . home_url() . '" class="mobile-nav-link">Главная</a></li>';
    echo '<li><a href="' . home_url('/services') . '" class="mobile-nav-link">Услуги</a></li>';
    echo '<li><a href="' . home_url('/cases') . '" class="mobile-nav-link">Кейсы</a></li>';
    echo '<li><a href="' . home_url('/about') . '" class="mobile-nav-link">О компании</a></li>';
    echo '<li><a href="' . home_url('/contact') . '" class="mobile-nav-link">Контакты</a></li>';
    echo '<li><a href="#work" class="mobile-nav-link cta-mobile">Работать с нами</a></li>';
    echo '</ul>';
}
?>
