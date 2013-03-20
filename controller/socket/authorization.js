

exports.authorization = _authorization;


function _authorization() {}


_authorization.prototype.login = function (args, session, callback) {	
	
	var application = this.router.application;

	if (!session){
		return callback (Error("no session provided"));
	}

	var username = args.username;
	var password = args.password;

	if (!args.username || !args.password){
		var err = Error("username and password not provided");
		return callback(null, false);
	}

	application.authenticationManager.login(username, password, function (err, response){
		if (err != null){
			return callback(err);
		}

		if (response.valid){
			session.userName = username;
		}

		callback(null, response);
	});
}
