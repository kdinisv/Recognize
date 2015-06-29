# Recognize

__Пример кода:__
```js
captcha = new Captcha({
    key:'ваш-key'
});
captcha.recognize(data, [options], function(err, code){
    if(err) throw err;
    console.log(code); //распознанная капча
});
```
__Получение баланса:__
```js
captcha.balanse(function(err, price){
    if(err) throw err;
    console.log(price);
});
```
__Options:__
<table border="1" cellpadding="1" cellspacing="1" style="width:900px">
	<thead>
		<tr>
			<th scope="col">POST параметр</th>
			<th scope="col">возможные значения</th>
			<th scope="col">описание параметра</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>phrase</td>
			<td>0;1</td>
			<td><strong>0</strong> = одно слово (значение по умлочанию)<br>
			<strong>1</strong> = капча имеет два слова</td>
		</tr>
		<tr>
			<td>regsense</td>
			<td>0;1</td>
			<td><strong>0</strong> = регистр ответа не имеет значения (значение по умолчанию )<br>
			<strong>1</strong> = регистр ответа имеет значение</td>
		</tr>
		<tr>
			<td>question</td>
			<td>0;1</td>
			<td><strong>0</strong> = параметр не задействован (значение по умолчанию )<br>
			<strong>1</strong> = на изображении задан вопрос, работник должен написать ответ</td>
		</tr>
		<tr>
			<td>numeric</td>
			<td>0;1;2;3</td>
			<td>
			<p><strong>0</strong> = параметр не задействован (значение по умолчанию)<br>
			<strong>1</strong> = капча состоит только из цифр<br>
			<strong>2</strong> = Капча состоит только из букв<br>
			<strong>3</strong> = Капча состоит либо только из цифр, либо только из букв.</p>
			</td>
		</tr>
		<tr>
			<td>calc</td>
			<td>0;1</td>
			<td><strong>0</strong> = параметр не задействован (значение по умолчанию)<br>
			<strong>1</strong> = работнику нужно совершить математическое действие с капчи</td>
		</tr>
		<tr>
			<td>min_len</td>
			<td>0..20</td>
			<td>
			<p><strong>0</strong> = параметр не задействован (значение по умолчанию)<br>
			<strong>1..20 </strong>= минимальное количество знаков в ответе</p>
			</td>
		</tr>
		<tr>
			<td>max_len</td>
			<td>1..20</td>
			<td><strong>0</strong> = параметр не задействован (значение по умолчанию)<br>
			<strong>1..20 </strong>= максимальное количество знаков в ответе</td>
		</tr>
		<tr>
			<td>is_russian</td>
			<td>0;1</td>
			<td>
			<p>параметр больше не используется, т.к. он означал "слать данную капчу русским исполнителям", а в системе находятся только русскоязычные исполнители. Смотрите новый параметр language, однозначно обозначающий язык капчи</p>
			</td>
		</tr>
		<tr>
			<td>language</td>
			<td>0;1;2</td>
			<td>
			<strong>0</strong> = параметр не задействован (значение по умолчанию)<br>
			<strong>1</strong> = на капче только кириллические буквы<br>
			<strong>2</strong> = на капче только латинские буквы<br>
			</td>
		</tr>
		<tr>
			<td>header_acao</td>
			<td>0;1</td>
			<td><strong>0</strong> = значение по умолчанию<br>
			<strong>1</strong> = in.php передаст Access-Control-Allow-Origin: * параметр в заголовке ответа. (Необходимо для кросс-доменных AJAX запросов в браузерных приложениях. Работает также для res.php.)</td>
		</tr>
	</tbody>
</table>


__Ошибки:__
