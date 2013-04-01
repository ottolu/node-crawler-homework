var searchEngine = require('./searchEngine.js'),
	iconv = require('iconv-lite'),
	fs = require('fs'),
	os = require('os');

var startTime, cache = {}, maxAge = 3600;

var Server = function() {
	var self = this;

	self.search = function(keyword, page, callback) {
		startTime = os.uptime();

		if (cache[keyword] && cache[keyword].page == page && startTime - cache[keyword].time < maxAge) {
			callback(cache[keyword].data);
			return;
		}

		if (keyword == '') {
			callback([]);
			return;
		}

		if (keyword.match(/[a-zA-Z0-9]+/) == null) {
			buf = iconv.encode(keyword, 'gbk');
			keyword = '';
			for (var i = 0, l = buf.length; i < l; ++i) {
				keyword += decodeToGBK(buf[i]);
			}
		}

		searchEngine.search(keyword, page, function(data_old) {
			console.log("done :" + (os.uptime() - startTime));

			data = filtrer(data_old);

			if (data.length > 0) {
				cache[keyword] = {
					data: data,
					time: os.uptime(),
					page: page
				}
			}

			if (data.length < 12) {
				callback(data_old);
			} else {
				callback(data);
			}

			
		});
	}
}

	function filtrer(data) {
		var avg = 0, diff = 0.5, price = 0, ret_data = [], num = 0, undefined;
		for (var i = 0, l = data.length; i < l; ++i) {
			var tmp_data = data[i];
			if (tmp_data.price == undefined || tmp_data.price == 'undefined') continue;
			if (tmp_data.from == 'jingdong') {
				ret_data[ret_data.length] = data[i];
				continue;
			}
			if (tmp_data.from == 'paipai') {
				tmp_data.price = tmp_data.price.slice(1, tmp_data.price.length);
			}
			price = parseInt(tmp_data.price);
			tmp_data.price = price;
			if ((avg - price) < (diff * avg)) {
				ret_data[ret_data.length] = tmp_data;
				avg = (avg + price) / 2;
			}
			
		}
		return ret_data;
	}

	function decodeToGBK(code) {
		var dict = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E'];
		return '%' + dict[code / 16 >> 0] + dict[code % 16];
	}

exports.Server = Server;