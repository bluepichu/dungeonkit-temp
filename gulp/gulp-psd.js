// From https://gist.github.com/kerberoS/5a21146a48a57da31132

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var PSD = require('psd');

function NoopPlugin(file, encoding, callback) {
	if (file.isNull() || file.isDirectory()) {
		this.push(file);
		return callback();
	}

	if (file.isStream()) {
		this.emit('error', new PluginError({
			plugin: 'PSD',
			message: 'Streams are not supported.'
		}));
		return callback();
	}

	if (file.isBuffer()) {
		PSD.open(file.path).then(function (psd) {
			return psd.image.saveAsPng('./tmp/output.png');
		});

		this.push(file);
		return callback();
	}
}

function gulpPSD() {
    return through.obj(NoopPlugin);
}

module.exports = gulpPSD;