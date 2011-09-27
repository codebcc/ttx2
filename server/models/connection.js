exports = db = require('dirty')('teletext.db');

db.on('drain', function() {
	console.log('All records are saved on disk now.');
});
