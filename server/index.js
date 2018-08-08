//数据库
const db = require('../db');
//集合对象
const Theaters = require('../models/Theaters');
const Trailers = require('../models/Trailers');
//保存至数据库的函数
const saveTheaters = require('./save/saveTheaters');
const saveTrailers = require('./save/saveTrailers');
//封装好的uploadToQiNiu方法
const uploadToQiNiu = require('./qiniu');


/*(async ()=>{
  //链接数据库
  await db;
  //删库
  // await Theaters.remove({});
  await Trailers.remove({});
  //保存热门的数据并上传到七牛
  // await saveTheaters();
  // await uploadToQiNiu('image',Theaters);
  //保存预告片的数据并上传到七牛
  await saveTrailers();
  await uploadToQiNiu('image',Trailers);
  await uploadToQiNiu('cover',Trailers);
  await uploadToQiNiu('video',Trailers);

})();*/
