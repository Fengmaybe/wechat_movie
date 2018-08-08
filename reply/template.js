//设置回复消息的XML格式模板（传递过来一个options这个对象，里面有一些基本的属性，包括在reply模块中处理的）
//这个options是我们自己的一个封装的对象，将有用的信息重新组合。供回复XML模板使用。


module.exports = (options) =>{
  //6中回复信息的xml格式模板

  //设置公共的回复内容
  let replyMessage = '<xml>' +
    '<ToUserName><![CDATA[' + options.toUserName +']]></ToUserName>' +
    '<FromUserName><![CDATA[' + options.fromUserName +']]></FromUserName>' +
    '<CreateTime>'+ options.createTime +'</CreateTime>' +
    '<MsgType><![CDATA['+ options.msgType+']]></MsgType>';

  if(options.msgType === 'text'){
    replyMessage += '<Content><![CDATA[' + options.content +']]></Content>';
  }else if(options.msgType === 'image'){
    replyMessage += '<Image><MediaId><![CDATA['+ options.mediaId +']]></MediaId></Image>';
  }else if(options.msgType === 'voice'){
    replyMessage += '<Voice><MediaId><![CDATA['+ options.mediaId +']]></MediaId></Voice>';
  }else if(options.msgType === 'video'){
    replyMessage += '<Video>' +
      '<MediaId><![CDATA['+ options.mediaId +']]></MediaId>' +
      '<Title><![CDATA['+ options.title +']]></Title>' +
      '<Description><![CDATA['+ options.description +']]></Description>' +
      '</Video>';
  }else if(options.msgType === 'music'){
    replyMessage += '<Music>' +
      '<Title><![CDATA['+ options.title +']]></Title>' +
      '<Description><![CDATA['+ options.description +']]></Description>' +
      '<MusicUrl><![CDATA['+ options.musicUrl +']]></MusicUrl>' +
      '<HQMusicUrl><![CDATA['+ options.hqMusicUrl +']]></HQMusicUrl>' +
      '<ThumbMediaId><![CDATA['+ options.mediaId +']]></ThumbMediaId>' +
      '</Music>';
    //options.mediaId老师为啥用这个？？？？？？？？？？？？？？？？？？？？？？？？
  }else if(options.msgType === 'news'){
    replyMessage += '<ArticleCount>'+ options.content.length +'</ArticleCount><Articles>';

    options.content.forEach(item =>{
      replyMessage += '<item>' +
        '<Title><![CDATA[' + item.title +']]></Title>' +
        '<Description><![CDATA[' + item.description +']]></Description>' +
        '<PicUrl><![CDATA[' + item.picUrl +']]></PicUrl>' +
        '<Url><![CDATA[' + item.url +']]></Url>' +
        '</item>' ;
    });

    replyMessage += '</Articles>';

  }


    //最终这个模板是用来返回整个的XML的模板格式
    replyMessage += '</xml>';
    return replyMessage;

};

