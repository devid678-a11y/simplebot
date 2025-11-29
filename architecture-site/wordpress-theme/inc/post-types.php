<?php
/**
 * Кастомные типы записей
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Регистрация кастомных типов записей
 */
function arch_bureau_register_post_types() {
    
    // Проекты
    register_post_type('project', array(
        'labels' => array(
            'name'               => __('Проекты', 'arch-bureau'),
            'singular_name'     => __('Проект', 'arch-bureau'),
            'add_new'            => __('Добавить проект', 'arch-bureau'),
            'add_new_item'       => __('Добавить новый проект', 'arch-bureau'),
            'edit_item'          => __('Редактировать проект', 'arch-bureau'),
            'new_item'           => __('Новый проект', 'arch-bureau'),
            'view_item'          => __('Просмотреть проект', 'arch-bureau'),
            'search_items'       => __('Искать проекты', 'arch-bureau'),
            'not_found'          => __('Проекты не найдены', 'arch-bureau'),
            'not_found_in_trash' => __('В корзине проектов не найдено', 'arch-bureau'),
        ),
        'public'       => true,
        'has_archive'  => true,
        'menu_icon'    => 'dashicons-building',
        'supports'     => array('title', 'editor', 'thumbnail', 'excerpt'),
        'rewrite'      => array('slug' => 'projects'),
        'show_in_rest' => true,
    ));
    
    // Команда
    register_post_type('team', array(
        'labels' => array(
            'name'               => __('Команда', 'arch-bureau'),
            'singular_name'     => __('Член команды', 'arch-bureau'),
            'add_new'            => __('Добавить члена команды', 'arch-bureau'),
            'add_new_item'       => __('Добавить нового члена команды', 'arch-bureau'),
            'edit_item'          => __('Редактировать члена команды', 'arch-bureau'),
            'new_item'           => __('Новый член команды', 'arch-bureau'),
            'view_item'          => __('Просмотреть члена команды', 'arch-bureau'),
            'search_items'       => __('Искать команду', 'arch-bureau'),
            'not_found'          => __('Члены команды не найдены', 'arch-bureau'),
            'not_found_in_trash' => __('В корзине членов команды не найдено', 'arch-bureau'),
        ),
        'public'       => true,
        'has_archive'  => false,
        'menu_icon'    => 'dashicons-groups',
        'supports'     => array('title', 'editor', 'thumbnail'),
        'show_in_rest' => true,
    ));
    
    // Услуги
    register_post_type('service', array(
        'labels' => array(
            'name'               => __('Услуги', 'arch-bureau'),
            'singular_name'     => __('Услуга', 'arch-bureau'),
            'add_new'            => __('Добавить услугу', 'arch-bureau'),
            'add_new_item'       => __('Добавить новую услугу', 'arch-bureau'),
            'edit_item'          => __('Редактировать услугу', 'arch-bureau'),
            'new_item'           => __('Новая услуга', 'arch-bureau'),
            'view_item'          => __('Просмотреть услугу', 'arch-bureau'),
            'search_items'       => __('Искать услуги', 'arch-bureau'),
            'not_found'          => __('Услуги не найдены', 'arch-bureau'),
            'not_found_in_trash' => __('В корзине услуг не найдено', 'arch-bureau'),
        ),
        'public'       => true,
        'has_archive'  => false,
        'menu_icon'    => 'dashicons-admin-tools',
        'supports'     => array('title', 'editor', 'thumbnail'),
        'show_in_rest' => true,
    ));
    
    // Клиенты
    register_post_type('client', array(
        'labels' => array(
            'name'               => __('Клиенты', 'arch-bureau'),
            'singular_name'     => __('Клиент', 'arch-bureau'),
            'add_new'            => __('Добавить клиента', 'arch-bureau'),
            'add_new_item'      => __('Добавить нового клиента', 'arch-bureau'),
            'edit_item'         => __('Редактировать клиента', 'arch-bureau'),
            'new_item'          => __('Новый клиент', 'arch-bureau'),
            'view_item'         => __('Просмотреть клиента', 'arch-bureau'),
            'search_items'      => __('Искать клиентов', 'arch-bureau'),
            'not_found'         => __('Клиенты не найдены', 'arch-bureau'),
            'not_found_in_trash' => __('В корзине клиентов не найдено', 'arch-bureau'),
        ),
        'public'       => true,
        'has_archive'  => false,
        'menu_icon'    => 'dashicons-businessman',
        'supports'     => array('title', 'thumbnail'),
        'show_in_rest' => true,
    ));
    
    // Награды
    register_post_type('award', array(
        'labels' => array(
            'name'               => __('Награды', 'arch-bureau'),
            'singular_name'     => __('Награда', 'arch-bureau'),
            'add_new'            => __('Добавить награду', 'arch-bureau'),
            'add_new_item'      => __('Добавить новую награду', 'arch-bureau'),
            'edit_item'         => __('Редактировать награду', 'arch-bureau'),
            'new_item'          => __('Новая награда', 'arch-bureau'),
            'view_item'         => __('Просмотреть награду', 'arch-bureau'),
            'search_items'      => __('Искать награды', 'arch-bureau'),
            'not_found'         => __('Награды не найдены', 'arch-bureau'),
            'not_found_in_trash' => __('В корзине наград не найдено', 'arch-bureau'),
        ),
        'public'       => true,
        'has_archive'  => false,
        'menu_icon'    => 'dashicons-awards',
        'supports'     => array('title', 'editor', 'thumbnail'),
        'show_in_rest' => true,
    ));
}
add_action('init', 'arch_bureau_register_post_types');

/**
 * Регистрация таксономий для проектов
 */
function arch_bureau_register_taxonomies() {
    // Категории проектов
    register_taxonomy('project_category', 'project', array(
        'labels' => array(
            'name'              => __('Категории проектов', 'arch-bureau'),
            'singular_name'     => __('Категория проекта', 'arch-bureau'),
            'search_items'       => __('Искать категории', 'arch-bureau'),
            'all_items'          => __('Все категории', 'arch-bureau'),
            'edit_item'          => __('Редактировать категорию', 'arch-bureau'),
            'update_item'        => __('Обновить категорию', 'arch-bureau'),
            'add_new_item'       => __('Добавить новую категорию', 'arch-bureau'),
            'new_item_name'      => __('Название новой категории', 'arch-bureau'),
        ),
        'hierarchical' => true,
        'show_in_rest' => true,
    ));
}
add_action('init', 'arch_bureau_register_taxonomies');

