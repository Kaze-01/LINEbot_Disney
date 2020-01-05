// ---------------------------------------------------
// モジュールのインポート
const server = require('express')();
// Messaging APIのSDKをインポート
const line = require('@line/bot-sdk');
// Scraping
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;  // SSL証明書検証エラーを無視する設定
const cheerio = require('cheerio-httpcli');

// ---------------------------------------------------
// パラメータ設定
const line_config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// ---------------------------------------------------
// Webサーバ設定
server.listen(process.env.PORT || 3000);
// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config);

// ----------------------------------------------------
// ルーター設定
server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
  // 先行してLINE側にステータスコード200でレスポンスする
  res.sendStatus(200);

  Promise.all(req.body.events.map(handleEvent));
});
// -----------------------------------------------------
var template = require( "./template.json" );
const area = {LNo0:"トゥモローランド",LNo1:"トゥーンタウン",LNo2:"ファンタジーランド",LNo3:"クリッターカントリー",LNo4:"ウエスタンランド",LNo5:"アドベンチャーランド",LNo6:"ワールドバザール",SNo0:"ミステリアスアイランド",SNo1:"マーメイドラグーン",SNo2:"アラビアンコースト",SNo3:"ロストリバーデルタ",SNo4:"ポートディスカバリー",SNo5:"アメリカンウォーターフロント",SNo6:"メディテレーニアンハーバー"}

async function handleEvent(event){

  // この処理の対象をイベントタイプがメッセージで，かつ，テキストタイプだった場合に限定
  if (event.type == "message" && event.message.type == "text"){

      if (event.message.text.indexOf("Land") !== -1){
        // var rep = await getWaitingTime("land");
        responsemsg = {
          type: "template",
          altText: 'エリアを選んでね',
          template:template.land_area
        };

      } else if (event.message.text.indexOf("Sea") !== -1){
        // console.log(template.sea_area);

        responsemsg = {
          type: "template",
          altText: 'エリアを選んでね',
          template:template.sea_area
        };

      } else if (event.message.text.indexOf("LNo") !== -1){
        var rep = await getAreaWaitingTime("land","area_name",event.message.text);
        var repp = rep.join('\n')
        // console.log(repp)

         responsemsg = {
             type: "text",
             text: repp
          };

      } else if (event.message.text.indexOf("SNo") !== -1){
        var rep = await getAreaWaitingTime("sea","area_name",event.message.text);
        var repp = rep.join('\n')
        // console.log(repp)

         responsemsg = {
             type: "text",
             text: repp
          };

      } else if (event.message.text.indexOf("Lrank") !== -1){
        var rep = await getWaitingTime("land");
        var repp = rep.join('\n')
        // console.log(repp)

         responsemsg = {
             type: "text",
             text: repp
          };
      } else if (event.message.text.indexOf("Srank") !== -1){
        var rep = await getWaitingTime("sea");
        var repp = rep.join('\n')
        // console.log(repp)
         responsemsg = {
             type: "text",
             text: repp
          };
      } else {
        responsemsg = {
            type: "text",
            text: "待ち時間を取得するには，メニューからボタンをお選びください"
        };
      } // else-end
    } // if-end

  // console.log(responsemsg);
  return bot.replyMessage(event.replyToken, responsemsg);
};

async function getWaitingTime(name) {
  // function
  // 第1引数：Webページ取得に関するError有無
  // 第2引数：jQueryっぽいオブジェクト
  // 第3引数：requestモジュールによるWEBページ取得結果のresponseオブジェクト
  //        レスポンスヘッダ・ステータスコードを見るときに使用
  const cheerioObject = await cheerio.fetch('https://tokyodisneyresort.info/smartPhone/realtime.php', {park: name, order: "rank"});

  let lists = cheerioObject.$('div[class="attr_container"]').text();
  let replyMessage = [];

  // trim: 前後の空白（改行）を削除
  // / /g : gフラグはすべての文字列変換
  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");

  lists.forEach((list) => {
    // 存在しない場合：-1
    if (list.indexOf("更新") !== -1){
      replyMessage.push(list.trim());
    // 正規表現で文字列を指定し，チェック
    }else if (/FP|中|分|情報なし|案内/.test(list)){
      replyMessage.push(list.trim());
    } else {
      replyMessage.push(list.trim());
      // replyMessage += list;
    }
  });
     return replyMessage;
} // function
// --------------------------------------------------------------------------------
// エリアごとに表示
async function getAreaWaitingTime(name, order, index) {
  // function
  // 第1引数：Webページ取得に関するError有無
  // 第2引数：jQueryっぽいオブジェクト
  // 第3引数：requestモジュールによるWEBページ取得結果のresponseオブジェクト
  //        レスポンスヘッダ・ステータスコードを見るときに使用
  const cheerioObject = await cheerio.fetch('https://tokyodisneyresort.info/smartPhone/realtime.php', {park: name, order: order});
  let lists = cheerioObject.$('li').text();
  let replyMessage = [];

  // 次のキー指定(数値計算か悩んだ)
  var next = false;
  for(var key in area){
    if(next){
      var nextindex = key;
      break;
    }
    if(key == index){
      next = true;
    }
  }

  // trim: 前後の空白（改行）を削除
  // / /g : gフラグはすべての文字列変換
  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");
  let start = false;
  let end = false;

  lists.forEach((list) => {
    // 存在しない場合：-1
    if (list.indexOf(area[index]) !== -1){
      start = true;
    // 正規表現で文字列を指定し，チェック
    } else if (list.indexOf(area[nextindex]) !== -1){
      end = true;
    } else if (end){
      //
    } else if (start){
      if ((list !== "") && (list !=="\n")){
      replyMessage.push(list.trim());
    }
    }else {
      //
    }
  });

  if ((index == "LNo6") || (index == "SNo6")){
    replyMessage.pop();
  }

  return replyMessage;
} // function
