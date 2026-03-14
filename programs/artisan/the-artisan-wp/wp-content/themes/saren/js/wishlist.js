(function ($) {
    "use strict";

    $(document).on("click", ".pe-wishlist-btn", function (e) {
        e.preventDefault();
        let productId = $(this).data("product-id");
        let btn = $(this);
        let widgetSettings;

        if ($('.pe--wishlist.archive-products-section').length) {
            widgetSettings = $('.pe--wishlist.archive-products-section').parents('.elementor-element').data('settings') || {};
        } else {
            widgetSettings = [];
        }

        btn.addClass("loading");

        // let wishlist = getWishlistCookie();

        // if (wishlist.includes(productId)) {
        //     wishlist = wishlist.filter((id) => id !== productId);
        
        // } else {
        //     wishlist.push(productId);
           
        // }
        // setWishlistCookie(wishlist);
        // console.log(wishlist)

        // let isLoggedIn = woocommerce_params.is_user_logged_in === "1";
       
            $.ajax({
                url: woocommerce_params.ajax_url,
                type: "POST",
                data: {
                    action: "pe_toggle_wishlist",
                    product_id: productId,
                    settings: widgetSettings
                },
                dataType: "json",
                success: function (data) {
                  
                    if (data.success) {
                        btn.removeClass("loading");
                        document.dispatchEvent(new CustomEvent("wishlistUpdated"));

                        setTimeout(() => {
                            if (data.data.status === "added") {
                                btn.addClass("in--wishlist");

                                if (document.querySelector('.pe--wishlist.archive-products-section')) {
                                    var parser = new DOMParser(),
                                        responseHTML = parser.parseFromString(data.data.product_html, 'text/html'),
                                        productHtml = responseHTML.querySelector('.saren--single--product');

                                    if (productHtml) {
                                        document.querySelector('.pe--wishlist.archive-products-section .saren--products-grid').insertAdjacentHTML('beforeend', productHtml.outerHTML);
                                    }
                                }

                            } else if (data.data.status === "removed") {

                                btn.removeClass("in--wishlist");

                                if (document.querySelector('.pe--wishlist.archive-products-section')) {
                                    document.querySelectorAll('.pe--wishlist.archive-products-section').forEach(wishlist => {
                                        wishlist.querySelector('.post-' + productId).remove();
                                    });
                                }

                            }
                        }, 10);
                    }
                },
                error: function (response) {
                    console.log(response);
                }
            });
       
       
    });

    // function getWishlistCookie() {
    //     let cookieValue = document.cookie
    //         .split("; ")
    //         .find((row) => row.startsWith("pe_wishlist="));

    //     return cookieValue ? JSON.parse(decodeURIComponent(cookieValue.split("=")[1])) : [];
    // }

    // function setWishlistCookie(wishlist) {
    //     document.cookie = `pe_wishlist=${encodeURIComponent(JSON.stringify(wishlist))}; path=/; max-age=${30 * 24 * 60 * 60}`;
    // }




}(jQuery));
