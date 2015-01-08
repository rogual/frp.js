var _ = require( 'lodash' );

var secret = 'frp.error';

var error = module.exports = function(message) {

	return {

		message: message,
		isError: secret
	};
};

error.isError = function( value ) {

	return _.isObject( value ) && value.isError == secret;
};