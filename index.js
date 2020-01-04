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

// すべてのイベント処理のプロセスを格納する配列
let events_processed = []

// イベントオブジェクトを順次処理
req.body.events.forEach(async (event) => {


// ------------------------------------------------------------
    async function getWaitingTime(name) {
      // function
      // 第1引数：Webページ取得に関するError有無
      // 第2引数：jQueryっぽいオブジェクト
      // 第3引数：requestモジュールによるWEBページ取得結果のresponseオブジェクト
      //        レスポンスヘッダ・ステータスコードを見るときに使用
      const cheerioObject = await cheerio.fetch('https://tokyodisneyresort.info/smartPhone/realtime.php', {park: name, order: "wait"});

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
        // | または
        }else if (/FP|中|分|情報なし|案内/.test(list)){
          replyMessage.push(list.trim());
        } else {
          replyMessage.push(list.trim());
          // replyMessage += list;
        }
      });
         return replyMessage;
    } // function

// -----------------------------------------------------------------------------
  // この処理の対象をイベントタイプがメッセージで，かつ，テキストタイプだった場合に限定
  if (event.type == "message" && event.message.type == "text"){

      if (event.message.text.indexOf("Land") !== -1){

        var rep = await getWaitingTime("land");
        events_processed.push(bot.replyMessage(event.replyToken, {
          type: "text",
          text: rep[0]
        }));
        // 複数リクエストは無理
        // events_processed.push(bot.replyMessage(event.replyToken, {
        //   type: "text",
        //   text: rep[1]
        // }));
        // events_processed.push(bot.replyMessage(event.replyToken, {
        //   type: "text",
        //   text: rep[2]
        // }));
        // events_processed.push(bot.replyMessage(event.replyToken, {
        //   type: "text",
        //   text: rep[3]
        // }));

      } else if (event.message.text.indexOf("Sea") !== -1){

        replyMessage = await getWaitingTime("sea");
        var rep = await getWaitingTime("sea");
        var repp = rep.join('/')
        console.log(repp)

         events_processed.push(bot.replyMessage(event.replyToken, {
             type: "text",
             text: repp
          }));
        //  console.log(rep);
        // for (var i=0; i<10; i++){
        //   if ((rep[i] !== null)&&(rep[i] !== undefined)){
        //   events_processed.push(bot.replyMessage(event.replyToken, {
        //       type: "text",
        //       text: rep[i]
        //     }));
        //   }
        // }

      } else {
        // replyMessage()で返信し、そのプロミスをevents_processedに追加。
        events_processed.push(bot.replyMessage(event.replyToken, {
            type: "text",
            text: "待ち時間を取得するには，メニューからボタンをお選びください"
        }));
      } // else-end
    } // if-end
  });

  // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
});
