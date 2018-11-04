let list = document.getElementById('list'),
  input = document.getElementById('input'),
  sendBtn = document.getElementById('sendBtn');

// index.js文件
let socket = io();
// 监听与服务端的连接
socket.on('connect', () => {
  console.log('连接成功');
})

// 发送消息
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

// 监听message事件来接收服务端发来的消息
socket.on("message", (data) => {
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
  list.appendChild(li);
  // 将聊天区域的滚动条设置到最新内容的位置
  list.scrollTop = list.scrollHeight;
})

sendBtn.addEventListener("click", handleSend);

// 增加回车键发送消息
input.addEventListener("keydown", (event) => {
  let code = event.keyCode;
  if (code === 13) {
    handleSend();
  }
})