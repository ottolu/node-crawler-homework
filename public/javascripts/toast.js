/*! Copyright (c) 2013 Otto Lu (http://nomi.sinaapp.com)
 * Licensed under the MIT License.
 *
 * A Simple Android Style MessageBox(Toast)
 *
 * @ Version: 0.005
 *
 * @ Example:
 *     You should call
 *         Toast.init();
 *     firstly.
 *
 *     Toast("hello, world").show();
 *
 *     Toast({text: "hello, world",
 *           time: 2000,
 *           autoPos: false,
 *           x: function(){ return 100;},
 *           y: 200 }).show();
 */
;(function(exports, $, undefined) {

	var Toast = function(opt) {

		(typeof opt === 'string') && (opt = {
			text: opt
		});
		(typeof opt === 'object') || (opt = {});

		var options = {
			time: 3000,
			text: 'hello, world.',
			width: 400,
			x: 0,
			y: 0,
			autoPos: true,
			type: 'normal' // normal, fixedTop, fixedBottom
		}

		for (name in opt) {
			if (opt.hasOwnProperty(name)) {
				options[name] = opt[name];
			}
		}

		for (name in options) {
			if (options.hasOwnProperty(name) && typeof options[name] === 'function') {
				options[name] = options[name]();
			}
		}

		var ele = '<div class="toast-box" style="max-width:' + options.width + 'px;"><p>' + options.text + '</p></div>',
			$ele = $(ele);

		$('body').append($ele);

		if (options.type.indexOf('normal') != -1) {
			if (options.autoPos) {
				var width = parseInt($ele.width()),
					screenWidth = parseInt($(exports).width()),
					height = parseInt($ele.height()),
					screenHeight = parseInt($(exports).height()),
					posLeft = (screenWidth - width - 60) / 2;
				posTop = screenHeight - height - 200;
				posTop = posTop > 0 ? posTop : 50;
				$ele.css({
					left: posLeft + 'px',
					top: posTop + 'px'
				});
			} else {
				$ele.css({
					left: options.x + 'px',
					top: options.y + 'px'
				});
			}
		}

		if (options.type.indexOf('fixedTop') != -1) {
			$ele.css({top: 0, left: 0}).addClass('no-border-radius fixedTop');
		}

		if (options.type.indexOf('fixedBottom') != -1) {
			$ele.css({bottom: 0, left: 0}).addClass('no-border-radius fixedBottom');
		}

		$ele.hide();

		$ele.fadeOut = $ele.fadeOut || (function() {
			var opacity = 1, el = $ele, time = 25;
			return function() {
				setTimeout(function() {
					opacity -= 0.1;
					el.css('opacity', opacity);
					if (opacity <= 0) return;
					setTimeout(arguments.callee, time);
				}, time);
			}
		})();

		return {
			show: function(closeByUrself) {
				$ele.show();
				if (!!closeByUrself) return this;
				setTimeout(function() {
					$ele.fadeOut(function() {
						$ele.remove();
					});
				}, options.time);
			},

			close: function() {
				$ele.fadeOut(function() {
					$ele.remove();
				});
				return this;
			},

			hide: function() {
				$ele.fadeOut();
				return this;
			},

			remove: function() {
				$ele.remove();
				return this;
			},

			setText: function(str) {
				options.text = str;
				$ele.find('p').html(str);
				return this;
			},

			getText: function() {
				return options.text;
			},

			getElement: function() {
				return $ele;
			}
		}
	}

	Toast.init = function() {
		$('body').append('<style type="text/css">.toast-box {display: none;padding: 15px 30px;z-index: 999;position: fixed;-moz-border-radius: 5px;-webkit-border-radius: 5px;border-radius: 5px;background: #000;filter: alpha(opacity=60);_background: #575757;background: #000\0;filter: alpha(opacity=60)\0;background: rgba(0, 0, 0, 0.6);}.toast-box p {color: white;color: rgba(255,255,255,.9);font-size: 16px;text-align: center;width: 100%;display: block;margin: 0 auto;}.toast-box img {margin: 10px;} .toast-box.no-border-radius {-moz-border-radius: 0px;-webkit-border-radius: 0px;border-radius: 0px;}.toast-box.fixedTop,.toast-box.fixedBottom{width:100% !important;max-width:100% !important;}</style>');
	}

	exports.Toast = Toast;

})(window, $);