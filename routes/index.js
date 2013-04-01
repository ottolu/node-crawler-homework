
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.search = function(req, res){
  res.render('search', { title: 'Express Search', data: '' });
};