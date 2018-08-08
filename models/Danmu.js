//创建Danmu集合
const mongoose = require('mongoose');
const Scheme = mongoose.Schema;


const danmuSchema = new Scheme({
  /*id=---注意，正因为其不唯一，才会可以在多个视频中插入弹幕*/
  player:String,
  author:String,
  time:Number,
  text:String,
  color:String,
  permission:{
    type:Number,
    default:0
  }

});

//创建集合和暴露集合
const Danmus = mongoose.model('Danmus',danmuSchema);
module.exports = Danmus;

/*
         发送请求，请求弹幕信息（去网络资源上看）
           请求方式： GET
           请求地址： https://api.prprpr.me/dplayer/v2/?id=demo
         发送弹幕消息的请求
           请求方式： POST
           请求地址： https://api.prprpr.me/dplayer/v2/

             {
             player: "demo",    //弹幕的id
             author: "DIYgod",  //用户
             time: 0,           //弹幕的发送时间
             text: "6666666666666",  //弹幕的内容
             color: "#fff",     //弹幕的字体颜色
             type: "right"      //弹幕的初始出现位置
             }

        */


