//创建集合
//把数据库中的集合先创建出来，包括其约束条件
/*最后一天的视频抓取到数据上传七牛的整体步骤
*1.新建一个集合对象trailers
* 2.抓取的一个方法（比theaters热门的多了三个数据，所以在创建一个专门的）
*3.上传七牛（包装封装一下。因为在upload中可以同时处理海报图，电影封面图和视频素材的）
 *  */
const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

//https://api.douban.com/v2/movie/in_theaters
const trailersSchema = new Scheme({
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
  cover:String,
  video:String,
  posterKey: String,    //七牛热门海报图片的key值
  coverKey: String,
  videoKey: String,
  createTime: {
    type: Date,
    default: Date.now()
  }
});

//创建集合和暴露集合
const Trailers = mongoose.model('Trailers',trailersSchema);
module.exports = Trailers;
