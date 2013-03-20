
exports.application = _application;


function _application(){}


_application.prototype.iterate = function (args, session, callback){

	this.router.application.iterate(args.update, callback);
}