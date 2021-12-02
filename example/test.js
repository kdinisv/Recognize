import { readFile } from "node:fs/promises";
import Recognize, { SOURCE } from "../index.js";

const recognize = new Recognize(SOURCE.RUCAPTCHA, {
  key: "api-key",
});

const price = await recognize.balanse();
console.log("My balance:", price);

// const buff = await readFile("./example/captcha.png");

const { id, result } = await recognize
  .solvingRecaptcha3(
    "https://www.reestr-zalogov.ru/search/index",
    "6LdKJhMaAAAAAIfeHC6FZc-UVfzDQpiOjaJUWoxr",
    "search_notary",
    "0.3"
  )
  .catch(console.error);

console.log(result);

// const r = await recognize.reportGood(id).catch((err) => err.message);
// console.log(r);
// recognize.solving(data, function (err, id, code) {
//     if (err) throw err;
//     if (code) console.log("Captcha:", code);
//     else {
//       console.log("Captcha not valid");
//       recognize.report(id, function (err, answer) {
//         console.log(answer);
//       });
//     }
//   });
