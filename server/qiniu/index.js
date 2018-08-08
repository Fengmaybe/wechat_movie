//主要功能就是从数据中抓取要上传的资源文件到七牛存储空间中
//why do this method?
//owing to 我们在查看豆瓣的热门的图片时是会去访问豆瓣地址下的URL这个时候就会有一定的限制，所以需要去上床到七牛

//重新封装了。可以同时处理三种类型的方法


//引入upload封装的方法
const upload = require('./upload');
//引入生成唯一的ID
const nanoid  = require('nanoid');

//暴露出去
module.exports = async (type,model) => {
  /*
   type: 区分上传的媒体类型:image,cover,video
   model: 对哪个集合进行操作:theaters   trailers
  */
  let obj1 = {};
  let obj2 = {};
  let obj3 = {};
  let keyType = '';
  let keyName = '.jpg';

  if(type === 'image'){
    keyType = 'posterKey';
  }else if(type === 'cover'){
    keyType = 'coverKey';
  }else if (type === 'video') {
    keyType = 'videoKey';
    keyName = '.mp4'
  }

  //总体上-放在外面减少代码--对象[属性]
  obj1[keyType] = '';
  obj2[keyType] = null;
  obj3[keyType] = {$exists: false};

  //在数据库中没有的才去上传--movies此时表示文档对象（可能是theaters   trailers）
  const movies = await model.find({
    $or:[obj1,obj2,obj3]
  })

  //遍历取出每一个文档对象
  for (var i = 0; i < movies.length; i++) {
    //文档对象一个
    let movie = movies[i];
    /*----现在要上传两个参数处理一下URL和唯一的key值----*/
    //使用naniod库去生成唯一的key值
    let key = nanoid() + keyName;
    let url = '';
    if (type === 'image') {
      url = movie.image;
    } else if (type === 'cover') {
      url = movie.cover;
    } else if (type === 'video') {
      url = movie.video;
    }
    //调用upload的方法网络资源到七牛云中
    await upload(url,key);
    //将key值保存到相应的文档对象里
    /*我们保存到数据库有两种：
    * 集合对象.create({})
    * 文档.属性=属性  文档.save()
    * */
    movie[keyType] = key;
    await movie.save(err=>{
      if(!err){
        console.log('插入一条成功了');
      }
    })

  }

};