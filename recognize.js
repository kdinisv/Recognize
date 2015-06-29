module.exports = Recognize;

var http = require('http');
var uri = require('url');
var querystring = require('querystring');

var baseUrl = 'http://rucaptcha.com';

function Recognize(options)
{
    this.key = options.key || this.key;
    require('events').EventEmitter.call(this);
}
require('util').inherits(Recognize, require('events').EventEmitter);

function get(key, id, cb){

    http.get(baseUrl + '/res.php?key=' + key + '&action=get&id=' + id, function(res){
        var body = [];
        res.on('data', function (chunk) {
            body.push(chunk);
        });
        res.on('end', function () {
            var answer = body.toString().split('|');
            console.log(answer);
            switch(answer[0]){
                case 'OK':
                    cb(null, answer[1]);
                    break;
                case 'CAPCHA_NOT_READY':
                    setTimeout(get, 1000, key, id, cb);
                    break;
                default :
                    cb(answer[0], null);
            }
        });
    }).on('error', function(err){
        console.error(err);
    });
}

Recognize.prototype = {
    captcha: function(file, settings, cb){

        if(typeof settings == 'function')
        {
            cb = settings;
            settings = {};
        }
        settings = settings || {};

        var self = this;
        var options = uri.parse(baseUrl + '/in.php');
        options.method = 'POST';
        var req = http.request(options, function(res){
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                var answer = body.toString().split('|');
                if(answer[0] == 'OK')
                {
                    get(self.key, answer[1], function(err, code){
                        cb(err, answer[1], code);
                    });
                }
            });
        });

        req.on('error', function(e) {
            console.error(e);
        });

        settings.soft_id = 768;
        settings.method = 'base64';
        settings.key = self.key;
        settings.body = file.toString('base64');
        req.write(querystring.stringify(settings));
        req.end();
    },
    balanse: function(cb){
        var self = this;
        http.get(baseUrl + '/res.php?key=' + self.key + '&action=getbalance', function(res){
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                cb(body.toString());
            });
        }).on('error', function(err){
            console.error(err);
        });
    },
    report: function(id, cb)
    {
        var self = this;
        http.get(baseUrl + '/res.php?key=' + self.key + '&action=reportbad&id=' + id, function(res){
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                cb(null, body.toString());
            });
        }).on('error', function(err){
            console.error(err);
        });
    }
};