const Koa = require("koa");
const Router = require('koa-router');
const satic = require("koa-static"); // 静态服务
const bodyParser = require('koa-bodyparser'); // 中间件
const fs = require("fs");
const path = require("path");
const app = new Koa();
const router = new Router();
//通过node的http模块来创建一个server服务
const server = require('http').createServer(app.callback());
// WebSocket是依赖HTTP协议进行握手的
const io = require("socket.io")(server);

app.use(bodyParser());
app.use(satic(path.join(__dirname)))

const handler = async (ctx, next) => { // 全局处理错误
  try {
    await next()
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = {
      message: err.message
    };
    ctx.app.emit('error', err, ctx); // 释放error
  }
}
app.use(handler);

const render = () => { // 读取首页
  return new Promise((resolve, reject) => {
    fs.readFile('./index.html', 'utf-8', (err, data) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

router.get('/', async (ctx, next) => { // get请求
  ctx.response.type = "html";
  // let path = ctx.request.path;
  ctx.response.body = await render();
  next();
})

app.use(router.routes())
  .use(router.allowedMethods());

app.on('error', function (err) {
  console.log('logging error ', err.message);
  console.log(err);
});

// app.listen(3000, () => {
//   console.log('====your app is running at port 3000=====')
// })


/**
 * 使用socket.io
 */
// 监听服务端和客户端的连接情况
let currentUsername = "";
let socketObj = {}; // 用来保存对应的socket，就是记录对方的socket实例
const SYSTEM = '系统';

io.on('connection', function (socket) {
  // 监听客户端发来的消息
  socket.on('message', function (data) {
    console.log(`来自客户端${data.username}的消息：${data.msg}`);   // 这个就是客户端发来的消息
    currentUsername = data.username;
    let private = data.msg.match(/@([^ ]+) (.+)/); // 正则判断消息是否为私聊专属

    if (private) { // 私聊消息
      let toUser = private[1]; // 私聊的用户，正则匹配的第一个分组
      let content = private[2]; // 私聊的内容，正则匹配的第二个分组
      let toSocket = socketObj[toUser]; // 从socketObj中获取私聊用户的socket

      if (toSocket) {
        // 向私聊的用户发消息
        toSocket.send({
          user: data.username,
          content,
          createAt: new Date().toLocaleString()
        })

        socketObj[currentUsername].send({ // @别人的消息，同时也给自己也发一份
          user: data.username,
          content: data.msg,
          createAt: new Date().toLocaleString()
        })
      }
    } else { // 公聊消息
      // io.emit()方法是向大厅和所有人房间内的人广播
      io.emit('message', {
        user: data.username,
        content: data.msg,
        createAt: new Date().toLocaleString()
      });
    }
  });

  socket.on('username', function (val) {
    currentUsername = val;
    // 向除了自己的所有人广播，毕竟进没进入自己是知道的，没必要跟自己再说一遍
    socket.broadcast.emit('message', {
      user: SYSTEM,
      content: `${val}加入了聊天！`,
      createAt: new Date().toLocaleString()
    });

    // 把socketObj对象上对应的用户名赋为一个socket
    // 如： socketObj = { '周杰伦': socket, '谢霆锋': socket }
    socketObj[val] = socket;
  });
});

// 这里要用server去监听端口，而非app.listen去监听(不然找不到socket.io.js文件)
server.listen(3000, () => {
  console.log("your app is successful running");
})