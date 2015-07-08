# Recognize

[![NPM](https://nodei.co/npm/recognize.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/recognize/)
## Installation
Using NPM utility to install module directly:
```npm
npm install recognize
```

## Service
* [rucaptcha](https://rucaptcha.com/?from=1027759)
* [antigate](https://anti-captcha.com)
* [captcha24](http://captcha24.com)

## Documentation
* [solving](#solving) 
* [balance](#balance)
* [report](#report)

<a name="solving" />
### [Recognize Object].solving()

__Arguments:__

1. File buffer
2. [Optional parameters](#optional)
3. Callback function

```js
recognize.solving(data, {numeric:1, min_len:5}, function(err, id, code)
{
	if(err) throw err;
	console.log(id, code);
});
```
OR
```js
recognize.solving(data, function(err, id, code)
{
	if(err) throw err;
	console.log(id, code);
});
```
<a name="balance" />
### [Recognize Object].balance()
```js
recognize.balance(function(err, price)
{
    if(err) throw err;
    console.log(price);
});
```
<a name="report" />
### [Recognize Object].report()
```js
recognize.report(id, function(err, answer)
{
   console.log(answer);  //OK_REPORT_RECORDED or ERROR_WRONG_CAPTCHA_ID
});
```

## Example
```js
var recognize = new Recognize('antigate', {
    key:'api-key'
});

recognize.balanse(function(price)
{
    console.log('My balance:', price);
});

fs.readFile('./captcha.png', function(err, data){
    recognize.solving(data, function(err, id, code)
    {
        if(err) throw err;
        if(isValide(code))
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
```

<a name="optional" />
## Optional parameters
<table class="table" width="100%">
    <thead>
        <tr>
            <td>Parameter</td>
            <td>Type</td>
            <td>Possible values</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>phrase</td>
            <td>integer</td>
            <td>0, 1</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1</b> = captcha has 2-3 words</div>
            </td>
        </tr>
        <tr>
            <td>regsense</td>
            <td>integer</td>
            <td>0, 1</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1</b> = captcha is case sensitive</div>
            </td>
        </tr>
        <tr>
            <td>numeric</td>
            <td>integer</td>
            <td>0, 1, 2</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1</b> = captcha consists of digits only</div>
                <div><b>2</b> = captcha does not contain any digits</div>
            </td>
        </tr>
        <tr>
            <td>calc</td>
            <td>integer</td>
            <td>0, 1</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1</b> = arithmetical operation must be performed</div>
            </td>
        </tr>
        <tr>
            <td>min_len</td>
            <td>integer</td>
            <td>0..20</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1..20</b> = minimum length of captcha text required to input</div>
            </td>
        </tr>
        <tr>
            <td>max_len</td>
            <td>integer</td>
            <td>0..20</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1..20</b> = maximum length of captcha text required to input</div>
            </td>
        </tr>
        <tr>
            <td>is_russian</td>
            <td>integer</td>
            <td>0, 1</td>
            <td>
                <div><b>0</b> = default value</div>
                <div><b>1</b> = captcha goes to Russian Queue</div>
            </td>
        </tr>
    </tbody><tbody>
</tbody></table>
