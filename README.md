# Recognize

__Пример кода:__
```js
captcha = new Captcha({
    key:'ваш-key'
});
captcha.recognize(file).then(function(code){
    console.log(code); //распознанная капча
});
```
__Получение баланса:__
```js
captcha.balanse().then(function(price){
    console.log(price);
});
