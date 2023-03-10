<template>
  <div id="chatindex">
    <div class="sidebar" :class="{active: !chatTarget}">
      <div class="user" v-for="user in $store.state.friends" @click="chatTarget = user;loadMessage()"
           :class="{focus: chatTarget?.userid === user.userid}">
        <a-badge :dot="!!$store.state.db[user.userid]?.unread">
          <a-avatar class="avatar" shape="square" :src="user.avatar">
            <template #icon v-if="!user.avatar">
              <UserOutlined/>
            </template>
          </a-avatar>
        </a-badge>
        <div class="name">
          {{ user.nickname }}
        </div>
      </div>
    </div>
    <div class="index" v-if="chatTarget" :class="{active: !!chatTarget}">
      <div class="header">
        <CaretLeftOutlined class="back" @click="chatTarget = null"/>
        <div class="title">
          {{ chatTarget.nickname }}
        </div>
        <div class="right">
          <DeleteOutlined @click="clearChatRecordActive = true"/>
          <a-modal
              :title="lang.name.clearMsg"
              :visible="clearChatRecordActive"
              @ok="clearChatRecord"
              @cancel="clearChatRecordActive = false"
          >
            <p>{{lang.name.clearMsgConfirm}}</p>
          </a-modal>
        </div>
      </div>
      <div class="content">
        <div class="message-wrapper" @scroll="scroll">
          <div class="message-box">
            <div class="message-inside">
              <!--suppress JSObjectNullOrUndefined -->
              <div class="message" v-for="message in $store.state.msgdb[chatTarget.userid]"
                   :class="{self: message.from === $store.state.user.userid}">
                <div class="content">
                  {{ message.message }}
                </div>
                <div class="time">
                  {{ message.time }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bottom">
          <div class="input-box" @keydown.enter="send">
            <a-input v-model:value="message"/>
          </div>
          <div class="footer">
            <a-button type="primary" class="right" @click="send">{{ lang.name.send }}</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {UserOutlined, CaretLeftOutlined, DeleteOutlined} from '@ant-design/icons-vue';
import {rand, selecter} from "fastjs-next";
import langSetup from "@/lang";
import {message} from "ant-design-vue";
import cookie from "js-cookie";

const lang = langSetup("chat");

export default {
  name: "index",
  data() {
    this.$emit("refreshFriend", true);
    return {
      chatTarget: null,
      message: "",
      sending: [],
      autoUpdate: setInterval(() => void this.$emit("refreshFriend"), 5000),
      lang,
      clearChatRecordActive: false
    }
  },
  beforeUnmount() {
    console.log("clearInterval", this.autoUpdate);
    clearInterval(this.autoUpdate);
  },
  methods: {
    clearChatRecord() {
      this.$store.commit("clearMessage", this.chatTarget.userid);
      this.clearChatRecordActive = false;
      message.success("????????????????????????");
    },
    newMsg(id) {
      console.log(id, this.chatTarget?.userid);
      if (this.chatTarget?.userid === id) {
        this.$nextTick(() => {
          const messageInside = selecter(".message-inside").el()
          console.log("newMsg -> messageInside", messageInside, messageInside.scrollHeight, messageInside.scrollTop)
          messageInside.scrollTo(0, messageInside.scrollHeight);
        });
      }
    },
    send() {
      console.log(this.$store);
      if (this.message === "") {
        return message.error(lang.error.empty);
      }
      // random 16-bit number
      const msgid = rand(1000000000000000, 9999999999999999);
      this.$store.state.ws.msg({
        type: "message",
        token: cookie.get("token"),
        iwant: msgid,
        data: {
          from: this.$store.state.user.userid,
          to: this.chatTarget.userid,
          message: this.message
        }
      })
      this.sending[msgid] = {
        load: message.loading(lang.message.sending, 0),
        message: this.message,
      }
      this.message = "";
    },
    success(msgid, time) {
      this.sending[msgid].load()
      this.$store.commit("pushMessage", {
        from: this.$store.state.user.userid,
        to: this.chatTarget.userid,
        message: this.sending[msgid].message,
        time,
      })
      this.$nextTick(() => {
        const messageInside = selecter(".message-inside").el();
        messageInside.scrollTo(0, messageInside.scrollHeight);
      })
    },
    loadMessage() {
      this.$store.commit("clearUnread", this.chatTarget.userid);
      const waitLoad = setInterval(() => {
        if (selecter(".message-box").length) {
          clearInterval(waitLoad);
        } else return
        const messageInside = selecter(".message-inside").el();
        messageInside.scrollTo(0, messageInside.scrollHeight);
        this.$store.dispatch("autoLoadMessage", this.chatTarget.userid);
        let timer = null;
        selecter(".message-inside").on("scroll", el => {
          el = el.el()
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            if (el.scrollTop === 0) {
              // if it can't scroll, then don't load
              if (el.scrollHeight === el.clientHeight)
                return;
              console.log("scroll -> loadMessage -> el", el)
              let oldHeight = selecter(".message-inside").el().scrollHeight;
              this.$store.commit('loadMessage', this.chatTarget.userid);
              this.$nextTick(() => {
                el.scrollTo(0, el.scrollHeight - oldHeight);
              });
            }
          }, 100);
        });
        messageInside.scrollTo(0, messageInside.scrollHeight);
      }, 100)
    },
  },
  components: {
    UserOutlined,
    CaretLeftOutlined,
    DeleteOutlined
  },
}
</script>

<style lang="less" scoped>
#chatindex {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100%;

  .sidebar {
    width: 240px;
    float: left;
    height: 100%;
    background-color: #f0f0f0;
    border-right: 1px solid #d9d9d9;
    overflow: auto;

    .user {
      width: 100%;
      height: 50px;
      background-color: #fff;
      border-bottom: 1px solid #d9d9d9;
      display: flex;
      padding: 9px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover, &.focus {
        background-color: #dcdcdc;
      }

      > * {
        height: 32px;
        line-height: 32px;
        margin-right: 8px;
        user-select: none;
      }
    }
  }

  .index {
    width: calc(100% - 240px);
    height: 100%;

    .header {
      height: 50px;
      background-color: #fff;
      border-bottom: 1px solid #d9d9d9;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 16px;
      line-height: 22px;
      user-select: none;

      .back {
        font-size: 20px;
        margin-right: 8px;
        cursor: pointer;
        display: none;
      }

      .right {
        margin-left: auto;
        display: flex;
        font-size: 20px;

        > * {
          margin-left: 8px;
          cursor: pointer;
        }
      }
    }

    .content {
      height: calc(100% - 50px);
      background-color: #fff;

      .message-wrapper {
        height: calc(100% - 200px);
        width: calc(100% - 32px);
        margin: 16px;
        display: inline-block;

        .message-box {
          scrollbar-width: none;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column-reverse;
          justify-content: flex-start;

          .message-inside {
            overflow-x: auto;
            scrollbar-width: none;

            .message {
              display: flex;

              .content {
                order: 1;
                max-width: calc(100vw - 50%);
                overflow-wrap: anywhere;
              }

              .time {
                order: 2;
                // no break
                white-space: nowrap;
                color: #999;
                font-size: 10px;
                margin: 0 8px;
                line-height: 18px;
                user-select: none;
              }

              &.self {
                .time {
                  order: 0;
                  margin-left: auto;
                }
              }
            }
          }
        }
      }


      .bottom {
        height: 200px;
        padding: 16px;
        border-top: 1px solid #d9d9d9;
        position: relative;

        .footer {
          position: absolute;
          bottom: 50px;
          width: calc(100% - 32px);

          .right {
            float: right;
          }
        }
      }
    }
  }
}

// mobile
@media screen and (max-width: 500px) {
  #chatindex {
    overflow-y: hidden;
    display: block;

    .sidebar {
      width: 0;
      transition: width 0.5s;

      &.active {
        width: 100%;
      }
    }

    .index {
      width: 0;
      transition: width 0.5s;

      &.active {
        width: 100%;
      }

      .header {
        .back {
          display: block;
        }
      }

      .content {
        .message-wrapper {
          width: calc(100% - 33px);
        }
      }
    }
  }
}
</style>