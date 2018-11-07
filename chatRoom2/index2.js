class Parent {
  constructor() {
    this.socket = null; // socket实例
    this.usernameVal = null; // 当前用户名
    this.config = {
      list: document.getElementById('list'),
      input: document.getElementById('input'),
      sendBtn: document.getElementById('sendBtn'),
      username: document.getElementById('username'),
      usernameConfirmBtn: document.getElementById('usernameConfirmBtn'),
      joinRoomA: document.getElementById('joinRoomA'),
      leaveRoomA: document.getElementById('leaveRoomA'),
      joinRoomB: document.getElementById('joinRoomB'),
      leaveRoomB: document.getElementById('leaveRoomB')
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
      li.className = "li-group-item clearfix";
      li.innerHTML = `
        <p style="color: #ccc;" class="${data.user === this.usernameVal ? 'selfInfo' : ''}">
          <span class="user" style="${data.color !== undefined ? `color: ${data.color}` : ''}">${data.user}</span>
          ${data.createAt}
        </p>
        <p class="content ${data.user === this.usernameVal ? 'selfInfo2' : ''}" style="${data.color !== undefined ? `background: ${data.color}` : ''}">${data.content}</p>
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

  // 加入某战队聊天
  handleJoinRoom(roomname, username = this.usernameVal) {
    if (this.usernameVal === null) {
      alert("请先输入您的昵称！")
      return;
    }
    this.socket.emit('join', {
      roomname,
      username
    });
  }

  // 是否已进入房间
  handleHasJoinRoom() {
    this.socket.on("joined", (room) => {
      this.config.joinRoomA.style.display = 'none';
      this.config.leaveRoomA.style.display = 'inline-block';
    })
  }

  // 离开战队聊天
  handleLeaveRoom(roomname, username = this.usernameVal) {
    this.socket.emit('leave', {
      roomname,
      username
    });
  }

  // 是否已离开战队聊天
  handleHasleavedRoom() {
    this.socket.on("leaved", (room) => {
      this.config.joinRoomA.style.display = 'inline-block';
      this.config.leaveRoomA.style.display = 'none';
    })
  }
}

class Child extends Parent {
  constructor() {
    super();
  }

  handleConfirmUsername() {
    parent.config.usernameConfirmBtn.addEventListener("click", () => {
      super.setUsername();
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

  // @某人
  handleEmitSomeone() {
    parent.config.list.addEventListener("click", function (event) {
      let target = event.target.nodeName.toLowerCase();
      if (target === "li") {
        let user = event.target.children[0].children[0].innerHTML;
        input.value = `@${user} `;
        input.focus();
      }
    }, false)
  }

  joinOrLeaveRoom() {
    parent.config.joinRoomA.addEventListener("click", () => {
      super.handleJoinRoom("roomA")
    })

    parent.config.leaveRoomA.addEventListener("click", () => {
      super.handleLeaveRoom("roomA")
    })

    parent.config.joinRoomB.addEventListener("click", () => {
      super.handleJoinRoom("roomB")
    })

    parent.config.leaveRoomB.addEventListener("click", () => {
      super.handleLeaveRoom("roomB")
    })
  }

  init() {
    this.initSocket();
    this.handleReceiveMessage();
    this.handleConfirmUsername();
    this.handleSendMsg();
    this.enterKeyDown();
    this.handleEmitSomeone();
    this.joinOrLeaveRoom();
    this.handleHasJoinRoom();
    this.handleHasleavedRoom();
  }
}

const parent = new Parent();
const child = new Child();
child.init();