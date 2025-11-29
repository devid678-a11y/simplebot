<?php
/**
 * Arch Bureau Brutalism Theme Functions
 */

if (!defined('ABSPATH')) {
    exit;
}

// Подключение дополнительных файлов
require_once get_template_directory() . '/inc/customizer.php';
require_once get_template_directory() . '/inc/post-types.php';
require_once get_template_directory() . '/inc/meta-boxes.php';

/**
 * Настройка темы
 */
function arch_bureau_setup() {
    // Поддержка заголовка документа
    add_theme_support('title-tag');
    
    // Поддержка миниатюр записей
    add_theme_support('post-thumbnails');
    
    // Поддержка HTML5 разметки
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ));
    
    // Поддержка кастомных логотипов
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Регистрация меню
    register_nav_menus(array(
        'primary' => __('Главное меню', 'arch-bureau'),
        'footer'  => __('Меню в подвале', 'arch-bureau'),
    ));
}
add_action('after_setup_theme', 'arch_bureau_setup');

/**
 * Подключение стилей и скриптов
 */
function arch_bureau_scripts() {
    // Подключение Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Manrope:wght@200;300;400;600;700&family=DM+Sans:wght@400;600;700&display=swap', array(), null);
    
    // Основной стиль темы
    wp_enqueue_style('arch-bureau-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Дополнительные стили
    wp_enqueue_style('arch-bureau-main', get_template_directory_uri() . '/assets/css/main.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-header', get_template_directory_uri() . '/assets/css/header.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-footer', get_template_directory_uri() . '/assets/css/footer.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-home', get_template_directory_uri() . '/assets/css/home.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-blog', get_template_directory_uri() . '/assets/css/blog.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-contact', get_template_directory_uri() . '/assets/css/contact.css', array('arch-bureau-style'), '1.0.0');
    wp_enqueue_style('arch-bureau-article', get_template_directory_uri() . '/assets/css/article.css', array('arch-bureau-style'), '1.0.0');
    
    // Скрипты
    wp_enqueue_script('arch-bureau-main', get_template_directory_uri() . '/assets/js/main.js', array(), '1.0.0', true);
    
    // Локализация для AJAX (если нужно)
    wp_localize_script('arch-bureau-main', 'archBureau', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('arch_bureau_nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'arch_bureau_scripts');

/**
 * Регистрация областей виджетов
 */
function arch_bureau_widgets_init() {
    register_sidebar(array(
        'name'          => __('Боковая панель', 'arch-bureau'),
        'id'            => 'sidebar-1',
        'description'   => __('Виджеты для боковой панели', 'arch-bureau'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
    
    // Область для дополнительного контента на главной
    register_sidebar(array(
        'name'          => __('Дополнительный контент (главная)', 'arch-bureau'),
        'id'            => 'home-extra',
        'description'   => __('Виджеты для дополнительного контента на главной странице', 'arch-bureau'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));
}
add_action('widgets_init', 'arch_bureau_widgets_init');

/**
 * Кастомные размеры изображений
 */
function arch_bureau_image_sizes() {
    add_image_size('arch-bureau-hero', 1920, 1080, true);
    add_image_size('arch-bureau-project', 800, 600, true);
    add_image_size('arch-bureau-thumbnail', 400, 300, true);
}
add_action('after_setup_theme', 'arch_bureau_image_sizes');

/**
 * Удаление лишних элементов из head
 */
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');

/**
 * Обработка формы контактов
 */
function arch_bureau_handle_contact_form() {
    // Проверка nonce
    if (!isset($_POST['arch_bureau_nonce']) || !wp_verify_nonce($_POST['arch_bureau_nonce'], 'arch_bureau_contact_form')) {
        wp_die('Ошибка безопасности');
    }

    // Получение данных формы
    $name = sanitize_text_field($_POST['name']);
    $email = sanitize_email($_POST['email']);
    $phone = sanitize_text_field($_POST['phone']);
    $project = sanitize_text_field($_POST['project']);
    $message = sanitize_textarea_field($_POST['message']);

    // Валидация
    if (empty($name) || empty($email) || empty($message)) {
        wp_redirect(add_query_arg('contact', 'error', wp_get_referer()));
        exit;
    }

    // Отправка email
    $to = get_option('admin_email');
    $subject = 'Новое сообщение с сайта ' . get_bloginfo('name');
    $body = "Имя: $name\n";
    $body .= "Email: $email\n";
    $body .= "Телефон: $phone\n";
    $body .= "Тип проекта: $project\n\n";
    $body .= "Сообщение:\n$message";

    $headers = array('Content-Type: text/plain; charset=UTF-8', "From: $name <$email>");

    $sent = wp_mail($to, $subject, $body, $headers);

    if ($sent) {
        wp_redirect(add_query_arg('contact', 'success', wp_get_referer()));
    } else {
        wp_redirect(add_query_arg('contact', 'error', wp_get_referer()));
    }
    exit;
}
add_action('admin_post_arch_bureau_contact_form', 'arch_bureau_handle_contact_form');
add_action('admin_post_nopriv_arch_bureau_contact_form', 'arch_bureau_handle_contact_form');

