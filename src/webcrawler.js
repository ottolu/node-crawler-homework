var os = require('os'),
	http = require('http'),
	iconv = require('iconv-lite'),
	zlib = require("zlib");

exports.VERSION = "0.0.2";

function WebCrawler() {
	this.maxAge = 3600;
	this.cache = {};
}

WebCrawler.prototype.get = function(opt, callback, error_callback) {

	var self = this,
		startTime = os.uptime();

	var options = {
		hostname: 'www.google.com',
		port: 80,
		path: '/',
		method: 'GET',
		charset: 'utf8',
		timeout: 2000,
		gzip: true,
		headers: {
			'Accept-Encoding': 'gzip',
			'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.70 Safari/537.17'
		}
	};

	for (name in opt) {
		if (opt.hasOwnProperty(name)) {
			options[name] = opt[name];
		}
	}

	if (!options.gzip) {
		options.headers = {};
	}

	var auto_build_opt = {
		hostname: options.hostname,
		port: options.port,
		path: options.path,
		method: options.method,
		headers: options.headers
	};

	if (this.cache[auto_build_opt.hostname+auto_build_opt.path]) {
		var obj = this.cache[auto_build_opt.hostname+auto_build_opt.path];
		if (os.uptime() - obj.cacheTime < this.maxAge) {
			callback(obj.html, obj.status, obj.headers);
			return;
		}
	}

	console.log(auto_build_opt.hostname+auto_build_opt.path);

	var req = http.request(auto_build_opt, function(res) {

		var html = '',
			status = res.statusCode,
			headers = res.headers,
			hasReturn = false;

		if (res.statusCode == 302) {
			callback(res.headers['location'], status, headers);
			return;
		}

		var setCache = function(html, status, headers) {
			self.cache[auto_build_opt.hostname+auto_build_opt.path] = {
				html : html,
				status : status,
				headers : headers,
				cacheTime : os.uptime()
			}
		}

		var ret = function() {
			if (hasReturn) return;

			if (options.gzip) {
				zlib.gunzip(new Buffer(html, 'binary'), function(error, html) {
					if (error) {
						typeof error_callback !== 'function' || error_callback(error);
						return;
					}
					// convert the charset
					if (options.charset === 'gbk') {
						html = iconv.decode(new Buffer(html, 'binary'), 'gbk');
					}
					// console.log(html);
					callback(html, status, headers);

					setCache(html, status, headers);
				});
			} else {
				// convert the charset
				if (options.charset === 'gbk') {
					html = iconv.decode(new Buffer(html, 'binary'), 'gbk');
				}
				// console.log(html);
				callback(html, status, headers);

				setCache(html, status, headers);
			}

			hasReturn = true;
		};

		if (options.charset === 'gbk') {
			res.setEncoding('binary');
		} else {
			res.setEncoding(options.charset);
		}

		res.on('data', function(chunk) {
			console.log('the data of ' + options.hostname + ' receive.');
			html += chunk;
		});

		res.on('end', function() {
			console.log('end:' + (os.uptime() - startTime));
			ret();
		});

		res.on('close', function() {
			console.log('close');
			ret();
		});
	});

	req.on('error', function(error) {
		typeof error_callback !== 'function' || error_callback(error);
	});

	req.end();

	return req;
}

exports.WebCrawler = WebCrawler;