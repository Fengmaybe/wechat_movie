//创建集合
//把数据库中的集合先创建出来，包括其约束条件
const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

//https://api.douban.com/v2/movie/in_theaters
const theatersSchema = new Scheme({
  title: String,
  /*数据库存的就是rating*/
  rating: Number,
  /*电影类型*/
  genres: [String],
  casts: [String],
  directors: [String],
  /*json是从subjects.images.small*/
  image: String,
  alt: String,
  /*豆瓣ID-唯一性*/
  doubanId: {
    type: String,
    unique: true
  },
  /*从页面中获取的上映时间*/
  releaseDate: String,  //通过爬虫爬取到的数据
  runtime: String,      //通过爬虫爬取到的数据
  summary: String,      //通过爬虫爬取到的数据
  posterKey: String,    //七牛图片的key值
  createTime: {
    type: Date,
    default: Date.now()
  }
});

//创建集合和暴露集合
const Theaters = mongoose.model('Theaters',theatersSchema);
module.exports = Theaters;
