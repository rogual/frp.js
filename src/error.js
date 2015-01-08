var error = module.exports = function(message) {

	return {

		message: message,
		isError: true
	};
};