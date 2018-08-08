//数据库链接
//1.引入mongoose模块（因为Node原生的MongoDB模块进行了进一步的优化封装）
const mongoose = require('mongoose');
//2.暴露出去 （使用promise封装--异步操作。因为要等数据库链接成功后再去相应的其他逻辑）
module.exports = new Promise((resolve, reject) => {
  mongoose.connect('mongodb://localhost:27017/lyuya_movie');
  mongoose.connection.once('open',err=>{
    if(!err){
      console.log('数据库链接成功···');
      resolve();
    }else{
      reject('数据库链接失败'+err);
    }
  })
});