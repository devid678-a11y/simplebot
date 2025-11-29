<?php
/**
 * Настройки темы через WordPress Customizer
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Регистрация настроек Customizer
 */
function arch_bureau_customize_register($wp_customize) {
    
    // Секция: Контактная информация
    $wp_customize->add_section('arch_bureau_contacts', array(
        'title'    => __('Контактная информация', 'arch-bureau'),
        'priority' => 30,
    ));
    
    // Email
    $wp_customize->add_setting('arch_bureau_email', array(
        'default'           => 'info@archbureau.ru',
        'sanitize_callback' => 'sanitize_email',
    ));
    $wp_customize->add_control('arch_bureau_email', array(
        'label'   => __('Email', 'arch-bureau'),
        'section' => 'arch_bureau_contacts',
        'type'    => 'email',
    ));
    
    // Телефон
    $wp_customize->add_setting('arch_bureau_phone', array(
        'default'           => '+7 (495) 123-45-67',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('arch_bureau_phone', array(
        'label'   => __('Телефон', 'arch-bureau'),
        'section' => 'arch_bureau_contacts',
        'type'    => 'text',
    ));
    
    // Адрес
    $wp_customize->add_setting('arch_bureau_address', array(
        'default'           => 'МОСКВА, УЛ. АРХИТЕКТОРОВ, 15',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('arch_bureau_address', array(
        'label'   => __('Адрес', 'arch-bureau'),
        'section' => 'arch_bureau_contacts',
        'type'    => 'text',
    ));
    
    // Часы работы
    $wp_customize->add_setting('arch_bureau_hours', array(
        'default'           => 'ПН-ПТ: 10:00 - 19:00',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('arch_bureau_hours', array(
        'label'   => __('Часы работы', 'arch-bureau'),
        'section' => 'arch_bureau_contacts',
        'type'    => 'text',
    ));
    
    // Секция: Социальные сети
    $wp_customize->add_section('arch_bureau_social', array(
        'title'    => __('Социальные сети', 'arch-bureau'),
        'priority' => 31,
    ));
    
    // Instagram
    $wp_customize->add_setting('arch_bureau_instagram', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('arch_bureau_instagram', array(
        'label'   => __('Instagram URL', 'arch-bureau'),
        'section' => 'arch_bureau_social',
        'type'    => 'url',
    ));
    
    // Facebook
    $wp_customize->add_setting('arch_bureau_facebook', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('arch_bureau_facebook', array(
        'label'   => __('Facebook URL', 'arch-bureau'),
        'section' => 'arch_bureau_social',
        'type'    => 'url',
    ));
    
    // LinkedIn
    $wp_customize->add_setting('arch_bureau_linkedin', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('arch_bureau_linkedin', array(
        'label'   => __('LinkedIn URL', 'arch-bureau'),
        'section' => 'arch_bureau_social',
        'type'    => 'url',
    ));
    
    // Секция: Статистика на главной
    $wp_customize->add_section('arch_bureau_stats', array(
        'title'    => __('Статистика на главной', 'arch-bureau'),
        'priority' => 32,
    ));
    
    // Проекты
    $wp_customize->add_setting('arch_bureau_stats_projects', array(
        'default'           => '150',
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('arch_bureau_stats_projects', array(
        'label'   => __('Количество проектов', 'arch-bureau'),
        'section' => 'arch_bureau_stats',
        'type'    => 'number',
    ));
    
    // Лет опыта
    $wp_customize->add_setting('arch_bureau_stats_years', array(
        'default'           => '25',
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('arch_bureau_stats_years', array(
        'label'   => __('Лет опыта', 'arch-bureau'),
        'section' => 'arch_bureau_stats',
        'type'    => 'number',
    ));
    
    // Награды
    $wp_customize->add_setting('arch_bureau_stats_awards', array(
        'default'           => '50',
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('arch_bureau_stats_awards', array(
        'label'   => __('Количество наград', 'arch-bureau'),
        'section' => 'arch_bureau_stats',
        'type'    => 'number',
    ));
    
    // Страны
    $wp_customize->add_setting('arch_bureau_stats_countries', array(
        'default'           => '30',
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('arch_bureau_stats_countries', array(
        'label'   => __('Количество стран', 'arch-bureau'),
        'section' => 'arch_bureau_stats',
        'type'    => 'number',
    ));
    
    // Секция: Hero секция
    $wp_customize->add_section('arch_bureau_hero', array(
        'title'    => __('Hero секция (главная)', 'arch-bureau'),
        'priority' => 33,
    ));
    
    // Заголовок Hero
    $wp_customize->add_setting('arch_bureau_hero_title', array(
        'default'           => 'АРХИТЕКТУРА',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('arch_bureau_hero_title', array(
        'label'   => __('Заголовок', 'arch-bureau'),
        'section' => 'arch_bureau_hero',
        'type'    => 'text',
    ));
    
    // Подзаголовок Hero
    $wp_customize->add_setting('arch_bureau_hero_subtitle', array(
        'default'           => 'БЕЗ КОМПРОМИССОВ',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('arch_bureau_hero_subtitle', array(
        'label'   => __('Подзаголовок', 'arch-bureau'),
        'section' => 'arch_bureau_hero',
        'type'    => 'text',
    ));
    
    // Описание Hero
    $wp_customize->add_setting('arch_bureau_hero_description', array(
        'default'           => 'Создаем пространства, которые формируют будущее. Брутализм как философия дизайна. Чистота форм. Функциональность превыше всего.',
        'sanitize_callback' => 'sanitize_textarea_field',
    ));
    $wp_customize->add_control('arch_bureau_hero_description', array(
        'label'   => __('Описание', 'arch-bureau'),
        'section' => 'arch_bureau_hero',
        'type'    => 'textarea',
    ));
    
    // Фоновое изображение Hero
    $wp_customize->add_setting('arch_bureau_hero_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'arch_bureau_hero_image', array(
        'label'   => __('Фоновое изображение', 'arch-bureau'),
        'section' => 'arch_bureau_hero',
    )));
}
add_action('customize_register', 'arch_bureau_customize_register');

