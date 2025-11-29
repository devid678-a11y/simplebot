<?php
/**
 * Метабоксы для кастомных полей
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Добавление метабоксов
 */
function arch_bureau_add_meta_boxes() {
    // Метабокс для проектов
    add_meta_box(
        'project_details',
        __('Детали проекта', 'arch-bureau'),
        'arch_bureau_project_meta_box',
        'project',
        'normal',
        'high'
    );
    
    // Метабокс для команды
    add_meta_box(
        'team_details',
        __('Информация о члене команды', 'arch-bureau'),
        'arch_bureau_team_meta_box',
        'team',
        'normal',
        'high'
    );
    
    // Метабокс для услуг
    add_meta_box(
        'service_details',
        __('Детали услуги', 'arch-bureau'),
        'arch_bureau_service_meta_box',
        'service',
        'normal',
        'high'
    );
    
    // Метабокс для клиентов
    add_meta_box(
        'client_details',
        __('Информация о клиенте', 'arch-bureau'),
        'arch_bureau_client_meta_box',
        'client',
        'normal',
        'high'
    );
    
    // Метабокс для наград
    add_meta_box(
        'award_details',
        __('Детали награды', 'arch-bureau'),
        'arch_bureau_award_meta_box',
        'award',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'arch_bureau_add_meta_boxes');

/**
 * Метабокс для проектов
 */
function arch_bureau_project_meta_box($post) {
    wp_nonce_field('arch_bureau_save_meta', 'arch_bureau_meta_nonce');
    
    $location = get_post_meta($post->ID, '_project_location', true);
    $year = get_post_meta($post->ID, '_project_year', true);
    $category = get_post_meta($post->ID, '_project_category', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="project_location"><?php _e('Местоположение', 'arch-bureau'); ?></label></th>
            <td>
                <input type="text" id="project_location" name="project_location" value="<?php echo esc_attr($location); ?>" class="regular-text" />
                <p class="description"><?php _e('Например: МОСКВА, 2024', 'arch-bureau'); ?></p>
            </td>
        </tr>
        <tr>
            <th><label for="project_year"><?php _e('Год', 'arch-bureau'); ?></label></th>
            <td>
                <input type="number" id="project_year" name="project_year" value="<?php echo esc_attr($year); ?>" min="1900" max="2100" />
            </td>
        </tr>
        <tr>
            <th><label for="project_category"><?php _e('Категория', 'arch-bureau'); ?></label></th>
            <td>
                <select id="project_category" name="project_category">
                    <option value="RESIDENTIAL" <?php selected($category, 'RESIDENTIAL'); ?>>ЖИЛАЯ</option>
                    <option value="COMMERCIAL" <?php selected($category, 'COMMERCIAL'); ?>>КОММЕРЧЕСКАЯ</option>
                    <option value="CULTURAL" <?php selected($category, 'CULTURAL'); ?>>КУЛЬТУРНАЯ</option>
                    <option value="OTHER" <?php selected($category, 'OTHER'); ?>>ДРУГАЯ</option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Метабокс для команды
 */
function arch_bureau_team_meta_box($post) {
    wp_nonce_field('arch_bureau_save_meta', 'arch_bureau_meta_nonce');
    
    $role = get_post_meta($post->ID, '_team_role', true);
    $experience = get_post_meta($post->ID, '_team_experience', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="team_role"><?php _e('Должность', 'arch-bureau'); ?></label></th>
            <td>
                <input type="text" id="team_role" name="team_role" value="<?php echo esc_attr($role); ?>" class="regular-text" />
                <p class="description"><?php _e('Например: ГЛАВНЫЙ АРХИТЕКТОР', 'arch-bureau'); ?></p>
            </td>
        </tr>
        <tr>
            <th><label for="team_experience"><?php _e('Опыт работы', 'arch-bureau'); ?></label></th>
            <td>
                <input type="text" id="team_experience" name="team_experience" value="<?php echo esc_attr($experience); ?>" class="regular-text" />
                <p class="description"><?php _e('Например: 15 ЛЕТ', 'arch-bureau'); ?></p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Метабокс для услуг
 */
function arch_bureau_service_meta_box($post) {
    wp_nonce_field('arch_bureau_save_meta', 'arch_bureau_meta_nonce');
    
    $number = get_post_meta($post->ID, '_service_number', true);
    $description = get_post_meta($post->ID, '_service_description', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="service_number"><?php _e('Номер услуги', 'arch-bureau'); ?></label></th>
            <td>
                <input type="text" id="service_number" name="service_number" value="<?php echo esc_attr($number); ?>" class="small-text" />
                <p class="description"><?php _e('Например: 01, 02, 03', 'arch-bureau'); ?></p>
            </td>
        </tr>
        <tr>
            <th><label for="service_description"><?php _e('Краткое описание', 'arch-bureau'); ?></label></th>
            <td>
                <textarea id="service_description" name="service_description" rows="3" class="large-text"><?php echo esc_textarea($description); ?></textarea>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Метабокс для клиентов
 */
function arch_bureau_client_meta_box($post) {
    wp_nonce_field('arch_bureau_save_meta', 'arch_bureau_meta_nonce');
    
    $website = get_post_meta($post->ID, '_client_website', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="client_website"><?php _e('Сайт клиента', 'arch-bureau'); ?></label></th>
            <td>
                <input type="url" id="client_website" name="client_website" value="<?php echo esc_url($website); ?>" class="regular-text" />
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Метабокс для наград
 */
function arch_bureau_award_meta_box($post) {
    wp_nonce_field('arch_bureau_save_meta', 'arch_bureau_meta_nonce');
    
    $year = get_post_meta($post->ID, '_award_year', true);
    $description = get_post_meta($post->ID, '_award_description', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="award_year"><?php _e('Год награды', 'arch-bureau'); ?></label></th>
            <td>
                <input type="number" id="award_year" name="award_year" value="<?php echo esc_attr($year); ?>" min="1900" max="2100" />
            </td>
        </tr>
        <tr>
            <th><label for="award_description"><?php _e('Описание', 'arch-bureau'); ?></label></th>
            <td>
                <textarea id="award_description" name="award_description" rows="3" class="large-text"><?php echo esc_textarea($description); ?></textarea>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Сохранение метабоксов
 */
function arch_bureau_save_meta($post_id) {
    // Проверка nonce
    if (!isset($_POST['arch_bureau_meta_nonce']) || !wp_verify_nonce($_POST['arch_bureau_meta_nonce'], 'arch_bureau_save_meta')) {
        return;
    }
    
    // Проверка автосохранения
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Проверка прав
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Сохранение полей проектов
    if (isset($_POST['project_location'])) {
        update_post_meta($post_id, '_project_location', sanitize_text_field($_POST['project_location']));
    }
    if (isset($_POST['project_year'])) {
        update_post_meta($post_id, '_project_year', sanitize_text_field($_POST['project_year']));
    }
    if (isset($_POST['project_category'])) {
        update_post_meta($post_id, '_project_category', sanitize_text_field($_POST['project_category']));
    }
    
    // Сохранение полей команды
    if (isset($_POST['team_role'])) {
        update_post_meta($post_id, '_team_role', sanitize_text_field($_POST['team_role']));
    }
    if (isset($_POST['team_experience'])) {
        update_post_meta($post_id, '_team_experience', sanitize_text_field($_POST['team_experience']));
    }
    
    // Сохранение полей услуг
    if (isset($_POST['service_number'])) {
        update_post_meta($post_id, '_service_number', sanitize_text_field($_POST['service_number']));
    }
    if (isset($_POST['service_description'])) {
        update_post_meta($post_id, '_service_description', sanitize_textarea_field($_POST['service_description']));
    }
    
    // Сохранение полей клиентов
    if (isset($_POST['client_website'])) {
        update_post_meta($post_id, '_client_website', esc_url_raw($_POST['client_website']));
    }
    
    // Сохранение полей наград
    if (isset($_POST['award_year'])) {
        update_post_meta($post_id, '_award_year', sanitize_text_field($_POST['award_year']));
    }
    if (isset($_POST['award_description'])) {
        update_post_meta($post_id, '_award_description', sanitize_textarea_field($_POST['award_description']));
    }
}
add_action('save_post', 'arch_bureau_save_meta');

