const express = require('express');
const app = express();
//链接数据库
const db = require('./db');
//引入模块
const router = require('./router');

(async ()=>{
  //在主模块上要去链接数据库，这样才可以去访问数据库
  await db;
  //引入模块，去去配置viewsejs模块。
  app.set('views', 'views');
  app.set('view engine', 'ejs');
//应用中间件
  app.use(router);
})();

app.listen(3000,(err)=>{
  if(!err){
    console.log('服务器开启成功···');
  }
});