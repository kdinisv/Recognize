# Recognize
Пример кода:
__Example__
```js
captcha = new Captcha({
    key:'ваш-key'
});
captcha.recognize(file).then(function(code){
    console.log(code); //распознанная капча
});

