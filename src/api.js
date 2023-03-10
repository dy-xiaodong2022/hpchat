import {FastjsAjax} from "fastjs-next";
import {message} from "ant-design-vue";
import cookie from "js-cookie";

if (!cookie.get("language")) cookie.set("language", "zh");

const lang = cookie.get("language") || "zh";

const resolve = (path, method = "get", data, config = {}) => {
  if (cookie.get("token")) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = cookie.get("token");
  }
  console.log(config);
  return new Promise((resolve, reject) => {
      new FastjsAjax(
        path,
        data,
        config
      ).send(method)
        .then(res => {
          if (res.message) {
            if (res.success)
              message.success(res.message[`${lang}`]);
            else
              message.info(res.message[`${lang}`]);
          }
          resolve(res)
        }).catch(
        err => {
          if (typeof err === "string") {
            console.log("msg", err.message);
            message.error(err);
          } else if (err instanceof Error) {
            // only keep the first line
            let msg = err.message.split("\n")[0].replace("[FastjsAjax] ", "");
            message.error(msg);
          } else {
            message.error(err.message[`${lang}`]);
          }
          reject(err)
        }
      )
    }
  )
}


export function isLogin() {
  return resolve("/api/user/userdata");
}

export function login(uname, password) {
  return resolve("/api/user/login", "post", {uname, password});
}

export function getFriends() {
  return resolve("/api/user/friends", "get");
}

export function register(email, password, autoLogin) {
  return resolve("/api/user/register", "post", {email, password, login: autoLogin});
}

export function friendRequest(uname) {
  return resolve("/api/user/add", "post", {uname});
}

export function friendRequestList() {
  return resolve("/api/user/request");
}

export function handleRequest(userid, approve) {
  return resolve("/api/user/handleRequest", "post", {userid, approve});
}

export function editUser(key, newValue) {
  return resolve("/api/user/edit", "post", {key, value: newValue});
}

export function uploadAvatar(file) {
  return resolve("/api/user/avatar", "post", {file});
}