const express = require('express');
const Router = express.Router;
const router = new Router();
//引入auth模块(两个服务器的连接)
const reply = require('../reply');
//引入wechat
const Wechat =  require('../wechat/wechat');
const wechatApi = new Wechat();
//加密
const sha1 = require('sha1');
//引入下config配置对象中的URL，每次记得更新下去。
const {url} = require('../config');
//引入集合
const Theaters = require('../models/Theaters');
const Danmu = require('../models/Danmu');
const Trailers = require('../models/Trailers');


//用户访问客户端中的触发的路由
router.get('/search',async(req,res)=>{
  /*签名生成规则如下：
  * 1.参与签名的字段包括noncestr（随机字符串）, 有效的jsapi_ticket, timestamp（时间戳）, url（当前网页的URL，不包含#及其后面部分）
  * 2.对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后
  * 3.使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。
  * 这里需要注意的是所有参数名均为小写字符。
  * 4.对string1作sha1加密，字段名和字段值都采用原始值，不进行URL 转义。
  * */
  /*1.获取一些所需的参数*/
  const noncestr = Math.random().toString().split('.')[1];
  const {ticket} = await wechatApi.fetchTicket();
  const timestamp = Date.now();
  /*2.拼成数组--键值对--注意参数是小写*/
  /*注意URL后面加个/search*/
  const paramsValue = [
    'jsapi_ticket=' + ticket,
    'noncestr=' + noncestr,
    'timestamp=' + timestamp,
    'url=' + url + '/search'
  ]
  /*3.字典序--4.加密--用签名signature去对比*/
  const signature = sha1(paramsValue.sort().join('&'));
  //下载ejs模块，将数据渲染到页面上--因为在ejs模块上要用到这几个值
  res.render('search', {
    signature,
    noncestr,
    timestamp
  })

});

//详情页面
router.get('/details/:id',async (req,res)=>{
  //获取到ID值
  const {id} = req.params;
  //去数据库中查找这个,查找到这个对象
  const data =await Theaters.findOne({doubanId:id});
  //数据渲染到页面上
  res.render('details',{data});
});

//movie
router.get('/movie',async (req,res)=>{
  //去数据库中查找所有的预告片ejs要用到的视频数据
  const movies = await Trailers.find({});
  //然后渲染到movies.ejs
  res.render('movie',{movies,url});
})

//接受用户发送的弹幕消息保存到数据库，这样子下面才可以直接数据库中查询弹幕返回给指定播放器的操作
router.post('/v2',async (req,res)=>{
  //获取用户提交的信息
  let result = '';
  req
    .on('data',data=>{
      result += data.toString();
    })
    .on('end',async ()=>{
      //监听所有数据都接受完毕
      // console.log(result);
      //{"player":26752088,"author":"DIYgod","time":22.713484,"text":"666666","color":"#fff","type":"right"}
      //从上面可以知道其接受到的数据是一个json文件，故要转为对象
      result = JSON.parse(result);
      //保存数据库把
      await Danmu.create({
        player : result.player,
        author : result.author,
        time : result.time,
        text : result.text,
        color : result.color,
        type : result.type
      });
      //本应该是send（ok）给他，可以要传一个json，那么简单点就是传为空
      res.send();
    })
});

//接受请求，返回所有弹幕数据给播放器
//类似的其请求地址请求地址： https://api.prprpr.me/dplayer/v2/?id=demo
router.get('/v2',async (req,res)=>{
  //获取播放器的ID值--对应哪个视频素材
  const {id} = req.query;
  //通过数据库中查找所有指定的ID弹幕.data是一个数组
  const data = await Danmu.find({player:id});
  //现在要组装一下，返回其原本的一个格式。他才可以识别的出来。
  /*{"code": 0,"version": 2,"danmaku": [[3.3964, 0,"#fff","DIYgod","11111"]]}*/
  //可以发现我们将数据库中的属性拼接成一个数组
  //所有弹幕的集合数组（组装）---注意一下原本的名字咯，这里有个小坑
  let danmaku = [];
  //遍历data
  for (var i = 0; i < data.length; i++) {
    let item = data[i];
    //压入一条弹幕（注意按照其原本的顺序，不要改变咯。）
    danmaku.push([item.time, item.permission, item.color, item.author, item.text]);
  }
  //返回给指定的播放器--拼接成固定格式-让其去自动解析
  res.send({
    code:0,
    version:2,
    /*数组哦damaku*/
    danmaku
  })
});


//应用中间件（可以接受所有请求）
router.use(reply());

module.exports = router;