import { setTimeout } from "node:timers/promises";
import got from "got";

export const SOURCE = {
  RUCAPTCHA: "RUCAPTCHA",
  ANTIGATE: "ANTIGATE",
  CAPTCHA24: "CAPTCHA24",
};

const _SOURCE = {
  [SOURCE.RUCAPTCHA]: {
    baseUrl: "http://rucaptcha.com",
    soft_id: 768,
  },
  [SOURCE.ANTIGATE]: {
    baseUrl: "http://anti-captcha.com",
    soft_id: 720,
  },
  [SOURCE.CAPTCHA24]: {
    baseUrl: "http://captcha24.com",
    soft_id: 921,
  },
};

export default class Recognize {
  constructor(sourceCode, options) {
    if (!options || !options.key) throw new Error("not key");
    const source = _SOURCE[sourceCode];
    if (!source) throw new Error("invalid type");
    this.rp = got.extend({
      prefixUrl: source.baseUrl,
      resolveBodyOnly: true,
      responseType: "json",
    });
    this._options = {
      ...options,
      soft_id: source.soft_id,
    };
  }

  async _waitResult(id) {
    await setTimeout(1000);
    const { status, request } = await this.rp.get("res.php", {
      searchParams: { key: this._options.key, action: "get", id, json: 1 },
    });

    if (request === "CAPCHA_NOT_READY") return this._waitResult(id);
    else if (status === 0) return Promise.reject(request);

    return request;
  }

  async balanse() {
    const { request } = await this.rp.get("res.php", {
      searchParams: { key: this._options.key, action: "getbalance", json: 1 },
    });

    return request;
  }

  async solvingImage(buff, options = {}) {
    const { status, request } = await this.rp.post("in.php", {
      json: {
        ...options,
        soft_id: this._options.soft_id,
        method: "base64",
        key: this._options.key,
        body: buff.toString("base64"),
        json: 1,
      },
    });

    if (status === 1) {
      return { result: await this._waitResult(request), id: request };
    }

    return Promise.reject(request);
  }

  async solvingRecaptcha2(url, googleKey, options = {}) {
    const { status, request } = await this.rp.post("in.php", {
      json: {
        ...options,
        soft_id: this._options.soft_id,
        method: "userrecaptcha",
        key: this._options.key,
        pageurl: url,
        googlekey: googleKey,
        json: 1,
      },
    });

    if (status === 1) {
      return { result: await this._waitResult(request), id: request };
    }

    return Promise.reject(request);
  }

  async solvingRecaptcha3(url, googleKey, action, score = "0.3", options = {}) {
    const { status, request } = await this.rp.post("in.php", {
      json: {
        ...options,
        soft_id: this._options.soft_id,
        method: "userrecaptcha",
        version: "v3",
        action,
        min_score: score,
        key: this._options.key,
        pageurl: url,
        googlekey: googleKey,
        json: 1,
      },
    });

    if (status === 1) {
      return { result: await this._waitResult(request), id: request };
    }

    return Promise.reject(request);
  }

  async reportBad(id) {
    const { status, request } = await this.rp.get("res.php", {
      searchParams: {
        key: this._options.key,
        action: "reportbad",
        id,
        json: 1,
      },
    });

    if (status === 0) return false;
    return true;
  }

  async reportGood(id) {
    const { status, request } = await this.rp.get("res.php", {
      searchParams: {
        key: this._options.key,
        action: "reportgood",
        id,
        json: 1,
      },
    });

    if (status === 0) return false;
    return true;
  }
}
