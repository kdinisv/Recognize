var Recognize = require('../recognize');

var recognize = new Recognize({
    key:'ключ'
});

recognize.balanse(function(price){
    console.log(price);
});

//var fs = require('fs');
fs.readFile('./captcha.png', function(err, data){
    captcha.recognize(data, function(err, id, code){
        console.log(id, code);
    });
});

recognize.report(131789716, function(err, answer){
   console.log(answer);
});

//ERROR_WRONG_CAPTCHA_ID
//OK_REPORT_RECORDED