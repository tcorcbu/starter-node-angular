module.exports = function(app) {
	
	var MongoClient = require('mongodb').MongoClient;

	var url = "mongodb://localhost:27017/";
	
	var MongoClient = require('mongodb').MongoClient;

    var db;

    // Connect to the db
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, database) {
      if(err) { 
		throw err;
        return;
      }else{
        console.log("Connected to database");
      }

      var dbo = database.db("lease_data"); // use the lease_data db

      db = dbo; // set global variable db from above

    });

	app.route('/save-data').post(function(req, res) { // generic post request handled
		var body = req.body;
		console.log("/save-data", body);
		res.json(body);
    });
	
	app.route('/get-data').get(function(req, res) { // generic get request handled
		console.log("/get-data");
		res.json({name: "data from get"});
    });
	
	
	// route to handle all angular requests
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html');
	});

};