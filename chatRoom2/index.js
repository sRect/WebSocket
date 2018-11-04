let list = document.getElementById('list'),
  input = document.getElementById('input'),
  sendBtn = document.getElementById('sendBtn');

// index.js文件
let socket = io();
// 监听与服务端的连接
socket.on('connect', () => {
  console.log('连接成功');
})

const handleSend = () => {
  let val = input.value;
  if (val) {
    // socket.send(val);
    socket.emit('message', val);
    input.value = "";
  } else {
    alert("发送内容不能为空！")
  }
}

sendBtn.addEventListener("click", handleSend);

// 增加回车键发送消息
input.addEventListener("keydown", (event) => {
  let code = event.keyCode;
  if (code === 13) {
    handleSend();
  }
})