//设置根据其message的类型，去设置具体的回复内容

//引入模块
const template = require('./template');

//引入menu模块
const menu = require('../wechat/menu');
const {url} = require('../config');
//引入models模块
const Theaters = require('../models/Theaters');
const rp = require('request-promise-native');

module.exports = async (message)=>{

  //定一个对象options传递给template模板去返回一个XML数据
  let options = {
    toUserName : message.FromUserName,
    fromUserName : message.ToUserName,
    createTime : Date.now(),
    msgType : 'text'
  }
  //设置回复用户的消息内容
  let content = '';
  //对简单文本进行处理
  if(message.MsgType === 'text' ){
    if(message.Content === '首页'){
      //跳转到我的影院预告片的首页--图文
      content = [{
        title: 'Fengmaybe影院预告片首页',
        description: '啥电影都有~',
        picUrl: 'https://vfxreel.net/wp-content/uploads/2016/06/SoundMorph-Sinematic.png',
        url: url + '/movie'
        /*周一写的一个路由*/
      }];
      options.msgType = 'news';

    }else if(message.Content === '热门'){
      //实现热门关键字回复--以图文消息回复[数组]
      //1.引入集合，从集合中获取数据（链接数据库放在主模块上）获取热门信息数据
      const TheatersData = await Theaters.find({});
      //2.插入到数组中，以图文消息展示
      content=[];
      for (let i = 0; i < TheatersData.length; i++) {
        //获取到一条电影条目
        let movieItem = TheatersData[i];
        //在这条电影条目中去得到想要显示的图文消息数据{}
        content.push({
          title: movieItem.title,
          description: movieItem.summary,
          picUrl: movieItem.image,
          url: url + '/details/' + movieItem.doubanId
        });
      }
      options.msgType = 'news';
    }else{
      //其他的任何除了首页和热门都去操作为搜索电影条目---最多八个图文
      //这里有个坑，就是URL会被解析成转义中文就会成%$*``这种，为了不让其转义，请求用qs(queryString)
      //1.去豆瓣请求资源，获取数据
      const url = 'https://api.douban.com/v2/movie/search';
      const {subjects} = await rp({method: 'GET',json:true,url,qs:{count:8,q:message.Content}});
      //2.得到一个数组，遍历呗，因为中间无其他操作可以直接用foreach
      content = [];
      /*从网页json文件直接读取的*/
      subjects.forEach(item=>{
        content.push({
          title: item.title,
          description: '评分：' + item.rating.average,
          picUrl: item.images.small,
          url: item.alt
        })
      });
      options.msgType = 'news';
    }
  }else if(message.MsgType === 'voice' ){
    //音频
    //1.去豆瓣请求资源，获取数据
    const url = 'https://api.douban.com/v2/movie/search';
    const {subjects} = await rp({method: 'GET',json:true,url,qs:{count:8,q:message.Recognition}});
    //2.得到一个数组，遍历呗，因为中间无其他操作可以直接用foreach
    content = [];
    /*从网页json文件直接读取的*/
    subjects.forEach(item=>{
      content.push({
        title: item.title,
        description: '评分：' + item.rating.average,
        picUrl: item.images.small,
        url: item.alt
      })
    });
    options.msgType = 'news';

  }else if(message.MsgType === 'event' ){
    if(message.Event === 'subscribe'){
      //用户订阅事件
      content = '小哥哥，小姐姐，终于等到你啦，我要开车了，快上车吧，滴滴~~ \n' +
        '📍-回复 👉首页👈 查看Fengmaybe影院首页 \n' +
        '📍-回复 👉热门👈 查看热门电影信息 \n' +
        '📍-回复 👉文字消息👈 搜索指定电影信息 \n' +
        '📍-回复 👉语音消息👈 搜索指定电影信息 \n' +
        '📍也可以点击链接跳转<a href="' + url + '/search">AI语音识别Moive</a>';

    }else if(message.Event === 'unsubscribe'){
      console.log('用户无情的抛弃了你，你还傻不拉几着等待···fool or native ？');
    }else if(message.Event === 'CLICK'){
      content = '小哥哥，小姐姐，终于等到你啦，我要开车了，快上车吧，滴滴~~ \n' +
        '📍-回复 首页 查看Fengmaybe影院首页 \n' +
        '📍-回复 热门 查看热门电影信息 \n' +
        '📍-回复 文字消息 搜索指定电影信息 \n' +
        '📍-回复 语音消息 搜索指定电影信息 \n' +
        '📍也可以点击链接跳转<a href="' + url + '/search">AI语音识别Moive</a>';
    }
  }
  //防止content为空，出现暂停服务的提示
  if(content === ''){
    content = '你的网路资源很差哦，请稍后再试'
  }

  //将内容添加到options的对象属性中
  options.content = content;
  //把这个option中的一切数据，包括content数据去发给模板，返回一个XML格式的数据
  return template(options);

};