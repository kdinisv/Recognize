import { setTimeout } from "node:timers/promises";
import http from "node:http";

export const SOURCE = {
  RUCAPTCHA: "RUCAPTCHA",
  ANTIGATE: "ANTIGATE",
  CAPTCHA24: "CAPTCHA24",
};

const _SOURCE = {
  [SOURCE.RUCAPTCHA]: {
    baseUrl: "rucaptcha.com",
    soft_id: 768,
  },
  [SOURCE.ANTIGATE]: {
    baseUrl: "anti-captcha.com",
    soft_id: 720,
  },
  [SOURCE.CAPTCHA24]: {
    baseUrl: "captcha24.com",
    soft_id: 921,
  },
};

export default class Recognize {
  constructor(sourceCode, options) {
    if (!options || !options.key) throw new Error("not key");
    const source = _SOURCE[sourceCode];
    if (!source) throw new Error("invalid type");

    this._options = {
      ...options,
      baseUrl: source.baseUrl,
      soft_id: source.soft_id,
    };
  }

  balanse() {
    return new Promise((resolve, reject) => {
      http
        .get(
          {
            hostname: this._options.baseUrl,
            port: 80,
            path: `/res.php?key=${this._options.key}&action=getbalance&json=1`,
          },
          function (res) {
            var body = [];
            res.on("data", function (chunk) {
              body.push(chunk);
            });
            res.on("end", function () {
              try {
                const { status, request } = JSON.parse(body.join(""));
                if (status === 1) {
                  return resolve(request);
                }
                return reject(new Error(request));
              } catch (err) {
                reject(err);
              }
            });
          }
        )
        .on("error", reject);
    });
  }

  solvingImage(buff, options = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...options,
        soft_id: this._options.soft_id,
        method: "base64",
        key: this._options.key,
        body: buff.toString("base64"),
        json: "1",
      });

      const req = http.request(
        {
          hostname: this._options.baseUrl,
          port: 80,
          path: "/in.php",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          const body = [];
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body.push(chunk);
          });
          res.on("end", () => {
            const { status, request } = JSON.parse(body.join(""));
            // console.log(request);
            if (status === 1) {
              waitResult(this._options.baseUrl, this._options.key, request)
                .then((result) => resolve({ id: request, result }))
                .catch((error) => reject(error));
            } else {
              reject(new Error(request));
            }
          });
        }
      );

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  solvingRecaptcha2(url, googleKey, options = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...options,
        soft_id: this._options.soft_id,
        method: "userrecaptcha",
        key: this._options.key,
        pageurl: url,
        googlekey: googleKey,
        json: "1",
      });

      const req = http.request(
        {
          hostname: this._options.baseUrl,
          port: 80,
          path: "/in.php",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          const body = [];
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body.push(chunk);
          });
          res.on("end", () => {
            const { status, request } = JSON.parse(body.join(""));
            // console.log(request);
            if (status === 1) {
              waitResult(this._options.baseUrl, this._options.key, request)
                .then((result) => resolve({ id: request, result }))
                .catch((error) => reject(error));
            } else {
              reject(new Error(request));
            }
          });
        }
      );

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  solvingRecaptcha3(url, googleKey, action, score = "0.3", options = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...options,
        soft_id: this._options.soft_id,
        method: "userrecaptcha",
        version: "v3",
        action,
        min_score: score,
        key: this._options.key,
        pageurl: url,
        googlekey: googleKey,
        json: "1",
      });

      const req = http.request(
        {
          hostname: this._options.baseUrl,
          port: 80,
          path: "/in.php",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          const body = [];
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body.push(chunk);
          });
          res.on("end", () => {
            const { status, request } = JSON.parse(body.join(""));
            // console.log(request);
            if (status === 1) {
              waitResult(this._options.baseUrl, this._options.key, request)
                .then((result) => resolve({ id: request, result }))
                .catch((error) => reject(error));
            } else {
              reject(new Error(request));
            }
          });
        }
      );

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  reportBad(id) {
    return new Promise((resolve, reject) => {
      http
        .get(
          {
            hostname: this._options.baseUrl,
            port: 80,
            path: `/res.php?key=${this._options.key}&action=reportbad&id=${id}&json=1`,
          },
          function (res) {
            const body = [];
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
              body.push(chunk);
            });
            res.on("end", function () {
              const { status, request } = JSON.parse(body.join(""));
              if (status === 0) return reject(new Error(request));
              resolve(request);
            });
          }
        )
        .on("error", reject);
    });
  }

  reportGood(id) {
    return new Promise((resolve, reject) => {
      http
        .get(
          {
            hostname: this._options.baseUrl,
            port: 80,
            path: `/res.php?key=${this._options.key}&action=reportgood&id=${id}&json=1`,
          },
          function (res) {
            const body = [];
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
              body.push(chunk);
            });
            res.on("end", function () {
              const { status, request } = JSON.parse(body.join(""));
              if (status === 0) return reject(new Error(request));
              resolve(request);
            });
          }
        )
        .on("error", reject);
    });
  }
}

const httpGet = (request) => {
  return new Promise((resolve, reject) => {
    return http
      .get(request, (res) => {
        const body = [];
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
          body.push(chunk);
        });
        res.on("end", () => {
          resolve(JSON.parse(body.join("")));
        });
      })
      .on("error", reject);
  });
};

const waitResult = async (baseUrl, key, id) => {
  await setTimeout(1000);
  const { status, request } = await httpGet({
    hostname: baseUrl,
    port: 80,
    path: `/res.php?key=${key}&action=get&id=${id}&json=1`,
  });

  if (request === "CAPCHA_NOT_READY") return waitResult(baseUrl, key, id);
  else if (status === 0) throw new Error(request);

  return request;
};
