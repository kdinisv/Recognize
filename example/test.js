var Recognize = require('../recognize');
var fs = require('fs');

var recognize = new Recognize('rucaptcha', {
    key:'api-key'
});

recognize.balanse(function(price)
{
    console.log('My balance:', price);
});

fs.readFile('./example/captcha.png', function(err, data){
    recognize.solving(data, function(err, id, code)
    {
        if(err) throw err;
        if(code)
            console.log('Captcha:', code);
        else
        {
            console.log('Captcha not valid');
            recognize.report(id, function(err, answer)
            {
                console.log(answer);
            });
        }
    });
});
