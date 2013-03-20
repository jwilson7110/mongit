

function _tagSelector(server, tag, elem) {

	var tagSelector = this;
	
	this.server = server;
	this.tag = tag;

	this.elem = elem;

	this.activeElem = elem.find(".active");
	this.inactiveElem = elem.find(".inactive");
	this.waitElem = elem.find(".wait");
	this.downElem = elem.find(".down");

	this.active = false;
	this.showing = "inactive";

	elem.find(".btnCheckout").click(function(){
		tag.process.queueCommand("checkout", server, tag);
	});
}

_tagSelector.prototype.shouldShow = function() {

	if (this.server.alive) {

		if (this.server.ready) { 

			if(this.active) {

				return "active";
			}
			else {
				return "inactive";
			}
		}
		else {
			return "wait";
		}
	}
	else {
		return "down"
	}
}

_tagSelector.prototype.refresh = function() {

	var tagSelector = this;

	var should = this.shouldShow();
	var showing = this.showing;

	if (should != showing) {
		
		this.showing = should;

		this.elem.find("." + showing).each(function() {

			var elem = $(this);
			if (elem.is(":visible")) {

				elem.fadeOut(500, null, function() {
				
					if (should == tagSelector.shouldShow()) {
						elem.parent().find("." + should).fadeIn(500);
					}
				});
			}
			else {
				
				elem.hide();
				elem.parent().find("." + should).show();
			}
		});
	}
};


