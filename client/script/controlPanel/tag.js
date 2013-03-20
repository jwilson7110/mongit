
function _tag(process, elem) {
	
	this.process = process;
	this.elem = elem;

	this.name = elem.attr("tagName");

	this.selectors = {};
}


_tag.prototype.refresh = function() {

	for (var key in this.selectors) {

		var selector = this.selectors[key];
		if (selector) {
			selector.refresh();
		}
	}
}

