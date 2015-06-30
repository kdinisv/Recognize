# Recognize
Recognize - библиотека для работы с сервисом распознавания капчи <https://rucaptcha.com>

[![NPM](https://nodei.co/npm/recognize.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/recognize/)
## Installation
Using NPM utility to install module directly:
```npm
npm install recognize
```
##Documentation
* [captcha](#captcha) 
* [balance](#balance)
* [report](#report)

<a name="captcha" />
### [Recognize Object].captcha()

__Arguments:__

1. File buffer
2. [Optional parameters](#optional)
3. Callback function

```js
recognize.captcha(data, {numeric:1, min_len:5}, function(err, id, code){
	if(err) throw err;
	console.log(id, code);
});
```
OR
```js
recognize.captcha(data, {numeric:1, min_len:5}, function(err, id, code){
	if(err) throw err;
	console.log(id, code);
});
```
<a name="balance" />
### [Recognize Object].balance()
```js
recognize.balance(function(err, price){
    if(err) throw err;
    console.log(price);
});
```
<a name="report" />
### [Recognize Object].report()
```js
recognize.report(id, function(err, answer){
   console.log(answer);  //OK_REPORT_RECORDED or ERROR_WRONG_CAPTCHA_ID
});
```
<a name="optional" />
## Optional parameters
