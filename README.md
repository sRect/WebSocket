## koa2 + websocket
[WebSocket是时候展现你优秀的一面了](https://juejin.im/post/5bc7f6b96fb9a05d3447eef8)

> 客户端
```javascript
// 只需要new一下就可以创建一个websocket的实例
// 我们要去连接ws协议
// 这里对应的端口就是服务端设置的端口号9999
let ws = new WebSocket('ws://localhost:9999');

// onopen是客户端与服务端建立连接后触发
ws.onopen = () => {
  ws.send("你好，服务端");
}

// onmessage是当服务端给客户端发来消息的时候触发
ws.onmessage = function (res) {
  console.log(res);   // 打印的是MessageEvent对象
  // 真正的消息数据是 res.data
  document.write(`来自服务端的消息：${res.data}`);
};
```

> 服务端
```javascript
const Koa = require("koa");
const Router = require('koa-router');
const satic = require("koa-static"); // 静态服务
const fs = require("fs");
const path = require("path");

const app = new Koa();
const router = new Router();

router.get('/', async (ctx, next) => { // get请求
  ctx.response.type = "html";
  // let path = ctx.request.path;
  ctx.response.body = await render();
  next();
})

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('====your app is running at port 3000=====')
})

app.use(satic(path.join(__dirname)))

/**
 * 开始创建一个websocket服务
 */
const Server = require('ws').Server;
// 这里是设置服务器的端口号，和上面的3000端口不用一致
const ws = new Server({ port: 9999 });

// 监听服务端和客户端的连接情况
ws.on('connection', function (socket) {
  // 监听客户端发来的消息
  socket.on('message', function (msg) {
    console.log(`来自客户端的消息：${msg}`);   // 这个就是客户端发来的消息
    // 来而不往非礼也，服务端也可以发消息给客户端
    socket.send(`你好，客户端！`);
  });
});
```