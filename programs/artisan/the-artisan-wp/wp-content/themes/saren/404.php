<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package Saren
 */
$option = get_option('pe-redux');
get_header();
?>

<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <?php if (isset($option['404_page_template'])) {

        $id = $option['404_page_template'];

        if (function_exists('icl_object_id')) {
            $id = icl_object_id($id, 'elementor_library', true, ICL_LANGUAGE_CODE);
        }

        echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($id);

    } else { ?>

        <div class="pe-section">

            <div class="pe-wrapper">

                <div class="pe-col-12">

                    <section class="error-404 not-found">
                        <header class="page-header">
                            <h1 class="page-title"><?php esc_html_e('Oops! That page can&rsquo;t be found.', 'saren'); ?>
                            </h1>
                        </header><!-- .page-header -->

                        <div class="page-content">
                            <p><?php esc_html_e('It looks like nothing was found at this location. Maybe try one of the links below or a search?', 'saren'); ?>
                            </p>

                            <?php
                            get_search_form();
                            ?>


                        </div><!-- .page-content -->
                    </section><!-- .error-404 -->


                </div>

            </div>

        </div>

    <?php } ?>

</main><!-- #main -->

<?php

get_footer();