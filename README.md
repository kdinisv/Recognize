# Recognize

__Пример кода:__
```js
captcha = new Captcha({
    key:'ваш-key'
});
captcha.recognize(file).then(function(err, code){
    if(err) throw err;
    console.log(code); //распознанная капча
});
```
__Получение баланса:__
```js
captcha.balanse().then(function(err, price){
    if(err) throw err;
    console.log(price);
});
