class Parent {
  constructor() {
    this.socket = null; // socket实例
    this.usernameVal = ""; // 当前用户名
    this.config = {
      list: document.getElementById('list'),
      input: document.getElementById('input'),
      sendBtn: document.getElementById('sendBtn'),
      username: document.getElementById('username'),
      usernameConfirmBtn: document.getElementById('usernameConfirmBtn')
    }
  }

  // 初始化socket连接
  initSocket() {
    this.socket = io();
    // 监听与服务端的连接
    this.socket.on('connect', () => {
      console.log('socket初始化连接成功');
    })
  }

  // 发送消息
  sendMsg() {
    if (!this.usernameVal) {
      $("#myModal").modal('show');
      return;
    }

    let val = this.config.input.value;
    if (val) {
      // socket.send(val);
      this.socket.emit('message', {
        username: this.usernameVal,
        msg: val
      });
      this.config.input.value = "";
    } else {
      alert("发送内容不能为空！")
    }
  }

  // 接收消息
  handleReceiveMessage() {
    this.socket.on("message", (data) => {
      console.log(data)
      let li = document.createElement("li");
      li.className = "li-group-item";
      li.innerHTML = `
        <p style="color: #ccc;">
          <span class="user">${data.user}</span>
          ${data.createAt}
        </p>
        <p class="content">${data.content}</p>
      `;
      this.config.list.appendChild(li);
      // 将聊天区域的滚动条设置到最新内容的位置
      this.config.list.scrollTop = list.scrollHeight;
    })
  }

  // 设置用户名
  setUsername() {
    let val = this.config.username.value;
    if (val) {
      this.usernameVal = val;
      this.socket.emit("username", val);
      $("#myModal").modal('hide');
    } else {
      alert("用户名不可为空！");
    }
  }
}

class Child extends Parent {
  constructor() {
    super();
  }

  handleConfirmUsername() {
    parent.config.usernameConfirmBtn.addEventListener("click", () => {
      super.setUsername()
    });
  }

  handleSendMsg() {
    parent.config.sendBtn.addEventListener("click", () => {
      super.sendMsg();
    });
  }

  // 回车键发送消息
  enterKeyDown() {
    parent.config.input.addEventListener("keydown", (event) => {
      let code = event.keyCode;
      if (code === 13) {
        super.sendMsg();
      }
    })
  }

  init() {
    this.initSocket();
    this.handleReceiveMessage();
    this.handleConfirmUsername();
    this.handleSendMsg();
    this.enterKeyDown();
  }
}

const parent = new Parent();
const child = new Child();
child.init();