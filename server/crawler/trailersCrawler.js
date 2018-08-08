//无头浏览器：可以后台运行浏览器（没有界面显示）
//puppeteer需要下载（Google）很棒的.五个步骤
/*这个模块式专门用来爬取文件的，传递一个URL，就去捕获其相应的数据并且调用时返回这个函数值*/

//一般是下载到开发者Dev依赖关系上
const puppeteer = require('puppeteer');

function timeout() {
  return new Promise(resolve => setTimeout(resolve, 2000));
}

//暴露给外头一个函数，传递参数URL，去打开这个URL
module.exports = async (url) => {
  //1.打开浏览器（异步）
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']  //不要打开界面，在后台运行-沙盒
  });
  //2.打开一个页面
  const page = await browser.newPage();
  //3.跳转到指定网址的页面
  await page.goto(url, {
    waitUntil: 'networkidle0'  //等待网络空闲时，再访问
  });

  //延时两秒操作
  await timeout();

  //4.对页面进行操作（爬取数据-进行DOM操作-我们可以知道豆瓣使用jQuery）
  const result = await page.evaluate(() => {
    //获取片长
    const runtime = $('[property="v:runtime"]').text();
    //获取上映时间
    const releaseDate = $('[property="v:initialReleaseDate"]').text();
    //获取电影简介
    const summary = $('[property="v:summary"]').text().replace(/\s/g, '');

    //https://api.douban.com/v2/movie/coming_soon

    const $video = $('.related-pic-video');
    //判断有无视频
    if($video.length){
      //视频的封面图片????字符串有split方法吗？？
      const cover = $video.css('background-image').split('(')[1].split(')')[0].replace(/["]/g, '');
      //视频的地址(预告片网址，在这个网址中还要搜寻视频的地址)
      const link = $video.attr('href');
      //将数据返回出去
      return {
        runtime,
        releaseDate,
        summary,
        cover,
        link
      }
    }
  });
  //result如果没有预告片，也就是return undefined，result的结果就是undefined
  //result 值就是undefined {}
  if(result){
    //还要去根据link去抓取视频的mp4格式--再打开一个页面
    //3.跳转到指定网址的页面
    await page.goto(result.link, {
      waitUntil: 'networkidle0'  //等待网络空闲时，再访问
    });
    //4.对页面进行操作-用result.video新增属性
    result.video = await page.evaluate(() => {
      //我就可以对页面进行DOM操作
      //获取视频链接
      return $('.vjs-tech>source').attr('src');
    });
    //在里面不是undefined上删除无用的link
    delete result.link;
  }
  //5.关闭浏览器
  await browser.close();
  
  console.log(result);
  //将爬取的结果返回出去
  return result;
};