var os = require('os'),
	http = require('http'),
	iconv = require('iconv-lite'),
	request = require('request'),
	zlib = require("zlib"),
	Pool = require('generic-pool').Pool;

exports.VERSION = "0.0.2";

function WebCrawler() {

	var self = this;

	self.pool = Pool({
		name: 'webcrawler',
		max: 10,
		priorityRange: 10,
		create: function(callback) {
			callback(1);
		},
		destroy: function(client) {

		}
	});

	var plannedQueueCallsCount = 0;
	var queuedCount = 0;

	var release = function(opts) {

		queuedCount--;

		if (opts._poolRef) self.pool.release(opts._poolRef);

		// Pool stats are behaving weird - have to implement our own counter
		if (queuedCount + plannedQueueCallsCount === 0) {
			if (self.onDrain) self.onDrain();
		}
	};

	self.onDrain = function() {};

	self.cache = {};

	self.request = function(opt, callback, error_callback) {

		if (self.cache[opt.hostname + opt.path]) {
			release(opt);
			return self.cache[opt.hostname + opt.path];
		}

		var startTime = os.uptime();

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

		var req = http.request(auto_build_opt, function(res) {

			var html = '',
				status = res.statusCode,
				headers = res.headers,
				hasReturn = false;

			if (res.statusCode == 302) {
				callback(res.headers['location'], status, headers);
				return;
			}

			var ret = function() {
				if (hasReturn) return;

				release(opt);

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
						self.cache[opt.hostname + opt.path] = html;
						callback(html, status, headers);
					});
				} else {
					// convert the charset
					if (options.charset === 'gbk') {
						html = iconv.decode(new Buffer(html, 'binary'), 'gbk');
					}
					// console.log(html);
					self.cache[opt.hostname + opt.path] = html;
					callback(html, status, headers);
				}

				hasReturn = true;
			};

			if (options.charset === 'gbk') {
				res.setEncoding('binary');
			} else {
				res.setEncoding(options.charset);
			}

			res.on('data', function(chunk) {
				// console.log('the data of ' + options.hostname + ' receive.');
				html += chunk;
			});

			res.on('end', function() {
				console.log('end');
				console.log(os.uptime() - startTime);
				ret();
			});

			res.on('close', function() {
				console.log('close');
				ret();
			});
		});

		req.on('error', function(error) {
			release(opt);
			typeof error_callback !== 'function' || error_callback(error);
		});

		req.end();

		return req;
	};

	self.get = function(opt, callback, error_callback) {

		queuedCount++;

		self.pool.acquire(function(err, poolRef) {

			if (err) {
				console.log("pool acquire error:", err);
				release(opt);
				return;
			}

			opt._poolRef = poolRef;

			self.request(opt, callback, error_callback);

		}, opt.priority);
	};

};

exports.WebCrawler = WebCrawler;

// var webcrawler = new WebCrawler();
// module.exports = webcrawler;