<?php
/**
 * Функции темы OXEM
 */

// Подключение стилей и скриптов
function oxem_enqueue_scripts() {
    wp_enqueue_style('oxem-style', get_stylesheet_uri(), array(), '1.0.0');
    wp_enqueue_script('oxem-script', get_template_directory_uri() . '/js/script.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'oxem_enqueue_scripts');

// Регистрация меню
function oxem_register_menus() {
    register_nav_menus(array(
        'primary' => 'Главное меню',
        'footer' => 'Меню в футере'
    ));
}
add_action('init', 'oxem_register_menus');

// Поддержка миниатюр
add_theme_support('post-thumbnails');

// Поддержка HTML5
add_theme_support('html5', array(
    'search-form',
    'comment-form',
    'comment-list',
    'gallery',
    'caption'
));

// Кастомные поля для постов
function oxem_add_meta_boxes() {
    add_meta_box(
        'oxem_post_details',
        'Дополнительные поля',
        'oxem_post_meta_callback',
        'post',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'oxem_add_meta_boxes');

function oxem_post_meta_callback($post) {
    wp_nonce_field('oxem_save_meta', 'oxem_meta_nonce');
    
    $excerpt = get_post_meta($post->ID, '_oxem_excerpt', true);
    $featured_text = get_post_meta($post->ID, '_oxem_featured_text', true);
    $category_icon = get_post_meta($post->ID, '_oxem_category_icon', true);
    ?>
    
    <table class="form-table">
        <tr>
            <th><label for="oxem_excerpt">Краткое описание</label></th>
            <td>
                <textarea id="oxem_excerpt" name="oxem_excerpt" rows="3" cols="50" style="width: 100%;"><?php echo esc_attr($excerpt); ?></textarea>
                <p class="description">Краткое описание для отображения в списке статей</p>
            </td>
        </tr>
        <tr>
            <th><label for="oxem_featured_text">Выделенный текст</label></th>
            <td>
                <input type="text" id="oxem_featured_text" name="oxem_featured_text" value="<?php echo esc_attr($featured_text); ?>" style="width: 100%;" />
                <p class="description">Текст, который будет выделен в карточке статьи</p>
            </td>
        </tr>
        <tr>
            <th><label for="oxem_category_icon">Иконка категории</label></th>
            <td>
                <select id="oxem_category_icon" name="oxem_category_icon">
                    <option value="📰" <?php selected($category_icon, '📰'); ?>>📰 Новости</option>
                    <option value="📝" <?php selected($category_icon, '📝'); ?>>📝 Статьи</option>
                    <option value="💼" <?php selected($category_icon, '💼'); ?>>💼 Кейсы</option>
                    <option value="🎨" <?php selected($category_icon, '🎨'); ?>>🎨 Дизайн</option>
                    <option value="💡" <?php selected($category_icon, '💡'); ?>>💡 Идеи</option>
                </select>
                <p class="description">Выберите иконку для категории</p>
            </td>
        </tr>
    </table>
    
    <?php
}

function oxem_save_meta($post_id) {
    if (!isset($_POST['oxem_meta_nonce']) || !wp_verify_nonce($_POST['oxem_meta_nonce'], 'oxem_save_meta')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    if (isset($_POST['oxem_excerpt'])) {
        update_post_meta($post_id, '_oxem_excerpt', sanitize_textarea_field($_POST['oxem_excerpt']));
    }
    
    if (isset($_POST['oxem_featured_text'])) {
        update_post_meta($post_id, '_oxem_featured_text', sanitize_text_field($_POST['oxem_featured_text']));
    }
    
    if (isset($_POST['oxem_category_icon'])) {
        update_post_meta($post_id, '_oxem_category_icon', sanitize_text_field($_POST['oxem_category_icon']));
    }
}
add_action('save_post', 'oxem_save_meta');

// Кастомные типы постов
function oxem_create_post_types() {
    // Тип поста "Услуги"
    register_post_type('services', array(
        'labels' => array(
            'name' => 'Услуги',
            'singular_name' => 'Услуга',
            'add_new' => 'Добавить услугу',
            'add_new_item' => 'Добавить новую услугу',
            'edit_item' => 'Редактировать услугу',
            'new_item' => 'Новая услуга',
            'view_item' => 'Просмотреть услугу',
            'search_items' => 'Поиск услуг',
            'not_found' => 'Услуги не найдены',
            'not_found_in_trash' => 'В корзине услуг не найдено'
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-admin-tools',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'show_in_rest' => true
    ));
    
    // Тип поста "Кейсы"
    register_post_type('cases', array(
        'labels' => array(
            'name' => 'Кейсы',
            'singular_name' => 'Кейс',
            'add_new' => 'Добавить кейс',
            'add_new_item' => 'Добавить новый кейс',
            'edit_item' => 'Редактировать кейс',
            'new_item' => 'Новый кейс',
            'view_item' => 'Просмотреть кейс',
            'search_items' => 'Поиск кейсов',
            'not_found' => 'Кейсы не найдены',
            'not_found_in_trash' => 'В корзине кейсов не найдено'
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-portfolio',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'show_in_rest' => true
    ));
}
add_action('init', 'oxem_create_post_types');

// Кастомные таксономии
function oxem_create_taxonomies() {
    // Таксономия для услуг
    register_taxonomy('service_category', 'services', array(
        'labels' => array(
            'name' => 'Категории услуг',
            'singular_name' => 'Категория услуги',
            'search_items' => 'Поиск категорий',
            'all_items' => 'Все категории',
            'edit_item' => 'Редактировать категорию',
            'update_item' => 'Обновить категорию',
            'add_new_item' => 'Добавить новую категорию',
            'new_item_name' => 'Название новой категории',
            'menu_name' => 'Категории услуг'
        ),
        'hierarchical' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'show_in_rest' => true
    ));
}
add_action('init', 'oxem_create_taxonomies');

// Функция для получения иконки категории
function get_category_icon($category_name) {
    $icons = array(
        'Новости' => '📰',
        'Статьи' => '📝',
        'Кейсы' => '💼',
        'Дизайн' => '🎨',
        'Идеи' => '💡'
    );
    
    return isset($icons[$category_name]) ? $icons[$category_name] : '📄';
}

// Обработка формы обратной связи
function handle_contact_form() {
    if (isset($_POST['action']) && $_POST['action'] === 'submit_contact_form') {
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        $message = sanitize_textarea_field($_POST['message']);
        
        // Отправка email
        $to = get_option('admin_email');
        $subject = 'Новая заявка с сайта';
        $body = "Имя: $name\nEmail: $email\nТелефон: $phone\nСообщение: $message";
        
        wp_mail($to, $subject, $body);
        
        wp_die('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
    }
}
add_action('wp_ajax_submit_contact_form', 'handle_contact_form');
add_action('wp_ajax_nopriv_submit_contact_form', 'handle_contact_form');

// Кастомизация админ-панели
function oxem_customize_admin() {
    // Добавляем кастомные колонки для постов
    add_filter('manage_posts_columns', 'oxem_add_post_columns');
    add_action('manage_posts_custom_column', 'oxem_fill_post_columns', 10, 2);
}
add_action('admin_init', 'oxem_customize_admin');

function oxem_add_post_columns($columns) {
    $columns['excerpt'] = 'Краткое описание';
    $columns['featured_text'] = 'Выделенный текст';
    return $columns;
}

function oxem_fill_post_columns($column, $post_id) {
    switch ($column) {
        case 'excerpt':
            echo get_post_meta($post_id, '_oxem_excerpt', true);
            break;
        case 'featured_text':
            echo get_post_meta($post_id, '_oxem_featured_text', true);
            break;
    }
}

// Добавляем поддержку Gutenberg
add_theme_support('wp-block-styles');
add_theme_support('align-wide');
add_theme_support('editor-styles');
add_editor_style('editor-style.css');
?>
