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
const SYSTEM = '系统';
let currentUsername = "";
let userColorObj = {};
let socketObj = {}; // 用来保存对应的socket，就是记录对方的socket实例
let userColorArr = ['#00a1f4', '#0cc', '#f44336', '#795548', '#e91e63', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#ff5722'];
let rooms = [];
let mySocket = {}

const sortArr = () => { // 打乱数组
  return userColorArr.sort(() => Math.random() > 0.5);
}

io.on('connection', function (socket) {
  mySocket[socket.id] = socket; // 这是所有连接到服务端的socket.id
  // 用户名
  socket.on('username', function (val) {
    currentUsername = val;
    userColorObj[val] = sortArr()[5];

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

  // 监听客户端发来的消息
  socket.on('message', function (data) {
    console.log(`来自客户端${data.username}的消息：${data.msg}`);   // 这个就是客户端发来的消息
    currentUsername = data.username;
    let private = data.msg.match(/@([^ ]+) (.+)/); // 正则判断消息是否为私聊专属
    let color = userColorObj[data.username];

    if (private) { // 私聊消息
      let toUser = private[1]; // 私聊的用户，正则匹配的第一个分组
      let content = private[2]; // 私聊的内容，正则匹配的第二个分组
      let toSocket = socketObj[toUser]; // 从socketObj中获取私聊用户的socket

      if (toSocket) {
        // 向私聊的用户发消息
        toSocket.send({
          user: data.username,
          color,
          content,
          createAt: new Date().toLocaleString()
        })

        socketObj[currentUsername].send({ // @别人的消息，同时也给自己也发一份
          user: data.username,
          color,
          content: data.msg,
          createAt: new Date().toLocaleString()
        })
      }
    } else { // 公聊消息
      if (rooms.length) {
        let flag = false;

        rooms.forEach(item => {
          if (item.username === data.username) {
            flag = true;
          }
        })

        if (flag) { // 群聊发送
          rooms.forEach(item => {
            mySocket[item.id].emit('message', {
              user: data.username,
              color,
              content: data.msg,
              createAt: new Date().toLocaleString()
            })
          })
        } else {
          io.emit('message', {
            user: data.username,
            color,
            content: data.msg,
            createAt: new Date().toLocaleString()
          });
        }

        // rooms.forEach(item => {
        //   // 取得进入房间内所对应的所有sockets的hash值，它便是拿到的socket.id
        //   let roomSockets = io.sockets.adapter.rooms[item.id].sockets;
        //   Object.keys(roomSockets).forEach(socketId => {
        //     // 进行一个去重，在socketJson中只有对应唯一的socketId
        //     if (!socketJson[socketId]) {
        //       socketJson[socketId] = 1;
        //     }
        //   });
        // })

        // console.log(socketJson)
        // Object.keys(socketJson).forEach(socketId => {
        //   mySocket[socketId].emit('message', {
        //     user: data.username,
        //     color,
        //     content: data.msg,
        //     createAt: new Date().toLocaleString()
        //   });
        // });
      } else { // 非群聊消息
        // io.emit()方法是向大厅和所有人房间内的人广播
        io.emit('message', {
          user: data.username,
          color,
          content: data.msg,
          createAt: new Date().toLocaleString()
        });
      }

      console.log(`rooms: ${JSON.stringify(rooms)}`)
    }
  });

  // 监听进入房间
  socket.on('join', data => {

    let color = userColorObj[data.username];
    let arr = rooms.filter((item, index) => {
      if (item.username === data.username) {
        return item;
      }
    });
    // 判断一下用户是否进入了房间，如果没有就让其进入房间内
    if (data.username && !arr.length) {
      socket.join(data.roomname); // socket.join表示进入某个房间
      rooms.push({
        username: data.username,
        roomname: data.roomname,
        id: socket.id
      });

      socket.emit('joined', data.roomname); // 告诉前端，已经进入房间
      console.log(`rooms: ${JSON.stringify(rooms)}`)
      socket.send({
        user: SYSTEM,
        color,
        content: `你已加入${data.roomname}战队`,
        createAt: new Date().toLocaleString()
      });
    }
  })

  // 监听离开房间
  socket.on('leave', data => {
    let color = userColorObj[data.username];
    if (data.username && rooms.length) {
      socket.leave(data.roomname); // 离开该房间
      for (let i = 0, len = rooms.length; i < len; i++) {
        if ((rooms[i].username === data.username) && (rooms[i].roomname === data.roomname)) {
          rooms.splice(i, 1); // 删掉用户在该房间
          break;
        }
      }

      console.log(`rooms: ${JSON.stringify(rooms)}`)
      socket.emit('leaved', data.roomname); // 告诉前端，已经离开房间
      // 通知一下自己
      socket.send({
        user: SYSTEM,
        color,
        content: `你已离开${data.roomname}战队`,
        createAt: new Date().toLocaleString()
      });
    }
  })
});

// 这里要用server去监听端口，而非app.listen去监听(不然找不到socket.io.js文件)
server.listen(3000, () => {
  console.log("your app is successful running");
})