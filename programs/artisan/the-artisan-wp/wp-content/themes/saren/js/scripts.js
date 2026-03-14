(function ($) {
	"use strict";

	gsap.registerPlugin(DrawSVGPlugin, Draggable, ScrollTrigger, ScrollToPlugin, InertiaPlugin, Flip, SplitText);

	gsap.config({
		nullTargetWarn: false
	});

	const isRTL = document.documentElement.dir === "rtl";


	function loadGoogleMapsApi(apiKey) {
		if (!window.google || !window.google.maps) {
			var script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
			script.async = true;
			script.defer = true;
			script.onload = function () {
				document.dispatchEvent(new Event('googleMapsLoaded'));
			};
			document.head.appendChild(script);
		} else {
			document.dispatchEvent(new Event('googleMapsLoaded'));
		}
	}

	window.addEventListener('elementor/frontend/init', function () {

		setTimeout(() => {

			if (document.querySelector('#pe--google--map') || document.body.classList.contains('e-preview--show-hidden-elements')) {
				var apiKeyMetaTag = document.querySelector('meta[name="google-maps-api-key"]');

				if (apiKeyMetaTag) {
					var apiKey = apiKeyMetaTag.getAttribute('content');
					loadGoogleMapsApi(apiKey);
				}
			}

		}, 1);


	});


	const noise = () => {
		let canvas, ctx;

		let wWidth, wHeight;

		let noiseData = [];
		let frame = 0;

		let loopTimeout;


		// Create Noise
		const createNoise = () => {
			const idata = ctx.createImageData(wWidth, wHeight);
			const buffer32 = new Uint32Array(idata.data.buffer);
			const len = buffer32.length;

			for (let i = 0; i < len; i++) {
				if (Math.random() < 0.5) {
					buffer32[i] = 0xfffffff0;
				}
			}
			noiseData.push(idata);
		};


		// Play Noise
		const paintNoise = () => {
			if (frame === 9) {
				frame = 0;
			} else {
				frame++;
			}

			ctx.putImageData(noiseData[frame], 0, 0);
		};


		// Loop
		const loop = () => {
			paintNoise(frame);

			loopTimeout = window.setTimeout(() => {
				window.requestAnimationFrame(loop);
			}, (1000 / 25));
		};


		// Setup
		const setup = () => {
			wWidth = window.innerWidth;
			wHeight = window.innerHeight;

			canvas.width = wWidth;
			canvas.height = wHeight;

			for (let i = 0; i < 10; i++) {
				createNoise();
			}

			loop();
		};


		// Reset
		let resizeThrottle;
		const reset = () => {
			window.addEventListener('resize', () => {
				window.clearTimeout(resizeThrottle);

				resizeThrottle = window.setTimeout(() => {
					window.clearTimeout(loopTimeout);
					setup();
				}, 200);
			}, false);
		};


		// Init
		const init = (() => {
			canvas = document.getElementById('bg--noise');
			ctx = canvas.getContext('2d');

			setup();
		})();
	};

	if (document.querySelector('#bg--noise')) {
		noise();
	}


	// Global Preferences
	var buttonStyle = 'underlined';

	// Global Element Variables
	var html = document.querySelector('html'),
		body = document.querySelector('body');

	var mobileQuery = window.matchMedia('(max-width: 500px)'),
		siteHeader = $('.site-header'),
		matchMedia = gsap.matchMedia(),
		isPhone = '(max-width: 450px)',
		isTablet = '(min-width: 450px) and (max-width: 900px)',
		isDesktop = '(min-width: 900px)';


	var keys = {
		37: 1,
		38: 1,
		39: 1,
		40: 1
	};

	function preventDefault(e) {
		e.preventDefault();
	}

	function preventDefaultForScrollKeys(e) {
		if (keys[e.keyCode]) {
			preventDefault(e);
			return false;
		}
	}

	var supportsPassive = false;
	try {
		window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
			get: function () {
				supportsPassive = true;
			}
		}));
	} catch (e) { }

	var wheelOpt = supportsPassive ? {
		passive: false
	} : false;
	var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

	function disableScroll() {
		if (sarenLenis) {
			sarenLenis.stop();
		} else {
			window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
			window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
			window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
			window.addEventListener('keydown', preventDefaultForScrollKeys, false);
		}
	}

	function enableScroll() {
		if (sarenLenis) {
			sarenLenis.start();
		} else {
			window.removeEventListener('DOMMouseScroll', preventDefault, false);
			window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
			window.removeEventListener('touchmove', preventDefault, wheelOpt);
			window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
		}
	}


	function peCustomSelect() {

		var selectWrappers = document.getElementsByClassName("pe-select");
		var totalSelects = selectWrappers.length;


		for (var i = 0; i < totalSelects; i++) {
			var originalSelect = selectWrappers[i].getElementsByTagName("select")[0];
			var totalOptions = originalSelect.length;

			var selectedDiv = document.createElement("DIV");
			selectedDiv.setAttribute("class", "select-selected");
			selectedDiv.innerHTML = originalSelect.options[originalSelect.selectedIndex].innerHTML;
			selectedDiv.setAttribute('data-select', originalSelect.options[originalSelect.selectedIndex].innerHTML);
			selectWrappers[i].appendChild(selectedDiv);

			var optionsListDiv = document.createElement("DIV");
			optionsListDiv.setAttribute("class", "select-items select-hide");

			for (var j = 1; j < totalOptions; j++) {
				var optionDiv = document.createElement("DIV");
				optionDiv.innerHTML = originalSelect.options[j].innerHTML;

				optionDiv.addEventListener("click", function (e) {
					var selectElement = this.parentNode.parentNode.getElementsByTagName("select")[0];
					var totalOptionsInSelect = selectElement.length;
					var selectedDivInThis = this.parentNode.previousSibling;

					for (var k = 0; k < totalOptionsInSelect; k++) {
						if (selectElement.options[k].innerHTML == this.innerHTML) {
							selectElement.selectedIndex = k;
							selectedDivInThis.innerHTML = this.innerHTML;
							selectedDivInThis.setAttribute('data-select', this.innerHTML);

							var previouslySelected = this.parentNode.getElementsByClassName("same-as-selected");
							var totalSelected = previouslySelected.length;
							for (var l = 0; l < totalSelected; l++) {
								previouslySelected[l].removeAttribute("class");
							}
							this.setAttribute("class", "same-as-selected");

							var event = new Event('change', { bubbles: true });
							selectElement.dispatchEvent(event);

							break;
						}
					}

					selectedDivInThis.click();
				});
				optionsListDiv.appendChild(optionDiv);
			}
			selectWrappers[i].appendChild(optionsListDiv);

			selectedDiv.addEventListener("click", function (e) {
				e.stopPropagation();
				closeAllSelect(this);
				this.nextSibling.classList.toggle("select-hide");
				this.classList.toggle("select-arrow-active");
			});
		}

		function closeAllSelect(exceptThis) {
			var allOptionsDiv = document.getElementsByClassName("select-items");
			var allSelectedDivs = document.getElementsByClassName("select-selected");
			var totalOptionsDivs = allOptionsDiv.length;
			var totalSelectedDivs = allSelectedDivs.length;
			var openSelectIndexes = [];


			for (var i = 0; i < totalSelectedDivs; i++) {
				if (exceptThis == allSelectedDivs[i]) {
					openSelectIndexes.push(i);
				} else {
					allSelectedDivs[i].classList.remove("select-arrow-active");
				}
			}

			for (var i = 0; i < totalOptionsDivs; i++) {
				if (openSelectIndexes.indexOf(i) == -1) {
					allOptionsDiv[i].classList.add("select-hide");
				}
			}
		}

		document.addEventListener("click", closeAllSelect);
	}

	function parents(element, selector) {
		const parentsArray = [];
		let currentElement = element.parentElement;

		while (currentElement !== null) {
			if (currentElement.matches(selector)) {
				parentsArray.push(currentElement);
			}
			currentElement = currentElement.parentElement;
		}

		return parentsArray;
	}

	function clearProps(target) {
		gsap.set(target, {
			clearProps: 'all'
		})
	}

	function saren_quantityControl(item) {
		if (!item.querySelector('.input-text.qty') || !item.querySelector('.saren--quantity--control')) {
			return false;

		}

		let qty = item.querySelector('.input-text.qty'),
			max = parseInt(qty.max),
			min = parseInt(qty.min),
			val = parseInt(qty.value),
			control = item.querySelector('.saren--quantity--control'),
			decrease = control.querySelector('.quantity--decrease'),
			increase = control.querySelector('.quantity--increase'),
			current = control.querySelector('.current--quantity'),
			updateButton = document.querySelector('.saren--update--cart');

		increase.addEventListener('click', () => {

			val++;
			val >= max ? val = max : '';
			current.innerHTML = val;
			qty.value = val;
			updateButton.removeAttribute('disabled');
			updateButton.click();

		})

		decrease.addEventListener('click', () => {

			val--
			val <= min ? val = min : '';
			current.innerHTML = val;
			qty.value = val;
			updateButton.removeAttribute('disabled');
			updateButton.click();
		})

	}

	function saren_CartPage() {

		var form = document.querySelector('.woocommerce-cart-form');

		if (form) {

			var items = form.querySelectorAll('.cart_item'),
				updateButton = form.querySelector('.saren--update--cart');

			items.forEach(item => {
				saren_quantityControl(item);
			})

			var collaterals = document.querySelector('.cart-collaterals');

			if (collaterals) {

				let couponInput = collaterals.querySelector('#saren_coupon_code'),
					formCoupon = form.querySelector('#coupon_code'),
					formButton = form.querySelector('.wc--coupon--button');

				couponInput.addEventListener('change', function () {
					formCoupon.value = couponInput.value;
					formButton.click();
				});


			}

		}

		if (document.querySelector('.wp-block-woocommerce-cart')) {
			document.querySelector('.wp-block-woocommerce-cart').setAttribute('data-barba-prevent', 'all')
		}

	}
	saren_CartPage();

	function saren_miniCart() {

		$(document).on('click', '.increase-qty', function () {
			const input = $(this).siblings('.mini-cart-qty');
			let qty = parseInt(input.val()) || 1;
			input.val(qty + 1).trigger('change');
		});

		$(document).on('click', '.decrease-qty', function () {
			const input = $(this).siblings('.mini-cart-qty');
			let qty = parseInt(input.val()) || 1;
			if (qty > 1) {
				input.val(qty - 1).trigger('change');
			}
		});

		$(document).on('change', '.mini-cart-qty', function () {
			const qty = $(this).val();
			const cartItemKey = $(this).data('cart_item_key');

			$.ajax({
				url: wc_add_to_cart_params.ajax_url,
				type: 'POST',
				data: {
					action: 'update_cart_item_qty',
					cart_item_key: cartItemKey,
					qty: qty,
				},
				success: function () {
					$(document.body).trigger('wc_fragment_refresh'); // Refresh mini cart
				},
			});
		});


		$(document).on('click', '.mini_cart_item .quantity--increase', function () {
			let $item = $(this).closest('.mini_cart_item'), // jQuery'de closest ile en yakın parent seçilir
				$qty = $item.find('.input-text.qty'),
				max = parseInt($qty.attr('max')) || Infinity, // max değeri kontrol edilir
				min = parseInt($qty.attr('min')) || 1, // min değeri kontrol edilir
				val = parseInt($qty.val()) || 0, // mevcut değer alınır
				$control = $item.find('.saren--quantity--control'),
				$current = $control.find('.current--quantity'),
				$miniCartQty = $item.find('.mini-cart-qty');

			val++;
			if (val >= max) val = max;
			$current.text(val);
			$qty.val(val);
			$miniCartQty.trigger('change');

		});

		$(document).on('click', '.mini_cart_item .quantity--decrease', function () {
			let $item = $(this).closest('.mini_cart_item'), // jQuery'de closest ile en yakın parent seçilir
				$qty = $item.find('.input-text.qty'),
				max = parseInt($qty.attr('max')) || Infinity, // max değeri kontrol edilir
				min = parseInt($qty.attr('min')) || 1, // min değeri kontrol edilir
				val = parseInt($qty.val()) || 0, // mevcut değer alınır
				$control = $item.find('.saren--quantity--control'),
				$current = $control.find('.current--quantity'),
				$miniCartQty = $item.find('.mini-cart-qty');

			val--
			if (val <= min) val = min;
			$current.text(val);
			$qty.val(val);
			$miniCartQty.trigger('change');

		});

	}
	saren_miniCart();


	function cartsScroll() {

		setTimeout(() => {
			if (window.cartLenis) {

				cartLenis.destroy();

				const cartLenis2 = new Lenis({
					wrapper: document.querySelector('.cart_list'),
					smooth: false,
					smoothTouch: false
				});

				function raf(time) {
					siteHeader
					cartLenis2.raf(time);
					requestAnimationFrame(raf);
				}
				requestAnimationFrame(raf);

				window.cartLenis = cartLenis2;
			}

		}, 500);


		// setTimeout(() => {

		// 	document.querySelectorAll('.saren--mini--cart').forEach(scope => {

		// 		let itemsList = scope.querySelector('.cart_list');

		// 		if (itemsList) {
		// 			let head = scope.querySelector('.saren--mini--cart--head');


		// 			if (itemsList.getBoundingClientRect().height > head.getBoundingClientRect().height) {

		// 				let cartDrag = Draggable.create(itemsList, {
		// 					type: 'y',
		// 					bounds: {
		// 						minY: 0,
		// 						maxY: (itemsList.getBoundingClientRect().height - head.getBoundingClientRect().height + 100) * -1,
		// 					},

		// 					dragResistance: 0.5,
		// 					inertia: true,
		// 					allowContextMenu: true,
		// 				});

		// 			}

		// 		}

		// 	})
		// }, 1000);

	}
	cartsScroll();

	jQuery(document.body).on('wc_fragments_refreshed', () => cartsScroll());
	$(document.body).on('added_to_cart removed_from_cart', () => cartsScroll());

	function saren_LoginRegister() {

		if (!document.querySelector('.saren--login-sec')) {
			return false;
		}

		var loginSecs = document.querySelectorAll('.saren--login-sec');

		loginSecs.forEach(loginSec => {
			let loginForm = loginSec.querySelector('.login--col'),
				registerForm = loginSec.querySelector('.register--col'),
				lostForm = loginSec.querySelector('.lost--password--col'),
				headings = loginSec.querySelectorAll('.login--form--heading');

			headings.forEach(heading => {

				heading.addEventListener('click', () => {
					let form = heading.dataset.event;

					if (form === 'register' && !loginSec.classList.contains('register--active')) {

						loginSec.classList.remove('login--active')
						loginSec.classList.remove('lost--password--active')
						loginSec.classList.add('register--active')

						gsap.to(loginForm, {
							opacity: 0
						})

						gsap.to(lostForm, {
							opacity: 0
						})

						gsap.to(registerForm, {
							opacity: 1
						})
					}

					if (form === 'lost--password' && !loginSec.classList.contains('lost--password--active')) {

						loginSec.classList.remove('login--active')
						loginSec.classList.remove('register--active')
						loginSec.classList.add('lost--password--active')

						gsap.to(loginForm, {
							opacity: 0
						})

						gsap.to(registerForm, {
							opacity: 0
						})

						gsap.to(lostForm, {
							opacity: 1
						})
					}

					if (form === 'login' && !loginSec.classList.contains('login--active')) {

						loginSec.classList.add('login--active')
						loginSec.classList.remove('lost--password--active')
						loginSec.classList.remove('register--active')

						gsap.to(loginForm, {
							opacity: 1
						})

						gsap.to(registerForm, {
							opacity: 0
						})

						gsap.to(lostForm, {
							opacity: 0
						})

					}

				})


			})


		})



	}
	saren_LoginRegister();

	function saren_AccountPage() {

		if (!document.querySelector('.account--sec')) {
			return false;
		}

		matchMedia.add({
			isMobile: "(max-width: 570px)"
		}, (context) => {

			let {
				isMobile
			} = context.conditions;

			if (document.querySelector('.saren--account--nav--top') || document.querySelector('.dashboard-type-user-preview')) {

				let ul = document.querySelector('.saren--account--nav--top ul , .saren--account--nav ul'),
					items = ul.querySelectorAll('li');

				items.forEach(item => {
					if (item.classList.contains('is-active')) {
						gsap.set(ul, {
							x: (item.getBoundingClientRect().left * -1) + (ul.getBoundingClientRect().left * 2)
						})
					}
				});

				Draggable.create(ul, {
					id: 'checkoutTabTitles',
					type: 'x',
					bounds: document.querySelector('.saren--account--nav--top , .saren--account--nav'),
					lockAxis: true,
					dragResistance: 0.5,
					inertia: true,
					allowContextMenu: true
				});
			}

		});



	}
	saren_AccountPage();

	jQuery(document.body).on('updated_wc_div', function () {
		saren_CartPage();
	});

	$(document.body).on('added_to_cart removed_from_cart', function () {

		$.ajax({
			url: wc_cart_fragments_params.wc_ajax_url.toString().replace('%%endpoint%%', 'get_refreshed_fragments'),
			type: 'POST',
			success: function (response) {

				const countText = $(response.fragments['div.widget_shopping_cart_content']).find('.cart--count').text();

				$('.saren--cart--button .cart--count').text(countText);

				$('.widget_shopping_cart_content').html(response.fragments['div.widget_shopping_cart_content']);
			}
		});
	});

	$(document).on('click', '.product-acts a.button', function (e) {

		var $thisbutton = $(this);

		if (!$thisbutton.parents('.product-type-variable').length) {

			e.preventDefault();

			let $form = $thisbutton.closest('form.cart'),
				id = $(this).data('product-id'),
				product_qty = 1,
				product_id = $(this).data('product-id'),
				variation_id = $(this).data('product-id');


			var data = {
				action: 'woocommerce_ajax_add_to_cart',
				product_id: product_id,
				product_sku: '',
				quantity: product_qty,
			};


			$(document.body).trigger('adding_to_cart', [$thisbutton, data]);

			$.ajax({
				type: 'post',
				url: wc_add_to_cart_params.ajax_url,
				data: data,
				beforeSend: function (response) {
					$thisbutton.removeClass('added').addClass('loading');

				},
				complete: function (response) {
					$thisbutton.addClass('added').removeClass('loading');

					let curr = $('.cart-count > span').html(),
						rs = parseInt(curr);

					$('.cart-count > span').html(rs + 1);

				},
				success: function (response) {

					if (response.error && response.product_url) {

						return;
					} else {
						$(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $thisbutton]);


					}
				},
			});

		}

	});

	document.addEventListener('click', function (e) {
		const target = e.target.closest('.subscribe--button.ajax_add_to_cart');

		if (target) {
			e.preventDefault();

			const productId = target.getAttribute('data-product_id');
			const quantity = target.getAttribute('data-quantity') || 1;
			let checkoutUrl = parents(target, '.pricing--table--button')[0].dataset.checkout;


			const data = new URLSearchParams();
			data.append('action', 'woocommerce_add_to_cart');
			data.append('product_id', productId);
			data.append('quantity', quantity);

			target.classList.add('loading');

			fetch(wc_add_to_cart_params.ajax_url, {
				method: 'POST',
				body: data,
			})
				.then(response => response.json())
				.then(response => {
					target.classList.remove('loading');

					if (response.error && response.product_url) {
						window.location.href = response.product_url;
					} else {
						window.location.href = checkoutUrl;

						document.body.dispatchEvent(new CustomEvent('added_to_cart', { detail: [response.fragments, response.cart_hash, target] }));
					}
				});

			return false;
		}
	});


	$(document).on('click', '.woocommerce-message .message--close', function (e) {

		gsap.to('.woocommerce-notices-wrapper', {
			opacity: 0,
			duration: .4,
			onComplete: () => {
				$('.woocommerce-notices-wrapper').remove();
			}
		})

	})


	$(document).on('change', '.variations_form.cart.saren--sticky--atc select', function () {
		const form = $(this).closest('.variations_form');
		const selects = form.find('select');
		const addToCartBtn = form.find('.single_add_to_cart_button');
		const variationInput = form.find('#variation_id');

		const variations = JSON.parse(form.attr('data-variations'));

		let selectedAttributes = {};

		selects.each(function () {
			let name = $(this).attr('name');
			let value = $(this).val();
			if (value) {
				selectedAttributes[name] = value;
			}
		});


		let exactMatch = variations.find(variation => {
			return Object.keys(variation.attributes).every(attr => {
				return variation.attributes[attr] === selectedAttributes[attr];
			});
		});

		if (!exactMatch) {
			exactMatch = variations.find(variation => {
				return Object.keys(variation.attributes).every(attr => {
					return (
						variation.attributes[attr] === selectedAttributes[attr] ||
						variation.attributes[attr] === ""
					);
				});
			});
		}

		if (exactMatch) {

			variationInput.val(exactMatch.variation_id);
			addToCartBtn.prop('disabled', false);
		} else {

			variationInput.val("");
			addToCartBtn.prop('disabled', true);
		}
	});



	$(document).on('click', '.single_add_to_cart_button:not(.external_add_to_cart)', function (e) {
		e.preventDefault();

		var $thisbutton = $(this),
			$form = $thisbutton.closest('form.cart'),
			product_id = $form.find('input[name=product_id]').val(),
			quantity = parseInt($form.find('input[name=quantity]').val()) || 1,
			variation_id = $form.find('input[name=variation_id]').val() || 0;

		var formData = new FormData($form[0]);

		if ($form.find('.single_variation_wrap').length) {
			const queryString = new URLSearchParams(formData).toString();
			const paramsArray = queryString.split('&');
			const result = {};

			paramsArray.forEach(param => {
				const [key, value] = param.split('=');
				if (result[key]) {
					if (Array.isArray(result[key])) {
						result[key].push(value);
					} else {
						result[key] = [result[key], value];
					}
				} else {
					result[key] = value;
				}
			});

			const filteredAttributes = Object.keys(result)
				.filter(key => key.startsWith('attribute_pa'))
				.reduce((obj, key) => {
					const uniqueValues = [...new Set(result[key])];
					obj[key] = uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues;
					return obj;
				}, {});

			for (let i = 0; i < $form.data('product_variations').length; i++) {
				const attributes = $form.data('product_variations')[i]['attributes'];
				if (_.isEqual(attributes, filteredAttributes)) {
					variation_id = $form.data('product_variations')[i]['variation_id'];
				}
			}
		}

		formData.append('action', 'woocommerce_ajax_add_to_cart');
		formData.append('product_id', product_id);
		formData.append('quantity', quantity);
		formData.append('variation_id', variation_id);

		formData.delete('add-to-cart');

		$.ajax({
			type: 'POST',
			url: wc_add_to_cart_params.ajax_url,
			data: formData,
			processData: false,
			contentType: false,
			beforeSend: function () {
				$thisbutton.addClass('loading');
			},
			complete: function () {
				$thisbutton.removeClass('loading').addClass('added');
			},
			success: function (response) {

				setTimeout(() => {
					if ($('.woocommerce-notices-wrapper').length === 0) {
						$('body').prepend('<div class="woocommerce-notices-wrapper"></div>');
					}
					$('.woocommerce-notices-wrapper').html(response.fragments.notices_html);

					gsap.fromTo('.woocommerce-notices-wrapper', {
						xPercent: -100
					}, {
						xPercent: 0,
						duration: 1,
						overWrite: true,
						ease: 'power3.out',
					})

					gsap.fromTo('.woocommerce-notices-wrapper .message--timer', {
						'--width': '0%',
					}, {
						'--width': '100%',
						duration: 10,
						ease: 'none',
						overWrite: true,
						onComplete: () => {
							gsap.to('.woocommerce-notices-wrapper', {
								opacity: 0,
								duration: .4,
								onComplete: () => {
									$('.woocommerce-notices-wrapper').remove();
								}
							})
						}
					})

				}, 500);

				if (response.error && response.product_url) {
					window.location = response.product_url;
					return;
				} else {
					$(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $thisbutton]);
				}
			},
			error: function (response) {
				console.log(response.error);
			}
		});
	});

	$(document).on('click', '.saren--template--popup a', function (e, link) {
		let href = $(this).attr('href');

		if (href && !href.startsWith('#')) {
			let pop = $(this).parents('.saren--template--popup');
			let popButton = pop.find('.pop--close');

			if (popButton.length) {
				popButton.trigger('click');
			}
		}
	});

	$(document).on('click', '.saren--fast--add--vars li', function (e) {
		var variationID = $(this).data("variation-id");
		var productID = $(this).parents(".saren--fast--add--vars").data("product-id");

		var span = $(this);
		span.removeClass('added');
		span.addClass('loading');

		$.ajax({
			type: "POST",
			url: wc_add_to_cart_params.ajax_url,
			data: {
				action: "saren_add_variation_to_cart",
				product_id: productID,
				variation_id: variationID,
				quantity: 1,
			},
			beforeSend: function () { },
			success: function (response) {
				if (response.success) {

					span.removeClass('loading');
					span.addClass('added');

					if (response.error && response.product_url) {
						window.location = response.product_url;
						return;
					} else {
						$(document.body).trigger('added_to_cart');
					}

				} else {
					console.log(response.data);
				}
			},
		});
	});


	$(document).on('click', '.quick-add-to-cart-btn', function (e) {
		e.preventDefault();

		var button = $(this);

		const productId = button.data('product-id');

		var product = button.parents('.saren--single--product'),
			quickPop = product.find('.quick-add-to-cart-popup'),
			popForm = quickPop.find('.saren--popup--cart-product-form'),
			popImage = quickPop.find('.spcp--img'),
			popTitle = quickPop.find('.spcp--title'),
			popPrice = quickPop.find('.spcp--price'),
			popDesc = quickPop.find('.spcp--desc'),
			overlay = product.find('.pop--overlay');

		button.addClass('loading')

		$.ajax({
			url: wc_add_to_cart_params.ajax_url,
			type: 'POST',
			data: {
				action: 'load_variable_add_to_cart_form',
				product_id: productId
			},
			success: function (response) {

				popForm.html(response.data.form_html);
				popImage.attr('src', response.data.image)
				popPrice.html(response.data.price)
				popDesc.html(response.data.short_description)
				popTitle.html(response.data.title)


				if (product.parents('.pe--carousel')) {
					quickPop.appendTo(product.parents('.pe--carousel')[0]);
				}

				if (product.parents('.pe--compare--container')) {

					quickPop.appendTo(product.parents('.pe--compare--container')[0]);
				}

				disableScroll();
				button.removeClass('loading');
				quickPop.fadeIn();
				quickPop.addClass('active');

				variableAddCart(quickPop)


			},
			error: function () {
				alert('Failed to load the form.');
			}
		});
	});

	$(document).ready(function () {
		checkFBTFormState();
	});

	$(document).on('change', '.fbt-variation-select, .fbt-checkbox', function () {
		checkFBTFormState();
	});

	function checkFBTFormState() {
		$('.fbt-form').each(function () {
			var $form = $(this),
				$infoDiv = $form.find('.fbt-info'),
				$button = $form.find('.fbt-add-to-cart'),
				hasError = false;

			$infoDiv.empty(); // Clear previous messages

			$form.find('.fbt-checkbox:checked').each(function () {
				var $checkbox = $(this),
					productId = $checkbox.val(),
					$variationSelect = $form.find('.fbt-variation-select[name="fbt_variations[' + productId + ']"]');

				if ($variationSelect.length && !$variationSelect.val()) {
					var productName = $checkbox.closest('.fbt-product-item').find('a').text();
					$infoDiv.append('<p>Please select a variation for "' + productName + '".</p>');
					hasError = true;
				}
			});

			if ($form.find('.fbt-checkbox:checked').length === 0) {
				$infoDiv.append('<p>Please select at least one product to add to the cart.</p>');
				hasError = true;
			}

			$button.prop('disabled', hasError);
		});
	}


	$(document).on('click', '.fbt-add-to-cart', function (e) {
		e.preventDefault();

		var $thisbutton = $(this),
			$form = $thisbutton.closest('form.fbt-form'),
			$infoDiv = $form.find('.fbt-info'),
			selectedProducts = [],
			hasError = false;

		// Clear previous messages
		$infoDiv.empty();
		$thisbutton.prop('disabled', false);

		// Collect selected products
		$form.find('.fbt-checkbox:checked').each(function () {
			var $checkbox = $(this),
				productId = $checkbox.val(),
				$variationSelect = $form.find('.fbt-variation-select[name="fbt_variations[' + productId + ']"]'),
				variationId = $variationSelect.val() || 0,
				productName = $checkbox.closest('.fbt-product-item').find('a').text();

			// Check if variation is required but not selected
			if ($variationSelect.length && variationId === 0) {
				$infoDiv.append('<p>Please select a variation for "' + productName + '".</p>');
				hasError = true;
			}

			selectedProducts.push({
				product_id: productId,
				variation_id: variationId
			});
		});

		// Check if no products are selected
		if (selectedProducts.length === 0) {
			$infoDiv.append('<p>Please select at least one product to add to the cart.</p>');
			hasError = true;
		}

		// Disable button if there is an error
		if (hasError) {
			$thisbutton.prop('disabled', true);
			return;
		}

		// Prepare form data
		var formData = new FormData();
		formData.append('action', 'woocommerce_ajax_add_to_cart_fbt');
		formData.append('products', JSON.stringify(selectedProducts));

		$.ajax({
			type: 'POST',
			url: wc_add_to_cart_params.ajax_url,
			data: formData,
			processData: false,
			contentType: false,
			beforeSend: function () {
				$thisbutton.addClass('loading');
			},
			complete: function () {
				$thisbutton.removeClass('loading').addClass('added');
			},
			success: function (response) {
				if (response.error) {
					$infoDiv.append('<p>' + response.error + '</p>');
				} else {
					$(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $thisbutton]);
				}
			},
			error: function (response) {
				console.log(response);
			}
		});
	});



	// Re-enable the button and clear messages when variations are updated
	$(document).on('change', '.fbt-variation-select, .fbt-checkbox', function () {
		var $form = $(this).closest('form.fbt-form'),
			$infoDiv = $form.find('.fbt-info'),
			$button = $form.find('.fbt-add-to-cart');

		$infoDiv.empty();
		$button.prop('disabled', false);
	});


	$(document).on('click', '.quick-add-to-cart-popup .pop--overlay , .quick-add-to-cart-popup .pop--close', function (e) {
		let pop = $(this).parents('.quick-add-to-cart-popup')
		if (pop.hasClass('active')) {
			pop.fadeOut();
			pop.removeClass('active');
			setTimeout(() => {

				if (pop.parents('.pe--carousel')) {
					let product = pop.data('product-id');

					let productFind = pop.parents('.pe--carousel').find('.post-' + product);

					productFind.prepend(pop)
				}


			}, 500);
			enableScroll();
		}
	})


	function variableAddCart(product) {
		var form = $(product).find('.variations_form');

		if (form.length) {
			var tableRows = form.find('tr'),
				disabled = true;

			function checkVariations() {
				disabled = false;

				tableRows.each(function () {
					var row = $(this),
						inputs = row.find('input'),
						rowValid = false;

					inputs.each(function () {
						var input = $(this);

						if (input.attr('type') === 'file') {
							rowValid = true;
						} else if (input.is(':checked')) {
							rowValid = true;
						}
					});

					if (!rowValid) {
						disabled = true;
					}
				});

				if (disabled) {
					$(product).find('.woocommerce-variation-add-to-cart').addClass('woocommerce-variation-add-to-cart-disabled');
					$(product).find('.single_add_to_cart_button').addClass('disabled');
				} else {
					$(product).find('.woocommerce-variation-add-to-cart').removeClass('woocommerce-variation-add-to-cart-disabled').addClass('woocommerce-variation-add-to-cart-enabled');
					$(product).find('.single_add_to_cart_button').removeClass('disabled');
				}
			}

			checkVariations();

			tableRows.each(function () {
				$(this).find('input').on('change', function () {

					checkVariations();
				});
			});

		}
	}

	$(document).on('change', '.quick-add-to-cart-popup form.variations_form .saren-variation-radio-buttons input[type=radio]', function () {
		var radioButton = $(this);
		var form = radioButton.closest('form.variations_form');
		var attributeName = radioButton.attr('name');
		var attributeValue = radioButton.val();

		var selectElement = form.find('select[name="' + attributeName + '"]');

		if (selectElement.length) {
			selectElement.val(attributeValue);

			selectElement.trigger('change');
		}

		form.trigger('check_variations');
	});

	$(document).on('change', '.woo-products-archive .pe--product--filters input , .woo-products-archive .products--sorting select', function () {

		var filters = {};

		let filterparents = $('.pe--product--filters');
		filterparents.addClass('loading');

		var sortingSelect = $('.products--sorting select').val();
		if (sortingSelect) {
			filters['orderby'] = sortingSelect;
		}

		$('.pe--product--filters input:checked').each(function () {
			var filterName = $(this).attr('name');

			if (!filters[filterName]) {
				filters[filterName] = [];
			}

			filters[filterName].push($(this).val());

			if ($(this).val() === 'all') {
				filters['product_cato'] = [];
			}
		});

		var queryParams = [];

		for (var key in filters) {
			if (filters.hasOwnProperty(key)) {
				if (Array.isArray(filters[key])) {
					filters[key].forEach(function (value) {
						queryParams.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(value));
					});
				} else {
					queryParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(filters[key]));
				}
			}
		}

		var queryParams = queryParams.join('&');

		var url = window.location.href.split('?')[0] + '?archiveFilter=1&' + queryParams;

		console.log(url);

		$.ajax({
			url: url,
			type: 'GET',
			dataType: 'html',
			beforeSend: function () {
				filterparents.addClass('loading');
			},
			success: function (response) {

				var doc = $('<div>').html(response);
				var newProducts = doc.find('.woo-products-archive .saren--single--product');

				var productGrid = $('.woo-products-archive .saren--products-grid');
				productGrid.html('');

				filterparents.removeClass('loading');

				newProducts.each(function () {
					productGrid.append($(this));
				});
			},
			error: function () {
				console.error('An error occurred while fetching filtered products.');
				filterparents.removeClass('loading');
			}
		});
	});


	function imagesZoom(images) {
		images.forEach(image => {
			if (image.querySelector('.img--zoom')) {
				let zoomImage = image.querySelector('.img--zoom');

				if (zoomImage.classList.contains('zoom-outer')) {
					let zoomWrap = document.querySelector('.product--image--zoom--wrap');
					zoomWrap.appendChild(zoomImage);
				}

				image.addEventListener('mouseenter', () => {
					gsap.to(zoomImage, {
						opacity: 1,
						duration: 0.3,
					});

					image.classList.add('zoom--active');
					document.querySelector('.product--image--zoom--wrap') ? document.querySelector('.product--image--zoom--wrap').classList.add('active') : '';
				});

				image.addEventListener('mousemove', (e) => {
					const rect = image.getBoundingClientRect();
					const zoomWidth = zoomImage.offsetWidth;
					const zoomHeight = zoomImage.offsetHeight;

					const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
					const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

					const offsetX = (xPercent - 50) * (zoomWidth / rect.width);
					const offsetY = (yPercent - 50) * (zoomHeight / rect.height);

					if (zoomImage.classList.contains('zoom-outer')) {

						let zoomWrap = document.querySelector('.product--image--zoom--wrap'),
							follower = image.querySelector('.outer--zoom--follower');

						gsap.to(zoomWrap, {
							left: rect.left + rect.width + 10,
							top: rect.top + 10,
							xPercent: rect.left > (window.outerWidth / 2) ? -200 : 0
						});

						gsap.to(follower, {
							x: (e.clientX - rect.left) - 50,
							y: (e.clientY - rect.top) - 50
						});

					}

					gsap.to(zoomImage, {
						x: -offsetX,
						y: -offsetY,
						duration: 0.1,
						ease: "power2.out",
					});
				});

				image.addEventListener('mouseleave', () => {

					image.classList.remove('zoom--active');
					document.querySelector('.product--image--zoom--wrap') ? document.querySelector('.product--image--zoom--wrap').classList.remove('active') : '';

					gsap.to(zoomImage, {
						opacity: 0,
						x: 0,
						y: 0,
						duration: 0.3,
					});
				});

			}
		});
	}

	$(document).on('change', '.saren--product--element .variations .saren-variation-radio-buttons input[type=radio]', function () {
		var $form = $(this).closest('form.variations_form');
		var variations = $form.data('product_variations');
		var selectedAttributes = {};
		var variation_id;


		$form.find('.variations select').each(function () {
			var attributeName = $(this).attr('name');
			var attributeValue = $(this).val();
			if (attributeValue) {
				selectedAttributes[attributeName] = attributeValue;
			}
		});

		var matchedVariation = variations.find(function (variation) {
			var attributes = variation.attributes;
			var isMatch = true;

			for (var key in selectedAttributes) {
				if (attributes[key] !== selectedAttributes[key]) {
					isMatch = false;
					break;
				}
			}

			return isMatch;
		});

		if (matchedVariation) {
			variation_id = matchedVariation.variation_id;
		}
		variation_id = $(this).attr('data-single-var-id');


		if (variation_id) {

			$.ajax({
				url: woocommerce_params.ajax_url,
				type: 'POST',
				data: {
					action: 'get_variation_gallery',
					variation_id: variation_id,
				},
				beforeSend: function () {
					$form.addClass('variation--images--loading');
				},
				success: function (response) {

					if (response.success) {
						const targetDoc = $.parseHTML(response.data);
						const newImages = $(targetDoc).filter('img');
						const galleryWrapper = $('.product--gallery--wrapper');
						const galleryItems = $('.product--gallery--wrapper .product--gallery--image');



						if (newImages.length > 0) {

							if (newImages.length > 1) {
								if (newImages.length > galleryItems.length) {
									for (let i = galleryItems.length; i < newImages.length; i++) {
										galleryWrapper.append('<div class="product--gallery--image cr--item"></div>');
									}
								}

								if (newImages.length < galleryItems.length) {
									for (let i = newImages.length; i < galleryItems.length; i++) {
										galleryItems.eq(i).remove();
									}
								}
							}

							const updatedGalleryItems = $('.product--gallery--wrapper .product--gallery--image');
							updatedGalleryItems.each(function (index) {
								const oldImage = $(this).find('img');
								const newImage = newImages[index];

								if (newImage) {
									newImage.classList.add('variation--gallery--img');

									gsap.to(newImage, {
										opacity: 1,
										duration: 1,
										onComplete: () => {

											if (oldImage.length > 0) {
												oldImage.remove();
											}

											gsap.set(newImage, {
												position: 'static',
											});

										},
									});

									$(this).append(newImage);

								}
							});

						}

						$form.removeClass('variation--images--loading');

						setTimeout(() => {

							let media = document.querySelector('.elementor-widget-productmedia'),
								images = media.querySelectorAll('.product--gallery--image');

							if (!media.classList.contains('zoom--no-zoom')) {

								if (media.classList.contains('zoom--zoom-outer')) {
									let outerZoomWrap = media.querySelector('.product--image--zoom--wrap');
									outerZoomWrap.innerHTML = '';
								}

								images.forEach(image => {
									let img = image.querySelector('img'),
										clone = img.cloneNode();
									clearProps(clone);
									clone.classList.add('img--zoom');

									if (media.classList.contains('zoom--zoom-outer')) {
										clone.classList.add('zoom-outer');
									} else if (media.classList.contains('zoom--zoom-inner')) {
										clone.classList.add('zoom-inner');
									}

									image.insertBefore(clone, img);
								})

							}

							imagesZoom(document.querySelectorAll('.product--gallery--image'));

						}, 1200);

					} else {
						$form.removeClass('variation--images--loading');
					}
				},
				error: function () {
					console.error('An error occurred while fetching the variation gallery.');
					$form.removeClass('variation--images--loading');
				},
			});
		}
	});

	$(document).on('click', '.saren--single--product--attributes.has--swatches span', function (e) {
		var variation_id = $(this).attr('data-variation-id');
		var span = $(this);
		var product = span.parents('.saren--product--wrap');

		if (variation_id) {

			product.find('.saren--single--product--attributes.has--swatches span').removeClass('active');
			span.addClass('active')

			$.ajax({
				url: woocommerce_params.ajax_url,
				type: 'POST',
				data: {
					action: 'get_variation_gallery',
					variation_id: variation_id,
				},
				beforeSend: function () {

				},
				success: function (response) {
					if (response.success) {
						const targetDoc = $.parseHTML(response.data);
						const newImages = $(targetDoc).filter('img');
						var currentImage = product.find('.saren--product--image a');

						if (newImages.length > 0) {
							newImages[0].classList.add('variation--single--img');
							currentImage.append(newImages[0])
							gsap.to(newImages[0], {
								opacity: 1
							})
						}

					} else {

						console.error('No images found for this variation.');

					}
				},
				error: function () {
					console.error('An error occurred while fetching the variation gallery.');

				},
			});
		}

	})


	function productsLoadMore(url, e, loadMore) {
		loadMore.addClass('loading');

		let clicks = loadMore.data('clicks') || 0;
		clicks++;
		loadMore.data('clicks', clicks);

		const apiUrl = url + '?offset=' + clicks;

		if (e) {
			e.preventDefault();
		}

		$('html').addClass('loading');
		loadMore.addClass('loading');

		$.ajax({
			url: apiUrl,
			method: 'GET',
			success: function (response) {
				const wrapper = $('.woo-products-archive .saren--products-grid');

				setTimeout(function () {
					const htmlDoc = $.parseHTML(response);
					const newElement = $(htmlDoc).find('.woo-products-archive .saren--products-grid');
					const newPosts = newElement.find('.saren--single--product');

					if (newPosts.length > 0) {
						let tl = gsap.timeline({
							onComplete: () => {
								ScrollTrigger.refresh();
							}
						});

						newPosts.each(function (i, post) {
							const clone = $(post).clone();
							wrapper.append(clone);

							if ($('.woo-products-archive .archive-products-section').hasClass('archive--masonry')) {
								const masonry = Masonry.data($('.woo-products-archive .saren--products-grid')[0]);

								masonry.appended(clone[0]);
								setTimeout(() => {
									masonry.layout();
								}, 10);

								loadMore.removeClass('loading');
							} else {
								tl.fromTo(clone, {
									opacity: 0,
									yPercent: 100
								}, {
									opacity: 1,
									yPercent: 0,
									duration: 0.75,
									ease: 'expo.out',
									onComplete: () => {
										loadMore.removeClass('loading');

										if (clone.find('.pe-video').length) {
											clone.find('.pe-video').each(function () {
												new peVideoPlayer(this);
											});
										}
									}
								}, i * 0.15);
							}
						});

						if ($('.woo-products-archive .archive-products-section').data('maxPages') == clicks + 1) {
							loadMore.addClass('hidden');
						}

						$('html').removeClass('loading');
					}
				}, 200);
			},
			error: function (xhr) {
				console.error('Request failed. Status: ' + xhr.status);
			}
		});
	}

	$(document).on('click', '.woo-products-archive .saren--products--load--more', function (e) {
		const loadMore = $(this);
		const url = window.location.href;
		productsLoadMore(url, e, loadMore);
	});

	function sarenShopArchive() {

		var mainQuery = document.querySelector('.woo-products-archive');

		if (!mainQuery) {
			return false;
		}

		if (document.querySelector('.woo-products-archive .archive--masonry')) {

			var elem = document.querySelector('.woo-products-archive .saren--products-grid');

			var msnry = new Masonry(elem, {
				itemSelector: '.saren--single--product',
				columnWidth: '.saren--products--masonry--sizer',
				gutter: '.saren--products--masonry--gutter',
				percentPosition: true,
			});

			imagesLoaded(elem, function (instance) {
				msnry.layout();
			})

		}

		if (document.querySelector('.woo-products-archive .saren--products--filter--cats')) {

			let filterCats = document.querySelector('.saren--products--filter--cats'),
				catsWidth = filterCats.getBoundingClientRect().width;

			matchMedia.add({
				isMobile: "(max-width: 550px)"

			}, (context) => {

				let {
					isMobile
				} = context.conditions;

				Draggable.create(filterCats, {
					type: 'x',
					bounds: {
						minX: 0,
						maxX: -catsWidth + (document.body.clientWidth / 2),
					},
					lockAxis: true,
					dragResistance: 0.5,
					inertia: true,
					allowContextMenu: true
				});


			});


		}

		if (mainQuery.querySelector('.products--grid--switcher')) {

			let items = mainQuery.querySelectorAll('.switch--item'),
				gridItems = mainQuery.querySelectorAll('.saren--single--product'),
				grid = mainQuery.querySelector('.saren--products-grid'),
				switcher = mainQuery.querySelector('.products--grid--switcher');

			function moveFollower(follower) {

				let active = switcher.querySelector('.switch--active');
				let activeRect = active.getBoundingClientRect();
				let switcherRect = switcher.getBoundingClientRect();

				gsap.to(follower, {
					x: activeRect.left - switcherRect.left,
					y: activeRect.top - switcherRect.top,
					width: activeRect.width,
					height: activeRect.height,
					duration: 0.75,
					ease: 'power3.out'
				});
			}

			if (switcher.querySelector('.switch--follower')) {
				moveFollower(switcher.querySelector('.switch--follower'))
			}

			items.forEach(item => {

				item.addEventListener('click', () => {

					mainQuery.querySelector('.switch--active').classList.remove('switch--active')
					item.classList.add('switch--active');

					moveFollower(switcher.querySelector('.switch--follower'));

					let state = Flip.getState(gridItems),
						cols = item.dataset.switchCols;

					gsap.set(grid, {
						"--columns": cols
					})

					Flip.from(state, {
						duration: 1,
						ease: 'expo.inOut',
						absolute: true,
						absoluteOnLeave: true,
					})

				})

			})
		}

		if (mainQuery && mainQuery.querySelector('.filters--popup')) {
			pePopup(mainQuery, mainQuery);
		}

		if (mainQuery.querySelector('.product--archive--gallery')) {

			let swiperCont = mainQuery.querySelectorAll('.product--archive--gallery');

			swiperCont.forEach(cont => {

				var productArchiveGallery = new Swiper(cont, {
					slidesPerView: 1,
					speed: 750,
					navigation: {
						nextEl: cont.querySelector('.pag--next'),
						prevEl: cont.querySelector('.pag--prev'),
					},
				});

			});

		}


	}


	function sarenPageLoader() {

		var container = document.body,
			imgLoad = imagesLoaded(container),
			totalImages = imgLoad.images.length,
			loadedCount = 0,
			pageLoader = document.querySelector('.pe--page--loader'),
			numbersWrap = pageLoader.querySelector('.numbers--wrap'),
			numbers = pageLoader.querySelectorAll('.number'),
			logo = pageLoader.querySelector('.page--loader--logo'),
			duration = parseInt(pageLoader.dataset.duration) / 1000,
			type = pageLoader.dataset.type,
			countLabels = [0];


		countLabels.push(Math.floor(gsap.utils.random(20, 30)));
		countLabels.push(Math.floor(gsap.utils.random(40, 60)));
		countLabels.push(Math.floor(gsap.utils.random(60, 80)));
		countLabels.push(100);


		numbers.forEach(number => {
			let digits = number.querySelectorAll('span');

			digits.forEach((digit, i) => {
				digit.classList.add('digit_' + i);
				digit.setAttribute('data-top', digit.getBoundingClientRect().top - numbersWrap.getBoundingClientRect().top)

			})
		})

		var tl = gsap.timeline({
			id: 'pageLoader',
			paused: true,
			onStart: () => {
				pageLoader.classList.add('running');
				html.classList.add('loading');
				disableScroll();

				if (type === 'slide') {
					gsap.set('.site-header', {
						yPercent: -100
					})
				}
			},
		});

		if (logo) {
			tl.to('.op', {
				clipPath: 'inset(0% 0% 0% 0%)',
				duration: duration,
				ease: 'expo.inOut',
			}, 0)

		}

		if (pageLoader.querySelector('.page--loader--caption')) {

			let caption = pageLoader.querySelector('.page--loader--caption');

			if (caption.classList.contains('capt--simple')) {

				if (caption.classList.contains('capt--chars') || caption.classList.contains('capt--words')) {

					document.fonts.ready.then((fontFaceSet) => {
						new SplitText(caption, {
							type: 'lines , words, chars',
							wordsClass: 'loader_caption_word',
							linesClass: 'loader_caption_line',
							charsClass: 'loader_caption_char',
						});

						let target = caption.classList.contains('capt--chars') ? caption.querySelectorAll('.loader_caption_char') : caption.classList.contains('capt--words') ? caption.querySelectorAll('.loader_caption_word') : caption;

						gsap.to(target, {
							y: 0,
							duration: caption.classList.contains('capt--chars') ? .5 : 1,
							ease: 'power3.out',
							stagger: caption.classList.contains('capt--chars') ? .02 : .1,
							delay: .25
						})
					})
				} else if (caption.classList.contains('capt--fade')) {
					gsap.to(caption.querySelector('span'), {
						opacity: 1,
						y: 0,
						duration: 1,
						ease: 'expo.out',
					}, .1)

				} else if (caption.classList.contains('capt--progress')) {

					tl.to(caption.querySelector('span.capt--clone'), {
						width: '100%',
						duration: duration,
						ease: 'expo.out',
					}, .1)

				}


			} else if (caption.classList.contains('capt--repeater')) {

				let repeaterInner = pageLoader.querySelector('.capt--repeater--inner'),
					texts = repeaterInner.querySelectorAll('span'),
					repeaterTl = gsap.timeline({ repeat: -1 });

				for (let i = 1; i < texts.length; i++) {
					let yVal = (100 / texts.length) * i;
					repeaterTl.to(repeaterInner, {
						yPercent: -yVal,
						duration: .65,
						ease: 'power2.inOut',
						delay: .4,

					})
				}

			}


		}

		if (pageLoader.querySelector('.page--loader--progress')) {

			let width = pageLoader.querySelector('.page--loader--progress').getBoundingClientRect().width;

			tl.to('.page--loader--progress .plp--line', {
				width: '100%',
				duration: duration,
				ease: 'expo.inOut',
			}, 0)

			tl.to('.page--loader--progress .plp--perc', {
				x: width,
				duration: duration,
				ease: 'expo.inOut',
				onUpdate: () => {
					let prog = tl.progress() * 100,
						curr = '000';

					let perc = pageLoader.querySelector('.plp--perc');

					if (perc < 10) {

						perc.innerHTML = '00' + Math.floor(prog);

					} else {
						perc.innerHTML = '0' + Math.floor(prog);
					}



				},
				onComplete: () => {
					let perc = pageLoader.querySelector('.plp--perc');

					perc.innerHTML = 100;
				}
			}, 0)

		}

		tl.to('.number__1', {
			y: mobileQuery.matches ? -50 : -100,
			duration: duration,
			ease: 'expo.inOut',

		}, .5)

		tl.to('.number__2', {
			y: mobileQuery.matches ? -500 : -1000,
			duration: duration,
			duration: duration,
			ease: 'expo.inOut'
		}, 0)

		tl.to('.number__3', {
			y: mobileQuery.matches ? -500 : -1000,
			duration: duration,
			duration: duration,
			ease: 'expo.inOut'

		}, .25)


		imgLoad.on('progress', function (instance, image) {
			loadedCount++;
			var percent = (loadedCount / totalImages) * 100;

			if (!pageLoader.classList.contains('running')) {
				tl.play()
			}

			let tlProg = tl.progress() * 100;

			if (percent < tlProg) {
				tl.pause();
			} else {
				tl.play();
			}

		});

	}

	function sarenLoaderOut(behavior) {

		let loader = document.querySelector('.pe--page--loader'),
			direction = loader.dataset.direction;

		if (behavior === 'slide') {

			gsap.to('.page--loader--ov', {
				opacity: .75,
				duration: 1,
				ease: 'expo.inOut',
				delay: .1
			})

			gsap.to('.pe--page--loader', {
				y: direction === 'up' ? -300 : direction === 'down' ? '100vh' : 0,
				x: direction === 'left' ? 500 : direction === 'right' ? -500 : 0,
				duration: 1,
				ease: 'expo.inOut',
				delay: .1
			})

			gsap.to('.site-header', {
				yPercent: 0,
				duration: 1,
				onStart: () => {

					gsap.set('.site-header', {
						visibility: 'visible',
					})
				},
				ease: 'power3.out'
			})

			if (loader.classList.contains('pl__left') || loader.classList.contains('pl__right')) {
				gsap.set('main', {
					y: 0
				})
			}

			if (loader.classList.contains('pl__down')) {
				gsap.set('main', {
					y: '-100vh'
				})
			}

			gsap.to('main', {
				y: 0,
				x: 0,
				duration: 1,
				ease: 'expo.inOut',
				delay: .1,
				id: 'loaderOut',
				onStart: () => {
					setTimeout(() => {
						ScrollTrigger.refresh();
					}, 100);
				},
				onComplete: () => {

					document.querySelector('.pe--page--loader').remove();
					clearProps('main');
					html.classList.remove('loading');
					html.classList.remove('first--load');
					ScrollTrigger.refresh();
					enableScroll();

				}
			})

		}

		if (behavior === 'fade') {

			let tl = gsap.timeline({
			})

			if (loader.classList.contains('pl__fade-simple')) {

				tl.to(loader, {
					opacity: 0,
					duration: 1.5,
					ease: 'expo.inOut',
					onStart: () => {

						gsap.to('.pl--item > *', {
							duration: 1.5,
							ease: 'expo.out',
							opacity: 0,
						});

						html.classList.remove('loading')
						html.classList.remove('first--load');

						setTimeout(() => {
							ScrollTrigger.refresh();
						}, 100);
					},
					onComplete: () => {
						document.querySelector('.pe--page--loader').remove();
						enableScroll();
					}
				})
			} else {
				tl.to(loader, {
					"--mainCount": '100%',
					duration: 1.25,
					ease: 'expo.inOut',
				}, 0)

				tl.to(loader, {
					"--secondaryCount": '100%',
					duration: 1.25,
					ease: 'expo.inOut',
					onStart: () => {

						gsap.to('.pl--item > *', {
							duration: 1.5,
							ease: 'expo.out',
							opacity: 0,
						});

						html.classList.remove('loading')
						html.classList.remove('first--load');

						setTimeout(() => {
							ScrollTrigger.refresh();
						}, 100);
					},
					onComplete: () => {
						document.querySelector('.pe--page--loader').remove();
						enableScroll();
					}
				}, .1)
			}

		}

		if (behavior === 'overlay') {

			var curveValue = loader.classList.contains('pl__curved') ? getComputedStyle(loader).getPropertyValue('--curve').trim() : 0;

			gsap.to(loader, {
				height: direction === 'up' ? 0 : direction === 'down' ? 0 : '100vh',
				width: direction === 'left' ? 0 : direction === 'right' ? 0 : '100vw',
				borderTopRightRadius: direction === 'down' ? curveValue : direction === 'left' ? curveValue : 0,
				borderTopLeftRadius: direction === 'down' ? curveValue : direction === 'right' ? curveValue : 0,
				borderBottomRightRadius: direction === 'up' ? curveValue : direction === 'left' ? curveValue : 0,
				borderBottomLeftRadius: direction === 'up' ? curveValue : direction === 'right' ? curveValue : 0,
				duration: 1.25,
				ease: 'expo.inOut',
				onStart: () => {

					gsap.to('.pl--item', {
						duration: .5,
						ease: 'power3.in',
						opacity: 0,
						yPercent: -50,

					});

					clearProps('main')
					let triggers = ScrollTrigger.getAll();

					for (let y = 0; y < triggers.length; y++) {

						triggers[y].enable();
					}

					setTimeout(() => {
						ScrollTrigger.refresh();
					}, 100);

					html.classList.remove('loading');
					html.classList.remove('first--load');
				},
				onComplete: () => {
					// document.querySelector('.pe--page--loader').remove();
					html.classList.remove('loading')
					html.classList.remove('first--load');
					enableScroll();
					ScrollTrigger.refresh()
				}
			})

		}

		if (behavior === 'columns' || behavior === 'rows') {

			let spans = loader.querySelectorAll('.page--loader--column , .page--loader--row'),
				tl = gsap.timeline(),
				length = spans.length;

			tl.to(spans, {
				yPercent: behavior === 'rows' ? 0 : loader.classList.contains('pl__up') ? -100 : 100,
				xPercent: behavior === 'columns' ? 0 : loader.classList.contains('pl__right') ? 100 : -100,
				duration: 1.25,
				ease: 'expo.inOut',
				stagger: {
					grid: [1, length],
					from: loader.dataset.stagger,
					amount: .3,
				},
				onComplete: () => {
					document.querySelector('.pe--page--loader').remove();
					enableScroll();
					ScrollTrigger.refresh();
				},
				onStart: () => {
					elementsOut(0);

					clearProps('main')
					let triggers = ScrollTrigger.getAll();

					for (let y = 0; y < triggers.length; y++) {

						triggers[y].enable();
					}

					setTimeout(() => {
						ScrollTrigger.refresh();
					}, 100);

					html.classList.remove('loading');
					html.classList.remove('first--load');
				}
			}, 0)

		}

		if (behavior === 'blocks') {

			let spans = loader.querySelectorAll('.page--loader--block'),
				tl = gsap.timeline(),
				length = spans.length,
				animation = loader.dataset.blocksAnimation;

			tl.to(spans, {
				width: animation === 'fade' ? '100%' : animation === 'bottom' ? '100%' : animation === 'top' ? '100%' : 0,
				height: animation === 'fade' ? '100%' : animation === 'left' ? '100%' : animation === 'left' ? '100%' : animation === 'right' ? '100%' : 0,
				opacity: animation === 'fade' ? 0 : 1,
				duration: 1.25,
				ease: 'expo.inOut',
				onUpdate: () => {
					ScrollTrigger.refresh();
				},
				stagger: {
					grid: [1, length],
					from: loader.dataset.stagger,
					amount: .3,
				},
				onComplete: () => {
					document.querySelector('.pe--page--loader').remove();
					enableScroll();
				},
				onStart: () => {
					gsap.to('.pl--item', {
						duration: .5,
						ease: 'power3.in',
						opacity: 0,
						yPercent: -50,

					});

					clearProps('main')

					let triggers = ScrollTrigger.getAll();

					for (let y = 0; y < triggers.length; y++) {

						triggers[y].enable();
					}

					html.classList.remove('loading');
					html.classList.remove('first--load');
				}
			}, 0)

		}

		function elementsOut(delay = 0) {

			if (loader.querySelector('.page--loader--caption')) {

				let caption = loader.querySelector('.page--loader--caption');

				if (caption.classList.contains('capt--marquee') || caption.classList.contains('capt--fade') || caption.classList.contains('capt--repeater') || caption.classList.contains('capt--progress')) {

					gsap.to([caption.querySelectorAll('span'), caption.querySelector('.cation--repeater--wrap'), caption.querySelector('.pb--marquee')], {
						opacity: 0,
						y: -100,
						duration: .65,
						ease: 'power3.in',
						overWrite: true
					})

				} else if (caption.classList.contains('capt--chars') || caption.classList.contains('capt--words')) {

					let target = caption.classList.contains('capt--chars') ? caption.querySelectorAll('.loader_caption_char') : caption.classList.contains('capt--words') ? caption.querySelectorAll('.loader_caption_word') : caption;

					gsap.to(target, {
						y: '-110%',
						duration: caption.classList.contains('capt--chars') ? 0.5 : 1,
						ease: 'power3.in',
						stagger: caption.classList.contains('capt--chars') ? -0.02 : -0.1,
					})
				}


			}

			if (loader.querySelector('.page--loader--count') || loader.querySelector('.page--loader--logo')) {

				gsap.to([loader.querySelector('.numbers--wrap'), loader.querySelector('.page--loader--logo')], {
					opacity: 0,
					y: -100,
					duration: .65,
					ease: 'power3.in',
					overWrite: true
				})

			}


		}

	}

	function sarenmouseCursor() {
		var mouseCursor = document.getElementById('mouseCursor');

		if (mouseCursor) {
			gsap.set(mouseCursor, {
				xPercent: -50,
				yPercent: -50
			});

			let xTo = gsap.quickTo(mouseCursor, "x", {
				duration: 0.6,
				ease: "power3"
			}),
				yTo = gsap.quickTo(mouseCursor, "y", {
					duration: 0.6,
					ease: "power3"
				});

			function icko(e) {
				xTo(e.clientX);
				yTo(e.clientY);
			}

			window.addEventListener('mousemove', (e) => {
				icko(e);
			});
		}
	}

	var cursor = document.getElementById('mouseCursor') ? document.getElementById('mouseCursor') : false,
		cursorText = cursor ? cursor.querySelector('.cursor-text') : false,
		cursorIcon = cursor ? cursor.querySelector('.cursor-icon') : false;

	function resetCursor() {

		cursor.classList.remove('cursor--default')
		cursor.classList.remove('cursor--text');
		cursor.classList.remove('cursor--icon');
		cursor.classList.remove('dragging--right');
		cursor.classList.remove('dragging--left');
		cursorText.innerHTML = '';
		cursorIcon.innerHTML = '';

	}


	function sarenHeader() {

		if (!document.querySelector('.site-header')) {
			return false;
		}
		const header = document.querySelector('.site-header');
		const headerEls = header.querySelectorAll('.wd--show--on--top, .wd--show--sticky, .element--get--state');
		var headerElements;

		var start = 0;

		if (mobileQuery.matches) {
			headerElements = [...headerEls].filter(el => {
				const rect = el.getBoundingClientRect();
				return rect.left < window.innerWidth && rect.right > 0 && getComputedStyle(el).display !== 'none' && !el.classList.contains('vis--disabled--at--mobile');
			});
		} else {
			headerElements = [...headerEls].filter(el => {
				const rect = el.getBoundingClientRect();
				return rect.left < window.innerWidth && rect.right > 0 && getComputedStyle(el).display !== 'none';
			});
		}


		gsap.set(headerElements, {
			transition: 'none'
		});

		headerElements.forEach(el => el.classList.add('header--element--anim'));

		setTimeout(function () {

			let scrolltriggers = ScrollTrigger.getAll();
			scrolltriggers.forEach(function (st) {

				if ((st.pin != null) && (st.start <= window.innerHeight) && st.vars.pinSpacing != false && !st.pin.classList.contains('header--pin--disabled--true')) {
					start = st.end - 10;

				}
			})

			function animateElements(play, duration = .75) {

				var state = Flip.getState(headerElements, {
					props: 'opacity , display , width, height, maxWidth, maxHeight'
				});

				if (play) {
					header.classList.add('header--move');
				} else {
					header.classList.remove('header--move');
				}

				Flip.from(state, {
					ease: "power2.inOut",
					duration: duration,
					absolute: true,
					absoluteOnLeave: true,
					nested: true,
					onEnter: (elements) =>
						gsap.fromTo(
							elements,
							{
								opacity: 0,
							},
							{
								opacity: 1,
								duration: duration,
								delay: 0,
								ease: "power2.inOut",
							}
						),
					onLeave: (elements) =>
						gsap.to(elements, {
							opacity: 0,
							duration: duration,
							delay: 0,
							ease: "none",
							ease: "power2.inOut",
						})
				});

			}


			function fixedHeader() {

				let sc = ScrollTrigger.create({
					trigger: 'body',
					start: 'top+=' + start + ' top',
					id: 'fixedHeader',
					end: 'bottom bottom',
					onEnter: () => {
						animateElements(true)
					},
					onLeaveBack: () => {
						animateElements(false);
					}
				})
			}
			function stickyHeader() {

				let sc = ScrollTrigger.create({
					trigger: 'body',
					start: 'top+=' + start + ' top',
					id: 'stickyHeader',
					end: 'bottom bottom',
					onEnter: () => {
						document.querySelector('.site-header').classList.add('header--sticked');
						setTimeout(() => {
							animateElements(true, 0);
						}, 500);
					},
					onLeaveBack: () => {
						document.querySelector('.site-header').classList.remove('header--sticked');
						animateElements(false);
					},
					onUpdate: (self) => {
						if (self.direction == -1) {

							gsap.to(siteHeader, {
								yPercent: 0,
							})



						} else {
							gsap.to(siteHeader, {
								yPercent: -100,
							})

						}

					},
				})


			}

			if (window.barba) {

				barba.hooks.after(() => {

					setTimeout(() => {
						let scrolltriggers = ScrollTrigger.getAll(),
							newStart;

						scrolltriggers.forEach(function (st) {

							if ((st.pin != null) && (st.start <= window.innerHeight)) {
								newStart = st.end;
							} else {
								newStart = 0;
							}
						})

						let fixedHeader = ScrollTrigger.getById('fixedHeader'),
							stickyHeader = ScrollTrigger.getById('stickyHeader');

						if (fixedHeader) {

							animateElements(false);

							fixedHeader.kill(true);

							let sc = ScrollTrigger.create({
								trigger: 'body',
								start: 'top+=' + newStart + ' top',
								id: 'fixedHeader',
								end: 'bottom bottom',
								onEnter: () => {
									animateElements(true)
								},
								onLeaveBack: () => {
									animateElements(false);

								}
							})

						}

						if (stickyHeader) {
							stickyHeader.kill(true);

							gsap.to(siteHeader, {
								yPercent: 0,
							})

							let sc = ScrollTrigger.create({
								trigger: 'body',
								start: 'top+=' + start + ' top',
								id: 'stickyHeader',
								end: 'bottom bottom',
								onEnter: () => {
									document.querySelector('.site-header').classList.add('header--sticked')
								},
								onLeaveBack: () => {
									document.querySelector('.site-header').classList.remove('header--sticked')
								},
								onUpdate: (self) => {

									if (self.direction == -1) {

										gsap.to(siteHeader, {
											yPercent: 0,
										})
									} else {
										gsap.to(siteHeader, {
											yPercent: -100,
										})
									}

								},

							})

						}


					})
				}, 100);

			}
			header.classList.contains('header--fixed') ? fixedHeader() : header.classList.contains('header--sticky') ? stickyHeader() : '';

		}, 50)



		function sarenFullscreenSubmenu() {

			let submenus = document.querySelectorAll('.saren-sub-menu-wrap'),
				menuItem = document.querySelectorAll('.menu-item'),
				transformY = 0;

			function subWrapAct(open, sub) {

				if (open) {

					sub.classList.add('active')
					transformY = 0;
					sub.dataset.overlay ? document.querySelector('.sub--wrap--overlay').classList.add('active') : '';

					if (sub.classList.contains('reveal--style--expand')) {
						gsap.to(sub, {
							height: 'auto',
							duration: 1,
							ease: 'power3.inOut'
						})

					} else {

						gsap.to(sub, {
							y: '0',
							duration: 1.25,
							ease: 'expo.out'
						})

					}

				} else {

					document.querySelector('.sub--wrap--overlay.active') ? document.querySelector('.sub--wrap--overlay.active').classList.remove('active') : '';

					if (sub.classList.contains('reveal--style--expand')) {
						gsap.to(sub, {
							height: 0,
							duration: .75,
							ease: 'power3.inOut'
						})

					} else {

						gsap.to(sub, {
							y: '-120%',
							duration: 1.25,
							ease: 'expo.out'
						})

					}


				}

			}

			menuItem.forEach(function (item, i) {

				if (parents(item, '.menu--horizontal').length) {

					if (item.classList.contains('saren-has-children') && parents(item, '.site-header').length) {

						let classList = item.className.split(' '),
							subIDClass = classList.find(cls => cls.startsWith('sub_id')),
							id = subIDClass ? subIDClass.substring("sub_id'".length) : '',
							submenu = document.querySelector('.sub_' + id);

						if (submenu.classList.contains('reveal--style--expand')) {

							let menuRect = parents(item, '.menu--horizontal')[0].getBoundingClientRect();

							gsap.set(submenu, {
								top: menuRect.top - 20,
								left: menuRect.left - 20,
								// maxWidth: menuRect.width * 2,
								height: 0
							})

						}


					}

					item.addEventListener('mouseenter', function () {

						if (item.classList.contains('saren-has-children') && parents(item, '.site-header').length) {

							let classList = item.className.split(' '),
								subIDClass = classList.find(cls => cls.startsWith('sub_id')),
								id = subIDClass ? subIDClass.substring("sub_id'".length) : '',
								findSub = document.querySelector('.sub_' + id);
							disableScroll();

							if (document.querySelector('.saren-sub-menu-wrap.active')) {

								document.querySelectorAll('.saren-sub-menu-wrap.active').forEach(sub => subWrapAct(false, sub))
								document.querySelector('.saren-sub-menu-wrap.active').classList.remove('active');

							}

							subWrapAct(true, findSub);

						} else {
							document.querySelectorAll('.saren-sub-menu-wrap').forEach(sub => subWrapAct(false, sub))

						}

					})

				}

			})

			submenus.forEach(function (submenu, i) {

				submenu.addEventListener('mouseleave', function () {
					enableScroll();
					subWrapAct(false, submenu)
				})
			});




		}
		matchMedia.add({
			isDesktop: "(min-width: 450px)"

		}, (context) => {
			let {
				isDesktop
			} = context.conditions;
			sarenFullscreenSubmenu();
		});

	}

	function sarenFooter() {

		if (!document.querySelector('.site-footer')) {
			return false;
		}

		var footer = document.querySelector('.site-footer');

		if (footer.classList.contains('footer--fixed') && !document.body.classList.contains('e-preview--show-hidden-elements')) {

			clearProps(footer)
			gsap.set(footer, {
				yPercent: -100,
				zIndex: -1
			})

			var fxdFooter = ScrollTrigger.create({
				trigger: footer,
				start: 'bottom bottom',
				pin: true,
				id: 'fixedFooter',
				pinSpacing: false,
			});

			matchMedia.add({
				isMobile: "(max-width: 550px)"

			}, (context) => {

				let {
					isMobile
				} = context.conditions;

				fxdFooter.kill(true);
				clearProps(footer);

			});

		}

	}


	function sarenSmoothscroll() {

		if (document.body.classList.contains('smooth-scroll')) {

			const lenis = new Lenis();

			lenis.on('scroll', ScrollTrigger.update);

			gsap.ticker.add((time) => {
				lenis.raf(time * 1000);
			});

			window.sarenLenis = lenis;
		} else {
			window.sarenLenis = false
		}

	}

	sarenSmoothscroll();

	function sarenPopups() {

		var popups = document.querySelectorAll('.saren--popup');

		if (document.body.classList.contains('e-preview--show-hidden-elements')) {
			return false;
		}

		popups.forEach(popup => {

			var location = popup.dataset.location,
				delay = popup.dataset.displayDelay,
				scrollDisable = popup.dataset.disableScroll,
				popupCont = popup.querySelectorAll('.e-con')[1],
				closeButton = popup.querySelector('.pop--close'),
				overlay = popup.querySelector('.saren--popup--overlay'),
				animation = popup.dataset.animation;

			setTimeout(() => {

				gsap.fromTo(popup, {
					scale: animation === 'center' ? 0.9 : 1,
					opacity: animation === 'center' ? 0 : 1,
					x: animation === 'left' ? '-100vw' : animation === 'right' ? '100vw' : 0,
					y: animation === 'top' ? '-100vh' : animation === 'bottom' ? '100vh' : 0,
				}, {
					scale: 1,
					opacity: 1,
					x: 0,
					y: 0,
					duration: 1.5,
					ease: 'power3.out',
					onStart: () => {
						popup.style.display = 'block';
					},
					onComplete: () => {
						closeButton.classList.add('active');
						gsap.set(closeButton, {
							top: popupCont.getBoundingClientRect().top,
							left: popupCont.getBoundingClientRect().left + popupCont.getBoundingClientRect().width
						})
					}
				})

				if (scrollDisable) {
					disableScroll();
				}

			}, parseInt(delay));

			closeButton.addEventListener('click', () => {
				if (scrollDisable) {
					enableScroll();
				}

				gsap.to(popup, {
					duration: .65,
					ease: 'power3.in',
					scale: animation === 'center' ? 0.9 : 1,
					opacity: animation === 'center' ? 0 : 1,
					x: animation === 'left' ? '-100vw' : animation === 'right' ? '100vw' : 0,
					y: animation === 'top' ? '-100vh' : animation === 'bottom' ? '100vh' : 0,
					onComplete: () => {
						popup.style.display = 'none';
					}
				})

			})

			if (overlay) {
				overlay.addEventListener('click', () => {
					closeButton.click();
				})
			}

			popup.querySelectorAll('a').forEach(link => {
				link.addEventListener('click', () => {
					closeButton.click();
				})
			})

		})


	}

	function pePopup(scope, wrapper) {

		let popButton = scope.querySelector('.pe--pop--button'),
			popup = scope.querySelector('.pe--styled--popup'),
			overlay = scope.querySelector('.pop--overlay'),
			close = scope.querySelector('.pop--close'),
			topSpacing = getComputedStyle(popup).getPropertyValue('--topSpacing');


		function popupact(open) {

			if (open) {

				if (parents(popup, '.pinned_true').length) {
					parents(popup, '.pinned_true')[0].style.transition = 'none';
					parents(popup, '.pinned_true')[0].style.transform = 'none';
				}

				if (parents(popup, '.e-transform').length) {
					parents(popup, '.e-transform')[0].style.transition = 'none';
					parents(popup, '.e-transform')[0].style.transform = 'none';
					parents(popup, '.elementor-widget-container')[0].style.transition = 'none';
					parents(popup, '.elementor-widget-container')[0].style.transform = 'none';
				}

				scope.classList.contains('pop--disable--scroll--true') ? disableScroll() : '';
				wrapper.classList.add('pop--active');

				gsap.fromTo(popup, {
					xPercent: scope.classList.contains('pop--behavior--center') || scope.classList.contains('pop--behavior--top') || scope.classList.contains('pop--behavior--bottom') ? -50 : scope.classList.contains('pop--behavior--left') ? -120 : scope.classList.contains('pop--behavior--right') ? 120 : 0,
					yPercent: scope.classList.contains('pop--behavior--top') ? -200 : scope.classList.contains('pop--behavior--bottom') ? 200 : scope.classList.contains('pop--behavior--center') ? -50 : 0,
					scale: scope.classList.contains('pop--behavior--center') ? 0.7 : 1,
					opacity: scope.classList.contains('pop--behavior--center') ? 0 : 1,
				}, {
					xPercent: scope.classList.contains('pop--behavior--center') || scope.classList.contains('pop--behavior--top') || scope.classList.contains('pop--behavior--bottom') ? -50 : 0,
					yPercent: scope.classList.contains('pop--behavior--center') ? -50 : 0,
					y: 0,
					opacity: 1,
					scale: 1,
					visibility: 'visible',
					duration: 1,
					ease: 'power3.out',
					overwrite: true
				});

			} else {

				let backTop = parseInt(topSpacing) ? -200 - parseInt(topSpacing) : -200;

				scope.classList.contains('pop--disable--scroll--true') ? enableScroll() : '';
				wrapper.classList.remove('pop--active');
				gsap.to(popup, {
					xPercent: scope.classList.contains('pop--behavior--center') || scope.classList.contains('pop--behavior--top') || scope.classList.contains('pop--behavior--bottom') ? -50 : scope.classList.contains('pop--behavior--left') ? -120 : scope.classList.contains('pop--behavior--right') ? 120 : 0,
					yPercent: scope.classList.contains('pop--behavior--top') ? backTop : scope.classList.contains('pop--behavior--bottom') ? 200 : scope.classList.contains('pop--behavior--center') ? -50 : 0,
					scale: scope.classList.contains('pop--behavior--center') ? 0.7 : 1,
					opacity: scope.classList.contains('pop--behavior--center') ? 0 : 1,
					onComplete: () => {
						gsap.set(popup, {
							visibility: 'hidden',
						})
					},
					duration: 1,
					ease: 'power3.out',
					overwrite: true
				})
			}
		}

		if (scope.classList.contains('pop--action--hover')) {
			popButton.addEventListener('mouseenter', () => popupact(true));
			popup.addEventListener('mouseleave', () => popupact(false));
		}

		popButton.addEventListener('click', () => popupact(true));
		overlay.addEventListener('click', () => popupact(false));
		close.addEventListener('click', () => popupact(false));

		window.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') {
				if (wrapper.classList.contains('pop--active')) {
					popupact(false)
				}
			}
		})

	}


	function sarenTransitionsHandle() {

		if (!document.querySelector('.page--transitions')) {
			return false;
		}
		var transitions = document.querySelector('.page--transitions');

		if (transitions.querySelector('.page--transition--caption')) {

			var caption = transitions.querySelector('.page--transition--caption');

			if (caption.classList.contains('capt--simple')) {
				if (caption.classList.contains('capt--chars') || caption.classList.contains('capt--words')) {
					new SplitText(caption, {
						type: 'lines , words, chars',
						wordsClass: 'transition_caption_word',
						linesClass: 'transition_caption_line',
						charsClass: 'transition_caption_char',
					});

				}

			} else if (caption.classList.contains('capt--repeater')) {

				let repeaterInner = transitions.querySelector('.capt--repeater--inner'),
					texts = repeaterInner.querySelectorAll('span'),
					repeaterTl = gsap.timeline({
						repeat: -1,
						paused: true,
						id: 'transCaptTl'
					});

				for (let i = 1; i < texts.length; i++) {
					let yVal = (100 / texts.length) * i;
					repeaterTl.to(repeaterInner, {
						yPercent: -yVal,
						duration: .65,
						ease: 'power2.inOut',
						delay: .4,
					})
				}

			}
		}



	}
	sarenTransitionsHandle()

	function sarenPageTransitions(tl, cycle, trigger = false) {

		var transitions = document.querySelector('.page--transitions'),
			wrapper = transitions.querySelector('.pt--wrapper'),
			type = transitions.dataset.type,
			direction = transitions.dataset.direction;

		cycle === 'leave' ? transitions.classList.add('running') : '';

		if (document.querySelector('.is-pinning')) {

			gsap.set(document.querySelector('.is-pinning'), {
				top: window.scrollY
			})
		}

		if (type === 'overlay') {

			var curveValue = transitions.classList.contains('pt__curved') ? getComputedStyle(transitions).getPropertyValue('--curve').trim() : 0;

			if (cycle === 'leave') {

				animateElements(tl, cycle);

				tl.fromTo(transitions, {
					borderTopRightRadius: direction === 'up' ? curveValue : direction === 'left' ? curveValue : 0,
					borderTopLeftRadius: direction === 'up' ? curveValue : direction === 'right' ? curveValue : 0,
					borderBottomRightRadius: direction === 'down' ? curveValue : direction === 'left' ? curveValue : 0,
					borderBottomLeftRadius: direction === 'down' ? curveValue : direction === 'right' ? curveValue : 0,
				}, {
					width: '100%',
					height: '100%',
					borderRadius: 0,
					duration: 1.25,
					ease: 'expo.inOut',
					onComplete: () => {
						html.classList.add('transition--ready');
					}
				}, 0)
			}

			if (cycle === 'beforeEnter') {
				tl.to('main', {
					duration: .5
				})
				let mains = document.querySelectorAll('main');
				mains[0].remove();
			}

			if (cycle === 'afterEnter') {

				animateElements(tl, cycle);

				tl.to(transitions, {
					width: direction === 'left' || direction === 'right' ? '0%' : '100%',
					height: direction === 'up' || direction === 'down' ? '0%' : '100%',
					borderTopRightRadius: direction === 'down' ? curveValue : direction === 'right' ? curveValue : 0,
					borderTopLeftRadius: direction === 'down' ? curveValue : direction === 'left' ? curveValue : 0,
					borderBottomRightRadius: direction === 'up' ? curveValue : direction === 'right' ? curveValue : 0,
					borderBottomLeftRadius: direction === 'up' ? curveValue : direction === 'left' ? curveValue : 0,
					duration: 1.25,
					ease: 'expo.inOut',
					onComplete: () => {
						transitions.classList.remove('running');
						html.classList.remove('transition--ready');
					}
				}, 0)

			}

		}

		if (type === 'slide') {

			let overlay = transitions.querySelector('.pt--overlay');

			if (cycle === 'leave') {
				transitions.classList.add('transition--start');
				animateElements(tl, cycle);

				tl.to('main', {
					duration: 1,
					y: direction === 'up' ? '-100vh' : direction === 'down' ? '100vh' : '0vh',
					x: direction === 'left' ? '100vw' : direction === 'right' ? '-100vw' : '0vw',
					ease: 'expo.inOut'
				}, 0);

				tl.to('.slide--op', {
					duration: 1,
					opacity: .6,
					visibility: 'visible',
					ease: 'expo.inOut',
					onComplete: () => {
						clearProps(document.querySelector('.slide--op'))
					}
				}, 0);

				tl.to(overlay, {
					height: '100%',
					width: '100%',
					duration: 1,
					visibility: 'visible',
					ease: 'expo.inOut',
					borderRadius: 0,
					onComplete: () => {
						html.classList.add('transition--ready');
					}
				}, 0)
			}

			if (cycle === 'beforeEnter') {

				tl.to('main', {
					duration: .3
				})

				let mains = document.querySelectorAll('main');
				mains[0].remove();
			}

			if (cycle === 'afterEnter') {
				animateElements(tl, cycle, 0);
				tl.to(overlay, {
					height: direction === 'up' || direction === 'down' ? '0%' : '100%',
					width: direction === 'left' || direction === 'right' ? '0%' : '100%',
					duration: 1.25,
					visibility: 'visible',
					ease: 'expo.inOut',
					// borderRadius: 50
				}, 0.1)

				tl.fromTo('main', {
					y: direction === 'up' ? '100vh' : direction === 'down' ? '-100vh' : '0vh',
					x: direction === 'left' ? '-100vw' : direction === 'right' ? '100vh' : '0vw',
				}, {
					y: 0,
					x: 0,
					duration: 1.25,
					visibility: 'visible',
					ease: 'expo.inOut'
				}, 0.1)

				tl.to('.slide--op', {
					duration: 1.25,
					opacity: 0,
					visibility: 'visible',
					ease: 'expo.inOut',
					onComplete: () => {
						clearProps(['.slide--op', 'main', wrapper, '.pt--overlay']);
						ScrollTrigger.refresh();
						html.classList.remove('transition--ready');
						transitions.classList.remove('transition--start');
						transitions.classList.remove('running');
					}
				}, 0.4)

			}

		}

		if (type == 'columns' || type == 'rows') {

			let spans = transitions.querySelectorAll('.page--transition--column , .page--transition--row'),
				length = spans.length;

			transitions.classList.add('transition--start');

			if (cycle === 'leave') {
				animateElements(tl, cycle, .7)

				tl.to(spans, {
					height: type === 'columns' ? '100vh' : '',
					width: type === 'rows' ? '100vw' : '',
					duration: 1.25,
					ease: 'expo.inOut',
					stagger: {
						grid: [1, length],
						from: transitions.dataset.stagger,
						amount: .3,
					},
					onComplete: () => {
						html.classList.add('transition--ready');
					}
				}, 0)
			}

			if (cycle === 'beforeEnter') {

				tl.to('main', {
					duration: .1
				})

				let mains = document.querySelectorAll('main');
				mains[0].remove();
			}

			if (cycle === 'afterEnter') {
				animateElements(tl, cycle, 0)
				tl.to(spans, {
					height: type === 'columns' ? '0vh' : '',
					width: type === 'rows' ? '0vw' : '',
					duration: 1.25,
					ease: 'expo.inOut',
					stagger: {
						grid: [1, length],
						from: transitions.dataset.stagger,
						amount: .3,
					},
					onComplete: () => {
						html.classList.remove('transition--ready');
						transitions.classList.remove('transition--start');
					}
				}, 0)
			}
		}

		if (type === 'blocks') {


			let spans = transitions.querySelectorAll('.page--transition--block'),
				length = spans.length,
				animation = transitions.dataset.blocksAnimation;

			transitions.classList.add('transition--start');

			if (cycle === 'leave') {
				animateElements(tl, cycle, 0.5)
				tl.to(spans, {
					width: animation === 'scale' || animation === 'left' || animation === 'right' ? '100%' : '',
					height: animation === 'scale' || animation === 'top' || animation === 'bottom' ? '100%' : '',
					opacity: 1,
					duration: 1.25,
					ease: 'expo.inOut',
					stagger: {
						grid: [1, length],
						from: transitions.dataset.stagger,
						amount: .3,
					},
					onComplete: () => {
						html.classList.add('transition--ready');
					}
				}, 0)
			}

			if (cycle === 'beforeEnter') {

				tl.to('main', {
					duration: .1
				})

				let mains = document.querySelectorAll('main');
				mains[0].remove();
			}

			if (cycle === 'afterEnter') {
				animateElements(tl, cycle, 0)

				tl.to(spans, {
					width: animation === 'scale' || animation === 'left' || animation === 'right' ? '0%' : '',
					height: animation === 'scale' || animation === 'top' || animation === 'bottom' ? '0%' : '',
					opacity: animation === 'fade' ? 0 : 1,
					duration: 1.25,
					ease: 'expo.inOut',
					stagger: {
						grid: [1, length],
						from: transitions.dataset.stagger,
						amount: .3,
					},
					onComplete: () => {
						html.classList.remove('transition--ready');
						transitions.classList.remove('transition--start');
					}
				}, 0)

			}

		}

		if (type == 'fade') {

			if (cycle === 'leave') {

				transitions.classList.add('transition--start');

				if (transitions.classList.contains('pt__fade-simple')) {

					animateElements(tl, cycle);

					tl.to('main', {
						duration: 1,
						opacity: 0,
						ease: 'expo.inOut',
						onComplete: () => {
							html.classList.add('transition--ready');
							clearProps(transitions);
						}
					})
				} else {

					animateElements(tl, cycle);

					if (transitions.classList.contains('pt__center')) {

						tl.to(transitions, {
							"--secondaryCount": '100%',
							duration: 1,
							ease: 'expo.inOut',
						}, 0)

						tl.to(transitions, {
							"--mainCount": '100%',
							duration: 1,
							ease: 'expo.inOut',
							onComplete: () => {
								html.classList.add('transition--ready');
								clearProps(transitions);
							}
						}, .2)
					} else {
						tl.to(transitions, {
							"--secondaryCount": '0%',
							duration: 1,
							ease: 'expo.inOut',
						}, 0)

						tl.to(transitions, {
							"--mainCount": '0%',
							duration: 1,
							ease: 'expo.inOut',
							onComplete: () => {
								html.classList.add('transition--ready');
								clearProps(transitions);
							}
						}, .2)
					}

				}

			}

			if (cycle === 'beforeEnter') {

				tl.to('main', {
					duration: transitions.classList.contains('pt__fade-simple') ? 2 : .6,
				})

				if (transitions.classList.contains('pt__fade-simple')) {
					gsap.to('main', {
						opacity: 0
					})


					let mains = document.querySelectorAll('main');
					mains[0].remove();


				}
			}

			if (cycle === 'afterEnter') {

				animateElements(tl, cycle, 0);

				if (transitions.classList.contains('pt__fade-simple')) {
					tl.fromTo('main', {
						opacity: 0
					}, {
						duration: 1,
						ease: 'expo.out',
						opacity: 1,
						onComplete: () => {
							clearProps(transitions);
							transitions.classList.remove('running');
							html.classList.remove('transition--ready');
							transitions.classList.remove('transition--start');


						}
					})
				} else {

					if (transitions.classList.contains('pt__center')) {
						tl.to(transitions, {
							"--mainCount": '100%',
							duration: 1,
							ease: 'expo.inOut',
						}, 0)

						tl.to(transitions, {
							"--secondaryCount": '100%',
							duration: 1,
							ease: 'expo.inOut',
							onComplete: () => {
								clearProps(transitions);

								transitions.classList.remove('running');
								html.classList.remove('transition--ready');
								transitions.classList.remove('transition--start');


							}
						}, .2)
					} else {
						tl.to(transitions, {
							"--secondaryCount": '0%',
							duration: 1,
							ease: 'expo.inOut',
						}, 0)

						tl.to(transitions, {
							"--mainCount": '0%',
							duration: 1,
							ease: 'expo.inOut',
							onComplete: () => {
								clearProps(transitions);

								transitions.classList.remove('running');
								html.classList.remove('transition--ready');
								transitions.classList.remove('transition--start');


							}
						}, .2)
					}

				}

			}

		}

		function animateElements(tl, cycle, delay = .2) {

			if (cycle === 'leave') {

				if (transitions.querySelector('.page--transition--caption')) {
					let caption = transitions.querySelector('.page--transition--caption');

					if (caption.classList.contains('capt--simple') || caption.classList.contains('capt--marquee')) {

						if (caption.classList.contains('capt--chars') || caption.classList.contains('capt--words')) {

							let target = caption.classList.contains('capt--chars') ? caption.querySelectorAll('.transition_caption_char') : caption.classList.contains('capt--words') ? caption.querySelectorAll('.transition_caption_word') : caption;

							gsap.fromTo(target, {
								y: '110%'
							}, {
								y: '0%',
								duration: caption.classList.contains('capt--chars') ? .5 : 1,
								ease: 'power3.out',
								delay: delay,
								stagger: caption.classList.contains('capt--chars') ? .02 : .1,
							})

						} else if (caption.classList.contains('capt--fade') || caption.classList.contains('capt--marquee')) {

							gsap.fromTo([caption.querySelector('span'), caption.querySelector('.pb--marquee')], {
								y: 100,
								opacity: 0,
							}, {
								opacity: 1,
								y: 0,
								duration: 1,
								delay: delay,
								ease: 'expo.out',
							})

						} else if (caption.classList.contains('capt--progress')) {

							tl.fromTo(caption.querySelector('span.not-clone'), {
								opacity: 0
							}, {
								opacity: .3,
								duration: .3,
								delay: delay,
								ease: 'expo.out',
							})

							tl.fromTo(caption.querySelector('span.capt--clone'), {
								width: '0%',
								opacity: 1,
							}, {
								width: '100%',
								opacity: 1,
								duration: 2,
								delay: delay,
								ease: 'expo.out',
							})

						}

					} else if (caption.classList.contains('capt--repeater')) {

						let transTl = gsap.getById('transCaptTl');
						transTl.play();
						gsap.fromTo(caption, {
							opacity: 0,
						}, {
							opacity: 1,
							duration: 1,
							delay: delay,
							ease: 'expo.out',
						})

					}

				}

				if (transitions.querySelector('.pt--logo')) {

					let logo = transitions.querySelector('.pt--element.pt--logo .pt--element--wrap');

					gsap.fromTo(logo, {
						y: 50,
						opacity: 0
					}, {
						y: 0,
						opacity: 1,
						duration: 1,
						ease: 'power3.out',
						delay: delay
					})

				}


			} else if (cycle === 'afterEnter') {

				if (transitions.querySelector('.page--transition--caption')) {
					let caption = transitions.querySelector('.page--transition--caption');

					if (caption.classList.contains('capt--simple') || caption.classList.contains('capt--marquee')) {

						if (caption.classList.contains('capt--chars') || caption.classList.contains('capt--words')) {

							let target = caption.classList.contains('capt--chars') ? caption.querySelectorAll('.transition_caption_char') : caption.classList.contains('capt--words') ? caption.querySelectorAll('.transition_caption_word') : caption;

							gsap.to(target, {
								y: '-110%',
								duration: caption.classList.contains('capt--chars') ? .5 : 1,
								ease: 'power3.in',
								delay: delay,
								stagger: caption.classList.contains('capt--chars') ? -0.02 : -0.1,
								delay: .25
							})

						} else if (caption.classList.contains('capt--fade') || caption.classList.contains('capt--marquee')) {

							gsap.to([caption.querySelector('span'), caption.querySelector('.pb--marquee')], {
								opacity: 0,
								y: -100,
								duration: 1,
								delay: delay,
								ease: 'expo.in',
							})

						} else if (caption.classList.contains('capt--progress')) {

							tl.to(caption.querySelectorAll('span'), {
								opacity: 0,
								duration: .3,
								delay: delay,
								ease: 'expo.in',
							})
						}

					} else if (caption.classList.contains('capt--repeater')) {

						let transTl = gsap.getById('transCaptTl');
						transTl.pause();
						gsap.to(caption, {
							opacity: 0,
							duration: 1,
							delay: delay,
							ease: 'expo.out',
						})

					}

				}

				if (transitions.querySelector('.pt--logo')) {

					let logo = transitions.querySelector('.pt--element.pt--logo .pt--element--wrap');

					gsap.fromTo(logo, {
						y: 0,
						opacity: 1
					}, {
						y: -50,
						opacity: 0,
						duration: 1,
						ease: 'power3.in',
						delay: delay
					})

				}

			}



		}



	}

	function elementHandle(element, tl) {

		if (document.querySelector('.showcase-table')) {
			tl.to(element, {
				rotate: 0,
				duration: .75,
				ease: 'expo.out'
			})
		}

		if (document.querySelector('.saren-showcase-carousel')) {

			tl.to(element[0].querySelector('img'), {
				x: 0,
				width: '100%',
				duration: 1.25,
				ease: 'expo.inOut'
			}, 0)

			tl.to(element[0].querySelector('.parallax--wrap'), {
				x: 0,
				y: 0,
				scale: 1,
				width: '100%',
				height: '100%',
				duration: 1.25,
				ease: 'expo.inOut'
			}, 0)
		}

		if (document.querySelector('.saren-showcase-rotate')) {

			tl.to(element[0], {
				duration: 1.25,
				onStart: () => {
					element[0].click();
				}

			}, 0)


		}

		if (document.querySelector('.fullscreen--slideshow')) {


			new SplitText(['.swiper-slide-active .project--top'], {
				type: 'words',
				wordsClass: 'ss_word',
				reduceWhiteSpace: true,
			});

			new SplitText(['.swiper-slide-active .project--excerpt'], {
				type: 'words, lines',
				wordsClass: 'ss_word',
				linesClass: 'ss_line',
				reduceWhiteSpace: true,
			});

			tl.to('.ss_word', {
				yPercent: -100,
				duration: 1,
				ease: 'power4.inOut',
				stagger: 0.03
			}, 0)

			tl.to('.swiper-slide-active .project--button', {
				yPercent: -100,
				xPercent: 0,
				opacity: 0,
				duration: 1,
				ease: 'power4.in',
				stagger: 0.03
			}, 0)

		}


	}

	function sarenProjectTransitions(tl, image, behavior, target) {

		let rect = image.getBoundingClientRect(),
			styles = window.getComputedStyle(image),
			transitionMedia = image.cloneNode(true);

		var handleScroll = 0;
		if (behavior === 'beforeLeave') {

			if (parents(image, '.needs--handle').length) {

				let element = parents(image, '.needs--handle');

				elementHandle(element, tl);
			} else {
				tl.to(image, {
					duration: .1
				})
			}


		}

		if (behavior === 'leave') {

			for (var i = 0; i < styles.length; i++) {
				var prop = styles[i];
				transitionMedia.style[prop] = styles.getPropertyValue(prop);
			}

			transitionMedia.classList.add('transition--media');
			transitionMedia.querySelector('.pe-video') ? transitionMedia.classList.add('tm--video') : '';

			document.body.appendChild(transitionMedia);

			gsap.set(transitionMedia, {
				position: 'fixed',
				top: rect.y,
				left: rect.x,
				width: rect.width,
				height: rect.height,
				zIndex: 99999
			});

			tl.to(transitionMedia, {
				duration: transitionMedia.querySelector('.pe-video') ? 2 : .5,
			}, 0)


			if (transitionMedia.querySelector('.pe-video')) {
				tl.to(transitionMedia.querySelector('iframe'), {
					opacity: 1,
					duration: .1
				}, 2)

			}

		}

		if (behavior === 'enter') {

			gsap.to('main', {
				opacity: 0,
				duration: .4,
				ease: 'power3.in',
				onComplete: () => {

					window.scrollTo(0, 0);


					document.querySelector('main').remove();

					let transitionMedia = document.querySelector('.transition--media');

					if (transitionMedia.querySelector('.pe-video')) {

						tl.to(transitionMedia, {
							clipPath: 'inset(0% 0% 100% 0%)',
							duration: 1,
							ease: 'expo.inOut'
						})

						tl.play();

					} else {

						let state = Flip.getState(transitionMedia, {
							props: 'borderRadius',
						}),
							targetRect = target.getBoundingClientRect(),
							targetStyles = window.getComputedStyle(target);

						for (var i = 0; i < targetStyles.length; i++) {
							var prop = targetStyles[i];
							transitionMedia.style[prop] = targetStyles.getPropertyValue(prop);
						}

						gsap.set(transitionMedia, {
							position: 'fixed',
							top: targetRect.y + handleScroll,
							left: targetRect.x,
							width: targetRect.width,
							height: targetRect.height
						});


						let flip = Flip.from(state, {
							duration: 1,
							ease: 'expo.inOut',
						})

						tl.add(flip);

						if (target.classList.contains('parallax--image')) {

							gsap.to(transitionMedia.querySelector('img'), {
								scale: 1.2,
								duration: 1,
								ease: 'expo.inOut',
							})

						}

						tl.play();

					}

				}
			})

		}

	}

	window.handleScroll = 0;
	function sarenProductTransitions(tl, image, cycle, target) {

		if (cycle === 'beforeLeave') {

			window.handleScroll = 0

			let rect = image.getBoundingClientRect(),
				styles = window.getComputedStyle(image),
				transitionMedia = image.cloneNode(true);

			for (var i = 0; i < styles.length; i++) {
				var prop = styles[i];
				transitionMedia.style[prop] = styles.getPropertyValue(prop);
			}

			transitionMedia.classList.add('transition--media');
			transitionMedia.querySelector('.pe-video') ? transitionMedia.classList.add('tm--video') : '';

			document.body.appendChild(transitionMedia);

			gsap.set(transitionMedia, {
				position: 'fixed',
				top: rect.y,
				left: rect.x,
				width: rect.width,
				height: rect.height,
				zIndex: 999999,
				opacity: 0
			});

			tl.to(transitionMedia, {
				duration: .5,
				opacity: 1
			})

		}

		if (cycle === 'leave') {
			tl.to('main , .site-footer', {
				opacity: 0,
				duration: .65,
				ease: 'expo.out',
			})

		}
		if (cycle === 'beforeEnter') {

			tl.to('main , .site-footer', {
				opacity: 0,
				duration: .1,
				ease: 'expo.out',
				onComplete: () => {
					document.querySelectorAll('main')[0].remove();
				}
			})

		}

		if (cycle === 'after') {

			let transitionMedia = document.querySelector('.transition--media');

			let state = Flip.getState(transitionMedia, {
				props: 'borderRadius',
			}),
				targetRect = target.getBoundingClientRect(),
				targetStyles = window.getComputedStyle(target);

			for (var i = 0; i < targetStyles.length; i++) {
				var prop = targetStyles[i];
				transitionMedia.style[prop] = targetStyles.getPropertyValue(prop);
			}


			var topY = 0;
			if (parents(target, '.pinned_true').length) {
				var parent = parents(target, '.pinned_true')[0];
				var style = window.getComputedStyle(parent);
				var matrix = new WebKitCSSMatrix(style.transform);
				topY = matrix.m42;
			}

			gsap.set(transitionMedia, {
				position: 'fixed',
				opacity: 1,
				visibility: 'visible',
				zIndex: 99999999,
				top: targetRect.y + window.handleScroll - topY,
				left: targetRect.x,
				width: targetRect.width,
				height: targetRect.height
			});

			let flip = Flip.from(state, {
				duration: 1,
				ease: 'expo.inOut',
			})

			tl.add(flip);

			if (target.classList.contains('parallax--image')) {

				gsap.to(transitionMedia.querySelector('img'), {
					scale: 1.2,
					duration: 1,
					ease: 'expo.inOut',
				})

			}
			tl.play();
		}

	}

	if (history.scrollRestoration) {
		history.scrollRestoration = "manual";
	}
	ScrollTrigger.clearScrollMemory('manual');

	document.body.classList.add('window--initialized')

	if (document.querySelector('.page--transitions')) {

		barba.init({
			timeout: 15000,
			debug: false,
			transitions: [
				{
					name: 'default-transition',
					leave(trigger) {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								onComplete: () => {

									resolve();

								}
							})

							let link = trigger.trigger;

							if (trigger && trigger.trigger !== 'back' && trigger.trigger !== 'popstate' && trigger.trigger !== 'forward' && link.classList.contains('menu--link') && parents(link, '.nav--fullscreen , .nav--popup').length) {

								$('.menu--toggle').trigger('click');

							}


							sarenPageTransitions(tl, 'leave', trigger)

						})

					},
					beforeEnter(trigger) {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								onStart: () => {

									resolve();

								},
							})

							sarenPageTransitions(tl, 'beforeEnter', trigger)

						})
					},
					afterEnter(trigger) {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								onStart: () => {

									setTimeout(() => {
										ScrollTrigger.refresh();
									}, 100);

									resolve();
									clearProps('main');
								},
								onUpdate: () => {

								}
							})

							sarenPageTransitions(tl, 'afterEnter', trigger)

						})
					},
				}, {
					name: 'project-transition',
					from: {
						custom: ({
							trigger
						}) => {
							return trigger.classList && trigger.classList.contains('barba--trigger')
						},
					},
					beforeLeave(trigger) {

						return new Promise(function (resolve, reject) {

							let id = trigger.trigger.dataset.id,
								image = trigger.trigger.querySelector('.project__image__' + id) ? trigger.trigger.querySelector('.project__image__' + id) : document.querySelector('.project__image__' + id),
								tl = gsap.timeline({
									onComplete: () => {
										resolve();

									}
								})

							sarenProjectTransitions(tl, image, 'beforeLeave', false);

						})
					},
					leave(trigger) {

						return new Promise(function (resolve, reject) {

							let id = trigger.trigger.dataset.id,
								image = trigger.trigger.querySelector('.project__image__' + id) ? trigger.trigger.querySelector('.project__image__' + id) : document.querySelector('.project__image__' + id),
								tl = gsap.timeline({
									onComplete: () => {
										resolve();
									}
								})
							sarenProjectTransitions(tl, image, 'leave', false);
						})

					},
					enter(trigger) {
						return new Promise(function (resolve, reject) {

							let id = trigger.trigger.dataset.id,
								image = trigger.trigger.querySelector('.project__image__' + id) ? trigger.trigger.querySelector('.project__image__' + id) : document.querySelector('.project__image__' + id),
								targetImage = document.querySelector('.featured__' + id),
								tl = gsap.timeline({
									paused: true,
									onComplete: () => {
										setTimeout(() => {
											resolve();
											document.querySelector('.transition--media').remove();
											gsap.set('main', {
												opacity: 1
											})
										}, 10);


									}
								});

							sarenProjectTransitions(tl, image, 'enter', targetImage);


						})
					}
				}, {
					name: 'product-transition',
					from: {
						custom: ({
							trigger
						}) => {
							return trigger.classList && trigger.classList.contains('product--barba--trigger')
						},
					},
					beforeLeave(trigger) {

						return new Promise(function (resolve, reject) {

							let id = trigger.trigger.dataset.id,
								image = trigger.trigger.querySelector('.product__image__' + id) ? trigger.trigger.querySelector('.product__image__' + id) : parents(trigger.trigger, '.product__image__' + id)[0] ? parents(trigger.trigger, '.product__image__' + id)[0] : parents(trigger.trigger, '.saren--single--product')[0].querySelector('.product__image__' + id),
								tl = gsap.timeline({
									onComplete: () => {
										resolve();
									}
								})

							sarenProductTransitions(tl, image, 'beforeLeave', false);

						})

					},
					leave() {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								onComplete: () => {
									resolve();
								}
							})

							sarenProductTransitions(tl, false, 'leave', false);

						})

					},
					beforeEnter() {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								onComplete: () => {
									resolve();
								}
							})

							sarenProductTransitions(tl, false, 'beforeEnter', false);

						})

					},
					afterEnter() {

						return new Promise(function (resolve, reject) {

							gsap.to('html', {
								delay: .5,
								duration: .2,
								onComplete: () => {
									resolve();
								}
							});

						})

					},
					after(trigger) {

						return new Promise(function (resolve, reject) {

							let tl = gsap.timeline({
								paused: true,
								onComplete: () => {
									clearProps('main , .site-footer');
									document.querySelector('.transition--media').remove();
									resolve();
								}
							}),
								id = trigger.trigger.dataset.id,
								targetImage = document.querySelector('.featured__' + id);

							sarenProductTransitions(tl, false, 'after', targetImage);

						})

					},

				},
			]

		})

		function barbaPrevents() {

			var prevents = $('.pe-load-more, .elementor-image-gallery a, .lang-item, .lang-item a, .elementor-gallery__container a, .elementor-image-gallery, #wpadminbar, .elementor-editor-wp-page, .woocommerce-cart-form, .portfolio--pagination');

			prevents.attr('data-barba-prevent', 'all')
		}

		barbaPrevents();

		if (history.scrollRestoration) {
			history.scrollRestoration = "manual";
		}

		ScrollTrigger.clearScrollMemory('manual');

		barba.hooks.before((data) => {

			html.classList.remove('ajax--first')
			document.documentElement.classList.add('loading');
			document.documentElement.classList.add('barba--running');
			disableScroll();

		})

		barba.hooks.enter((data) => {

			const parser = new DOMParser();
			const newDoc = parser.parseFromString(data.next.html, "text/html");
			const currentDoc = parser.parseFromString(data.current.html, "text/html");
			const bodyClasses = newDoc.querySelector('body').classList;
			const newBodyHasClass = newDoc.querySelector('body').classList.contains('layout--switched');
			const currentBodyHasClass = currentDoc.querySelector('body').classList.contains('layout--switched');
			const headerClasses = newDoc.querySelector('.site-header').classList;
			const currentHeaderClasses = currentDoc.querySelector('.site-header').classList;

			if (newDoc.querySelector('.site-header .main-menu .current_page_item')) {
				var nextMenuItem = newDoc.querySelector('.site-header .main-menu .current_page_item').classList,
					nextMenuItemClass = nextMenuItem[nextMenuItem.length - 1],
					currentActiveItems = document.querySelectorAll('.site-header .main-menu .current-menu-item');

				for (let x = 0; x < currentActiveItems.length; x++) {
					currentActiveItems[x].classList.remove('current-menu-item');
					currentActiveItems[x].classList.remove('current_page_item');
				}

				document.querySelectorAll('.' + nextMenuItemClass).forEach(item => item.classList.add('current-menu-item'));
				document.querySelectorAll('.menu--clicked').forEach(item => item.classList.remove('menu--clicked'));

			}


			document.querySelector('.site-header').classList = headerClasses;

			if (newBodyHasClass !== currentBodyHasClass) {

				if (document.querySelector('.pe-layout-switcher')) {

					document.querySelector('.pe-layout-switcher').click();

					setTimeout(() => {

						document.body.classList = bodyClasses;

					}, 1000);
				}

			} else {
				document.body.classList = bodyClasses;
			}

			const elementorTags = [
				'link[id*="elementor"]',
				'link[id*="eael"]',
				'style[id*="elementor"]',
				'style[id*="eael"]',
				'style[id*="elementor-frontend-inline"]',
				'style[id*="elementor-post"]',
				'link[id*="elementor-post"]',
			].join(',');

			const headTags = [
				'meta[name="keywords"]',
				'meta[name="description"]',
				'meta[property^="og"]',
				'meta[name^="twitter"]',
				'meta[itemprop]',
				'link[itemprop]',
				'link[rel="prev"]',
				'link[rel="next"]',
				'link[rel="canonical"]',
				'link[rel="alternate"]',
				'link[rel="shortlink"]',
				'link[rel="stylesheet"]',
				'link[id*="google-fonts"]',
				'style[id*="saren_-body-styles"]'
			].join(',');

			const newElements = newDoc.querySelectorAll(`${elementorTags}, ${headTags}`);
			const currentElements = document.querySelectorAll(`${elementorTags}, ${headTags}`);

			const existsInCurrentDOM = (newElement) => {
				return Array.from(currentElements).some(currentElement =>
					currentElement.tagName.toLowerCase() === newElement.tagName.toLowerCase() &&
					currentElement.id === newElement.id
				);
			};

			newElements.forEach(element => {
				if (element.tagName.toLowerCase() === 'link' && element.rel === 'stylesheet') {
					const href = element.getAttribute('href');
					if (!href) return;


					const currentStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
						.map(link => link.getAttribute('href'))
						.filter(Boolean);


					if (!currentStylesheets.includes(href)) {
						document.head.appendChild(element.cloneNode(true));
					}
				} else if (!existsInCurrentDOM(element)) {
					document.head.appendChild(element.cloneNode(true));
				}
			});


			if (document.body.classList.contains('rev--slider--active')) {

				if (newDoc.querySelector('.elementor-widget-slider_revolution')) {

					const scriptTags = newDoc.querySelectorAll('script');

					for (const script of scriptTags) {
						const content = script.textContent || script.innerHTML;
						if (content && content.trim().startsWith('SR7.JSON')) {
							try {
								eval(content);
								// for (let key in SR7.JSON) {
								// 	if (SR7.JSON.hasOwnProperty(key)) {
								// 		sr7JSONData[key] = SR7.JSON[key];
								// 	}
								// }
							} catch (error) {
								console.error('Could not parse JSON string,', error);
							}
						}
					}

					newDoc.querySelectorAll('.elementor-widget-slider_revolution').forEach(slider => {

						let scriptContent = slider.querySelector('script').textContent;

						if (scriptContent) {
							try {
								eval(scriptContent);
							} catch (error) {
								console.error('Could not parse JSON string,', error);
							}
						}

					})

				} else {
					SR7.JSON = {};
					delete SR7.M;
					delete SR7.PMH;
					delete SR7.lToK;
					delete SR7.initialised;
				}
			}


		});

		barba.hooks.afterEnter(() => {

			if (!html.classList.contains('ajax--first')) {
				window.scrollTo({
					top: 0,
					left: 0,
					behavior: "instant",
				});

				if (document.querySelector('#pe--google--map')) {
					var apiKeyMetaTag = document.querySelector('meta[name="google-maps-api-key"]');
					if (apiKeyMetaTag) {
						var apiKey = apiKeyMetaTag.getAttribute('content');
						loadGoogleMapsApi(apiKey);
					}
				}

				let scrolltriggers = ScrollTrigger.getAll();

				scrolltriggers.forEach(function (st) {

					if (st.vars.id !== 'fixedHeader' && st.vars.id !== 'stickyHeader') {

						st.kill();
					}
				})

				if (typeof window.elementorFrontend !== 'undefined') {

					window.elementorFrontend.init();
				}

				if (typeof pageScripts === 'function') {
					pageScripts();
					jQuery(document.body).trigger('wc_fragments_refreshed');
				}

			}

		});

		barba.hooks.after((data) => {

			setTimeout(() => {

				document.documentElement.classList.remove('loading');
				document.documentElement.classList.remove('barba--running');
				enableScroll();

				ScrollTrigger.refresh(true);

			}, 100);

		});
	}

	if ((!document.body.classList.contains('e-preview--show-hidden-elements')) && document.querySelector('.pe--page--loader')) {
		sarenPageLoader()
	}

	var loader = gsap.getById('pageLoader'),
		winLoading;

	winLoading = true;

	window.addEventListener("load", function () {
		winLoading = false;
	});

	if (loader) {
		loader.eventCallback('onComplete', () => {

			if (!winLoading) {
				sarenLoaderOut(document.querySelector('.pe--page--loader').dataset.type);
				pageScripts();
				sarenHeader();
				sarenPopups();
				document.body.classList.remove('window--initialized');
			} else {
				window.addEventListener("load", function () {
					sarenLoaderOut(document.querySelector('.pe--page--loader').dataset.type);
					pageScripts();
					sarenHeader();
					sarenPopups();
					document.body.classList.remove('window--initialized');

				});

			}

		})

	} else {
		html.classList.remove('loading');
		html.classList.remove('first--load');

		window.addEventListener("load", function () {
			pageScripts();
			sarenHeader();
			sarenPopups();
			document.body.classList.remove('window--initialized');
			ScrollTrigger.refresh(true);

		});
	}
	sarenmouseCursor();

	function pageScripts() {
		sarenShopArchive();
		sarenFooter();

		if (document.body.classList.contains('e-preview--show-hidden-elements')) {
			setTimeout(() => {
				peCustomSelect();
			}, 5000);
		} else {
			peCustomSelect();
		}
		document.documentElement.classList.add('loaded')
	}

}(jQuery));