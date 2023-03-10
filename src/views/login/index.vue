<template>
  <div id="login">
    <a-form
        :model="formState"
        name="normal_login"
        class="login-form"
        @finish="onFinish"
        @finishFailed="onFinishFailed"
        :rules="formRules"
    >
      <a-form-item
          :label="lang.name.username"
          name="uname"
      >
        <a-input v-model:value="formState.uname">
          <template #prefix>
            <UserOutlined class="site-form-item-icon"/>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
          :label="lang.name.password"
          name="password"
      >
        <a-input-password v-model:value="formState.password">
          <template #prefix>
            <LockOutlined class="site-form-item-icon"/>
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item class="bottom">
        <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
          {{ lang.name.login }}
        </a-button>
        <router-link to="/register" class="text">
          {{ lang.name.register }}
        </router-link>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import {UserOutlined, LockOutlined} from '@ant-design/icons-vue';
import langSetup from "@/lang";
import {message} from "ant-design-vue";
import {isLogin, login} from "@/api.js";
import cookie from "js-cookie";

const lang = langSetup("login");

export default {
  name: "index",
  data() {
    isLogin().then(res => {
      if (res.login) this.$router.push("/");
    });
    const uname = (_rule, val) => {
      if (val.length > 50) {
        return Promise.reject(lang.rules.username.length);
      }
      // 格式验证
      if (/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-]+)$/g.test(val)) {
        return Promise.resolve();
      } else if (/^\d+$/g.test(val)) {
        return Promise.resolve();
      } else {
        return Promise.reject(lang.rules.username.format);
      }
    }
    const password = (_rule, val) => {
      if (val.length < 5)
        return Promise.reject(lang.rules.password.minlength);
      if (val.length > 50)
        return Promise.reject(lang.rules.password.maxlength);
      // 格式验证
      if (/^[A-Za-z0-9_-]+$/g.test(val))
        return Promise.resolve();
      return Promise.reject(lang.rules.password.format);
    }

    return {
      formState: {
        uname: "",
        password: "",
        remember: true
      },
      formRules: {
        uname: [
          {required: true, message: lang.rules.username.required},
          {validator: uname, trigger: "change"}
        ],
        password: [
          {required: true, message: lang.rules.password.required},
          {validator: password, trigger: "change"}
        ]
      },
      disabled: false,
      lang
    }
  },
  methods: {
    onFinish() {
      this.disabled = true;
      const loginLoad = message.loading({
        content: lang.message.loading,
        key: "login",
        duration: 0
      });
      login(this.formState.uname, this.formState.password).then(res => {
        loginLoad()
        cookie.set("token", res.token, {expires: 1});
        this.$store.commit("login", res);
        this.$router.push({path: "/"});
      }).catch((err) => {
        if (!err.message) message.error(lang.message.error);
        this.disabled = false;
        loginLoad()
      });
    },
    onFinishFailed() {
      this.disabled = false;
    }
  },
  components: {
    UserOutlined,
    LockOutlined
  }
}
</script>

<style lang="less" scoped>
#login {
  width: 380px;
  height: 380px;
  padding: 30px;
  background: #fff;
  border-radius: 6px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;

  .bottom {
    position: absolute;
    bottom: 0;
    width: calc(100% - 60px);

    .login-form-button {
      width: 100%;
    }

    .text {
      text-decoration-line: underline;
      margin-top: 10px;
      color: #25aee4;
      width: 100%;
      text-align: center;
      display: inline-block;
    }
  }
}
</style>