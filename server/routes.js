var User = require('./models/user');

module.exports = function(app){

  // get user's json
  app.get('/:uid', function(req, res){
    res.json(User.getUser(req.params.uid));
  });

  app.post('/user/new', function(req, res){
    res.send(req.body);
  });

  app.post('/user/page/new', function(req, res){
    res.send(req.body);
  });

  // // Listing of Articles
  // app.get('/articles', function(req, res){
  //   Article
  //     .find({})
  //     .desc('created_at') // sort by date
  //     .run(function(err, articles) {
  //       res.render('articles/index', {
  //         title: 'List of Articles',
  //         articles: articles
  //       });
  //     });
  // });
};
