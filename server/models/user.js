require('./connection.js');

exports.newUser = function(uid){
	db.set(uid, { pages : new Array()}, function(){
		console.log('Saved new user with ID' + uid);
	});
}

exports.newPage = function(uid, page){
	var user = db.get(uid);
	user.pages.push(page);
	db.set(uid, user, function(){
		console.log('Saved new page for user ' + uid);
	});
}

exports.getUser = function(uid){
	return db.get(uid);
}

exports.getPage = function(uid, pageid){
	var user = db.get(uid);
	return user.pages[pageid];
}
