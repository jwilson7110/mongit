
var peodb = require("gennum-peodb");


exports._authenticationManager = _authenticationManager;


function _authenticationManager(application) {
	this.application = application;

	var peoConfig = application.peoConfig;

	this.db = peodb.create(peoConfig.getPEODBConfig(application.name, peoConfig.getAppMode()));
}



_authenticationManager.prototype.loggedIn = function (session){

	if (!session){
		return false;
	}

	if (!session.userName){
		return false;
	}

	return true;
}



_authenticationManager.prototype.login = function(username, password, callback) {

	if (!this.application.config.requirePassword) {

		return callback(null, {valid: true});
	}
		

	this.db.checkLogin(username, password, function (err, response) {

		if (err != null) {
			return callback(null, {valid: false, reason: "notfound", err: err});
		}

		//the user must be an admin in order to access the control panel, admin user ids are less than 0
		if (response.user_id > 0) {
			return callback(null, {valid: false, reason: "unauthorized"});
		}
		
		return callback(null, {valid: true});
	});
};
