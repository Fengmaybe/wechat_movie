//调用theatersCrawler模块，返回一些数据，把这些数据保存到数据库中

//引入爬虫的模块库
const trailersCrawler = require('../crawler/trailersCrawler');
//引入集合去保存到这里
const Trailers = require('../../models/Trailers');
//引入发送请求库
const rp = require('request-promise-native');
//能抓多少就抓多少
const url = 'https://api.douban.com/v2/movie/coming_soon';

//暴露存储到数据库的方法
module.exports = async () => {
  //发送请求，去豆瓣热门电影中去请求数据
  //这里不存在跨域，由浏览器的ajax引擎维护的同源策略，现在是服务器代理的模式，服务器访问另外一个服务器
  //此时获取到的subjects是一个count为8的数组
  const {subjects} = await rp({method: 'GET', json: true, url});
  //遍历数组-大熊说用foreach会出现问题，我没有啊。
  for (let i = 0; i < subjects.length; i++){
    //拿到每一个对象--每一个电影条目信息
    const subject = subjects[i];
    //调用方法去指定网址爬取数据
    const result = await trailersCrawler(subject.alt);

    //这里要注意与热门的区别
    //没有预告片的话result结果就是undefined,不要保存数据库中，直接搜索下一个
    if(!result) continue;

    //获取到页面的所需信息
    let casts = [];
    let directors = [];
    //casts directors都是一个数组
    subject.casts.forEach(item=>{
      casts.push(item.name);
    });
    subject.directors.forEach(item => {
      directors.push(item.name);
    });
    //用集合.create-保存在数据库中
    Trailers.create({
      title: subject.title,
      rating: subject.rating.average,
      /*本身是一个数组*/
      genres: subject.genres,
      casts,
      directors,
      image: subject.images.medium,
      alt: subject.alt,
      doubanId: subject.id,
      releaseDate: result.releaseDate,  //通过爬虫爬取到的数据
      runtime: result.runtime,      //通过爬虫爬取到的数据
      summary: result.summary,      //通过爬虫爬取到的数据
      cover:result.cover,
      video:result.video,
    });
  }
};