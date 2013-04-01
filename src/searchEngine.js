var os = require('os'),
	WebCrawler = require('./webcrawler.js').WebCrawler,
	fs = require('fs'),
	jsdom = require('jsdom'),
	jquery = fs.readFileSync('./src/jquery.js');

var webcrawler = new WebCrawler();

exports.search = function(keyword, page, callback) {

	var timeout = 10,
		getDataNum = 0,
		startTime = os.uptime(), // help calc if timeout or not
		timeoutMark = false, // the mark of timeout
		dataset = []; // return the dataset to callback function

	// to merge the data return from taobao, jd, paipai, etc
	// and also to get data from other pages
	var dataHandle = function(data, from) {
		// dataset = dataset.concat(data);
		if (getDataNum >= 2) {
			if (timeoutMark) return;
			callback(dataset);
		} else {
			getDataNum++;
		}
	};

	// data obj struct {name, href, picurl, price, sellnum, review, rvurl, from}

	var getPaipaiData = function(keyword, page, callback) {

		var req = webcrawler.get({
			hostname: 'search1.paipai.com',
			port: 80,
			path: '/cgi-bin/comm_search1?KeyWord=' + keyword,
			method: 'GET',
			charset: 'gbk'
		}, function(content, status, headers) {
			var href = content.replace(/http:\/\//g, '');

			var index = href.indexOf('/'),
				path = href.slice(index, href.length),
				hn = href.slice(0, index);

			// redirect to the real website
			webcrawler.get({
				hostname: hn,
				port: 80,
				path: path,
				method: 'GET',
				charset: 'gbk'
			}, function(content, status, headers) {

				// var str = content.match(/<ul id="itemList".*?<\/ul>/);
				// fs.writeFileSync('xxx.txt', str);

				jsdom.env({
					html: content,
					src: [jquery],
					done: function(errors, window) {
						var document = window.document,
							$ = window.$,
							data = [];

						var $listItem = $('#itemList').find('li');

						$listItem.each(function(i) {
							var name = $('.item-show h3 a', this).last().html().replace(/<.*?>/g, ''),
								href = $('.item-show h3 a', this).last().attr('href'),
								picurl = $('.photo img', this).attr('init_src'),
								price = $('.price .pp_price', this).html(),
								sellnum = $('.total', this).text().replace(/[^\d]+/g, '');

							if (sellnum == "") {
								sellnum = '-';
							}

							data.push({
								name: name,
								href: href,
								picurl: picurl,
								price: price,
								sellnum: sellnum,
								review: '-',
								rvurl: "#",
								from: 'paipai'
							});
						});

						console.log(data[0]);
						console.log('paipai:' + (os.uptime() - startTime));

						dataset = dataset.concat(data);

						callback(data, 'paipai');
					}
				});
			}, function(error) {
				console.log("ERROR: " + error.message);
			});
		}, function(error) {
			console.log("ERROR: " + error.message);
		});

		return req;
	};

	getPaipaiData(keyword, 1, dataHandle);

	var getTaobaoData = function(keyword, page, callback) {

		var req = webcrawler.get({
			hostname: 's.taobao.com',
			port: 80,
			path: '/search?q=' + keyword + '&sort=sale-desc&style=list&s=' + (40 * page),
			method: 'GET',
			charset: 'gbk'
		}, function(content, status, headers) {

			jsdom.env({
				html: content,
				src: [jquery],
				done: function(errors, window) {
					var document = window.document,
						$ = window.$,
						data = [];

					// fs.writeFileSync('tb.txt', content);

					var $listItem = $('.list-view').find('.list-item');

					$listItem.each(function(i) {
						var name = $('.summary a', this).text(),
							href = $('.summary a', this).attr('href'),
							picurl = $('.photo img', this).attr('data-ks-lazyload'),
							price = $('.price', this).text().replace(/<.*?>/g, ''),
							sellnum = $('.sale', this).text(), //.match(/\d+/g)[0],
							review = $('.sale a', this).text().replace(/[^\d]+/g, ''),
							rvurl = $('.sale a', this).attr('href');

						data.push({
							name: name,
							href: href,
							picurl: picurl,
							price: price,
							sellnum: sellnum,
							review: review,
							rvurl: rvurl,
							from: 'taobao'
						});
					});

					if ($listItem.length == 0) {
						$listItem = $('.list-view').find('.row');

						$listItem.each(function(i) {
							var name = $('.summary a', this).text(),
								href = $('.summary a', this).attr('href'),
								picurl = $('.pic-box-big img', this).attr('data-ks-lazyload'),
								price = $('.price', this).text().replace(/<.*?>/g, ''),
								sellnum = $('.dealing', this).text(), //.match(/\d+/g)[0],
								review = $('.count a', this).text().replace(/[^\d]+/g, ''),
								rvurl = $('.count a', this).attr('href');

							data.push({
								name: name,
								href: href,
								picurl: picurl,
								price: price,
								sellnum: sellnum,
								review: review,
								rvurl: rvurl,
								from: 'taobao'
							});
						});
					}

					console.log(data[0]);
					console.log('taobao:' + (os.uptime() - startTime));

					dataset = dataset.concat(data);

					callback(data, 'taobao');
				}
			});
		}, function(error) {
			console.log("ERROR: " + error.message);
		});

		return req;
	};

	// i don't know how to control the page of search result in jd
	// but in the same time, it's not necessary :)
	// the num of affective result pages usully not bigger than 3
	var getJDData = function(keyword, page, callback) {

		var req = webcrawler.get({
			hostname: 'search.jd.com',
			port: 80,
			path: '/Search?keyword=' + keyword,
			method: 'GET',
			charset: 'gbk'
		}, function(content, status, headers) {

			jsdom.env({
				html: content,
				src: [jquery],
				done: function(errors, window) {
					var document = window.document,
						$ = window.$,
						data = [];

					// fs.writeFileSync('tmp.txt', content);

					var $listItem = $('#plist').find('li');

					$listItem.each(function(i) {
						var name = $('.p-name', this).text().replace(/<.*?>/g, ''),
							href = $('.p-name a', this).attr('href'),
							picurl = $('.p-img img', this).attr('data-lazyload'),
							price = $('.p-price img', this).attr('data-lazyload'),
							review = $('.extra a', this).text().replace(/[^\d]+/g, ''),
							rvurl = $('.extra a', this).attr('href');

						data.push({
							name: name,
							href: href,
							picurl: picurl,
							price: price,
							sellnum: '-',
							review: review,
							rvurl: rvurl,
							from: 'jingdong'
						});
					});

					console.log(data[0]);
					console.log('jingdong:' + (os.uptime() - startTime));

					dataset = dataset.concat(data);

					callback(data, 'jingdong');
				}
			});
		}, function(error) {
			console.log("ERROR: " + error.message);
		});

		return req;
	};

	// getTaobaoData(keyword, 1, dataHandle);
	getJDData(keyword, 1, dataHandle);
	getTaobaoData(keyword, 1, dataHandle);

	// to calc timeout or not
	setTimeout(function() {
		if (os.uptime() - startTime > timeout) {
			console.log('timeout', dataset.length);
			if (dataset.length == 0) {
				setTimeout(arguments.callee, 200);
				return;
			}
			console.log('timeout return');
			timeoutMark = true;
			callback(dataset);
		} else {
			if (getDataNum >= 2) return;
			setTimeout(arguments.callee, 200);
		}
	}, 200);

}