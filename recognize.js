module.exports = Recognize;

var http = require('http');
var uri = require('url');
var querystring = require('querystring');

function Recognize(type, settings)
{
    this.type = type;
    switch(type)
    {
        case 'rucaptcha':
            this.baseUrl = 'http://rucaptcha.com';
            this.id = 768;
            break;
        case 'antigate':
            this.baseUrl = 'http://anti-captcha.com';
            this.id = 720;
            break;
        case 'captcha24':
            this.baseUrl = 'http://captcha24.com';
            this.id = 921;
            break;
        default :
            throw new Error('invalid type');

    }
    this.settings = settings || {};
    this.key = this.settings.key || this.key;
    require('events').EventEmitter.call(this);
}

require('util').inherits(Recognize, require('events').EventEmitter);

Recognize.prototype = {
    solving: function(file, settings, cb){
        if(typeof settings == 'function')
        {
            cb = settings;
            settings = {};
        }
        settings = settings || this.settings || {};

        var self = this;
        var options = uri.parse(this.baseUrl + '/in.php');
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        var req = http.request(options, function(res){
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                var answer = body.toString().split('|');
                //console.log(answer);
                switch (answer[0])
                {
                    case 'OK':
                        get(self.baseUrl, self.key, answer[1], function(err, code){
                            cb(err, answer[1], code);
                        });
                        break;
                    default :
                        cb(answer[0]);
                }
            });
        });

        req.on('error', function(e) {
            console.error(e);
        });
        settings.soft_id = this.id;
        settings.method = 'base64';
        settings.key = this.key;
        settings.body = file.toString('base64');
        req.write(querystring.stringify(settings));
        req.end();
    },
    balanse: function(cb){
        var self = this;

        http.get(this.baseUrl + '/res.php?key=' + self.key + '&action=getbalance', function(res){
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
        http.get(this.baseUrl + '/res.php?key=' + self.key + '&action=reportbad&id=' + id, function(res){
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

function get(baseUrl, key, id, cb){
    http.get(baseUrl + '/res.php?key=' + key + '&action=get&id=' + id, function(res){
        var body = [];
        res.on('data', function (chunk) {
            body.push(chunk);
        });
        res.on('end', function () {
            var answer = body.toString().split('|');
            switch(answer[0]){
                case 'OK':
                    cb(null, answer[1]);
                    break;
                case 'CAPCHA_NOT_READY':
                    setTimeout(get, 1000, baseUrl, key, id, cb);
                    break;
                default :
                    cb(answer[0], null);
            }
        });
    }).on('error', function(err){
        console.error(err);
    });
};