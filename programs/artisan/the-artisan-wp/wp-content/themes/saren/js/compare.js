(function ($) {
    "use strict";

    $(document).on("click", ".pe-compare-btn , .remove-compare", function (e) {
        e.preventDefault();
        let productId = $(this).data("product-id");
        let btn = $(this);
        let widgetSettings;

        if ($('.pe--compare--container').length) {
            widgetSettings = $('.pe--compare--container').parents('.elementor-element').data('settings') || {};
        } else {
            widgetSettings = [];
        }

        btn.addClass("loading");

        let isLoggedIn = woocommerce_params.is_user_logged_in === "1";

        $.ajax({
            url: woocommerce_params.ajax_url,
            type: "POST",
            data: {
                action: "pe_toggle_compare",
                product_id: productId,
                settings: widgetSettings
            },
            dataType: "json",
            success: function (data) {
                if (data.success) {
                    btn.removeClass("loading");
                    document.dispatchEvent(new CustomEvent("compareUpdated"));

                    setTimeout(() => {
                        if (data.data.status === "added") {
                            btn.addClass("in--compare");

                            if (document.querySelector('.pe--compare--container')) {
                                var parser = new DOMParser(),
                                    responseHTML = parser.parseFromString(data.data.product_html, 'text/html'),
                                    productHtml = responseHTML.querySelector('.saren--single--product');

                                if (productHtml) {
                                    document.querySelector('.pe--compare--items--wrap').insertAdjacentHTML('beforeend', productHtml.outerHTML);
                                }
                            }

                        } else if (data.data.status === "removed") {

                            btn.removeClass("in--compare");

                            if (document.querySelector('.pe--compare--container')) {
                                document.querySelectorAll('.pe--compare--container').forEach(compareCont => {
                                    compareCont.querySelector('.post-' + productId).remove();
                                });
                            }

                        }
                    }, 10);
                }
            },
            error: function (response) {
                console.log(response.error);
            }
        });

    });

    // function getCompareCookie() {
    //     let cookieValue = document.cookie
    //         .split("; ")
    //         .find((row) => row.startsWith("pe_compare="));

    //     return cookieValue ? JSON.parse(decodeURIComponent(cookieValue.split("=")[1])) : [];
    // }

    // function setcompareCookie(compare) {
    //     document.cookie = `pe_compare=${encodeURIComponent(JSON.stringify(compare))}; path=/; max-age=${30 * 24 * 60 * 60}`;
    // }




}(jQuery));
