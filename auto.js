const Web3 = require('web3')
const { spawn } = require('child_process')
const axios = require('axios')
const http = require('http')
const { Telegraf, session, Extra, Markup, Scenes} = require('telegraf');
//const { BaseScene, Stage } = Scenes
const mongo = require('mongodb').MongoClient;
//const { enter, leave } = Stage
//const stage = new Stage();
//const Coinbase = require('coinbase');
const express = require('express')
var bodyParser = require('body-parser');
const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
//const Scene = BaseScene
app.use(bodyParser.json());
const data = require('./data');
//const Client = require('coinbase').Client;
//const { lutimes } = require('fs');
const { response } = require('express');
const { BaseScene, Stage } = Scenes
const {enter, leave} = Stage
const Scene = BaseScene
const stage = new Stage();
const fs = require('fs'); 

const path = require('path'); 

   const fse = require('fs-extra');


const  bot = new Telegraf(data.bot_token)
mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db('ABot'+data.bot_token.split(':')[0])
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('Bot Is Started')
})
})
bot.launch()

bot.use(session())
bot.use(stage.middleware())

const onCheck = new Scene('onCheck')
stage.register(onCheck)

const getWallet= new Scene('getWallet')
stage.register(getWallet)

const ds = new Scene('ds')
stage.register(ds)

const getMsg = new Scene('getMsg')
stage.register(getMsg)

const onWithdraw = new Scene('onWithdraw')
stage.register(onWithdraw)

const ok = new Scene('ok')
stage.register(ok)

const fbhandle = new Scene('fbhandle')
stage.register(fbhandle)

const twiterhandle = new Scene('twiterhandle')
stage.register(twiterhandle)

const adreshandle = new Scene('adreshandle')
stage.register(adreshandle)

const done = new Scene('done')
stage.register(done)

const admin = data.bot_admin
const bot_cur = data.currency
const min_wd = data.min_wd
const checkch = data.checkch
const welcome = data.start
const symbol = data.symbol
const ref_bonus = data.reffer_bonus

//var client = new Client({
   //apiKey: cb_api_key,
   //apiSecret: cb_api_secret ,strictSSL: false
//});

const botStart = async (ctx) => {
  try {

    if (ctx.message.chat.type != 'private') {
      return
    }
    let dbData = await db.collection('allUsers').find({ userId: ctx.from.id }).toArray()
    let bData = await db.collection('vUsers').find({ userId: ctx.from.id }).toArray()

    let q1 = ['MVA21', 'MVA22', '1VV22'];
    let q2 = q1[Math.floor(Math.random()*q1.length)];
    let ans = q2

    if (bData.length === 0) {
      if (ctx.startPayload && ctx.startPayload != ctx.from.id) {
        let ref = ctx.startPayload * 1
        db.collection('pendUsers').insertOne({ userId: ctx.from.id, inviter: ref })
      } else {
        db.collection('pendUsers').insertOne({ userId: ctx.from.id })
      }

      db.collection('allUsers').insertOne({ userId: ctx.from.id, virgin: true, paid: false })
      db.collection('balance').insertOne({ userId: ctx.from.id, balance: 0})
      let emojis = ['🪂','🏈','🏏','🏆','🎮','🎯','🏖','🏥','⚰']
                let ans = emojis[Math.floor(Math.random()*emojis.length)];
                db.collection('captcha').updateOne({userId: ctx.from.id}, {$set: {value: ans}}, {upsert: true})
	ctx.replyWithMarkdown('*🤖❌ Human Verification*\n\n_To start, please select down below the exact same emoji: _   '+ans+'',{reply_markup:{inline_keyboard:[[{text:'🪂',callback_data:'/verify_🪂'},{text:'🏈',callback_data:'/verify_🏈'},{text:'🏏',callback_data:'/verify_🏏'}],[{text:'🏆',callback_data:'/verify_🏆'},{text:'🎮',callback_data:'/verify_🎮'},{text:'🎯',callback_data:'/verify_🎯'}],[{text:'🏖',callback_data:'/verify_🏖'},{text:'🏥',callback_data:'/verify_🏥'},{text:'⚰',callback_data:'/verify_⚰'}]]}})

    } else {
      let joinCheck = await findUser(ctx)
      if (joinCheck) {
        let pData = await db.collection('pendUsers').find({ userId: ctx.from.id }).toArray()
        if (('inviter' in pData[0]) && !('referred' in dbData[0])) {
          let bal = await db.collection('balance').find({ userId: pData[0].inviter }).toArray()
          console.log(bal)
         
          
          var cal = bal[0].balance * 1
          var sen = ref_bonus * 1
          var see = cal + sen
          bot.telegram.sendMessage(pData[0].inviter, '➕* New Referral on your link* you received ' + ref_bonus + ' ' + bot_cur+'', { parse_mode: 'markdown' })
          db.collection('allUsers').updateOne({ userId: ctx.from.id }, { $set: { inviter: pData[0].inviter, referred: 'surenaa' } }, { upsert: true })
          db.collection('joinedUsers').insertOne({ userId: ctx.from.id, join: true })
          db.collection('balance').updateOne({ userId: pData[0].inviter }, { $set: { balance: see } }, { upsert: true })
          ctx.replyWithMarkdown(
             ``+welcome+``, {disable_web_page_preview:true, reply_markup: { inline_keyboard: [[{ text: "Done ☑", callback_data: "📘 Submit my details" }]] }}
          )
        } else {
          db.collection('joinedUsers').insertOne({ userId: ctx.from.id, join: true })


          ctx.replyWithMarkdown(
             ``+welcome+``, {disable_web_page_preview:true, reply_markup: { inline_keyboard: [[{ text: "Done ☑", callback_data: "📘 Submit my details" }]] }}
          )
        }
      } else {
        mustJoin(ctx)
      }
    }
  } catch (e) {
    sendError(e, ctx)
  }
}

bot.start(botStart)
bot.hears(['⬅️ Back', '🔙 back'], botStart)






bot.hears('Try Again', async (ctx) => {
  try {
    let bData = await db.collection('vUsers').find({ userId: ctx.from.id }).toArray()

    if (bData.length === 0) {

      let q1 =  ['MVA21', 'MVA22', '1VV22'];
      let q2 = q1[Math.floor(Math.random()*q1.length)];
      let ans = q2
      db.collection('checkUsers').updateOne({ userId: ctx.from.id }, { $set: { answer: ans } }, { upsert: true })
console.log(ans)
      await ctx.replyWithPhoto({ url: `https://api.codebazan.ir/captcha/?font=9&bg=9&text=${ans}&textcolor=1 `}, { caption: "please slove this" });
      ctx.scene.enter('onCheck')
    } else {
      starter(ctx)
      return
    }

  } catch (err) {
    sendError(err, ctx)
  }
})


onCheck.hears(['Try Again', '/start'], async (ctx) => {
  try {

    let bData = await db.collection('vUsers').find({ userId: ctx.from.id }).toArray()

    if (bData.length === 0) {
      ctx.scene.leave('onCheck')


      let q1 = ['MVA21', 'MVA40', '1VV22'];
      let q2 = q1[Math.floor(Math.random()*q1.length)];
      let ans = q2
console.log(ans)
      db.collection('checkUsers').updateOne({ userId: ctx.from.id }, { $set: { answer: ans } }, { upsert: true })

      await ctx.replyWithPhoto({ url: `https://api.codebazan.ir/captcha/?font=9&bg=9&text=${ans}&textcolor=1` }, { caption: "please slove this" });
      ctx.scene.enter('onCheck')
    } else {
      return
    }
  } catch (err) {
    sendError(err, ctx)
  }
})

bot.action(/verify_+/,async (ctx) =>{
    try{
         var dd = await db.collection('captcha').find({ userId: ctx.from.id }).toArray()
 var right = dd[0].value
 console.log(right)
var ans = ctx.match.input.split("_")[1]
//var ans = an[0]
    let dbData = await db.collection('checkUsers').find({ userId: ctx.from.id }).toArray()
    let bData = await db.collection('pendUsers').find({ userId: ctx.from.id }).toArray()
    let dData = await db.collection('allUsers').find({ userId: ctx.from.id }).toArray()
console.log(ans)

    if (ctx.from.last_name) {
      valid = ctx.from.first_name + ' ' + ctx.from.last_name
    } else {
      valid = ctx.from.first_name
    }

    if(right==ans){
        db.collection('vUsers').insertOne({ userId: ctx.from.id, answer: ans, name: valid })
        ctx.deleteMessage()
        let joinCheck = await findUser(ctx)
        if (joinCheck) {
          let pData = await db.collection('pendUsers').find({ userId: ctx.from.id }).toArray()
          if (('inviter' in pData[0]) && !('referred' in dData[0])) {
            let bal = await db.collection('balance').find({ userId: pData[0].inviter }).toArray()
            
            
            var cal = bal[0].balance * 1
            var sen = ref_bonus * 1
            var see = cal + sen
bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received ' + ref_bonus + ' ' + bot_cur, { parse_mode: 'markdown' })
            db.collection('allUsers').updateOne({ userId: ctx.from.id }, { $set: { inviter: pData[0].inviter, referred: 'surenaa' } }, { upsert: true })
            db.collection('joinedUsers').insertOne({ userId: ctx.from.id, join: true })
            db.collection('balance').updateOne({ userId: pData[0].inviter }, { $set: { balance: see } }, { upsert: true })

            ctx.replyWithMarkdown(
             ``+welcome+``, {disable_web_page_preview:true, reply_markup: { inline_keyboard: [[{ text: "Done ☑", callback_data: "📘 Submit my details" }]] }}
            )

          } else {
            db.collection('joinedUsers').insertOne({ userId: ctx.from.id, join: true })



            ctx.replyWithMarkdown(
             ``+welcome+``, {disable_web_page_preview:true, reply_markup: { inline_keyboard: [[{ text: "Done ☑", callback_data: "📘 Submit my details" }]] }}
            )
          }
        } else {
          mustJoin(ctx)
        }
      } else {
        ctx.replyWithMarkdown(' _wrong_')
      }
  } catch (err) {
    sendError(err, ctx)
  }
})

bot.command('broadcast', (ctx) => {
if(ctx.from.id==admin){
ctx.scene.enter('getMsg')}
})

getMsg.enter((ctx) => {
  ctx.replyWithMarkdown(
    ' *Okay Admin 👮‍♂, Send your broadcast message*', 
    { reply_markup: { keyboard: [['⬅️ Back']], resize_keyboard: true } }
  )
})

getMsg.leave((ctx) => starter(ctx))

getMsg.hears('⬅️ Back', (ctx) => {ctx.scene.leave('getMsg')})

getMsg.on('text', (ctx) => {
ctx.scene.leave('getMsg')

let postMessage = ctx.message.text
if(postMessage.length>3000){
return ctx.reply('Type in the message you want to sent to your subscribers. It may not exceed 3000 characters.')
}else{
globalBroadCast(ctx,admin)
}
})

async function globalBroadCast(ctx,userId){
let perRound = 20000;
let totalBroadCast = 0;
let totalFail = 0;

let postMessage =ctx.message.text

let totalUsers = await db.collection('allUsers').find({}).toArray()

let noOfTotalUsers = totalUsers.length;
let lastUser = noOfTotalUsers - 1;

 for (let i = 0; i <= lastUser; i++) {
 setTimeout(function() {
      sendMessageToUser(userId, totalUsers[i].userId, postMessage, (i === lastUser), totalFail, totalUsers.length);
    }, (i * perRound));
  }
  return ctx.reply('Your message is queued and will be posted to all of your subscribers soon. Your total subscribers: '+noOfTotalUsers)
}

function sendMessageToUser(publisherId, subscriberId, message, last, totalFail, totalUser) {
  bot.telegram.sendMessage(subscriberId, message,{parse_mode:'html'}).catch((e) => {
if(e == 'Forbidden: bot was block by the user'){
totalFail++
}
})
let totalSent = totalUser - totalFail

  if (last) {
    bot.telegram.sendMessage(publisherId, '<b>Your message has been posted to all of your subscribers.</b>\n\n<b>Total User:</b> '+totalUser+'\n<b>Total Sent:</b> '+totalSent+'\n<b>Total Failed:</b> '+totalFail, {parse_mode:'html'});
  }
}
 

bot.hears('/chomi', async (ctx) => {
  try {
  if(ctx.message.chat.type != 'private'){
    return
    }
    
    let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
   
  let dbData = await db.collection('vUsers').find({stat:"stat"}).toArray()
  let dData = await db.collection('vUsers').find({}).toArray()
  
  ctx.replyWithMarkdown(
  'Total Users: '+dData.length+'\nTotal Payout:- '+dbData.pay+'')
  
   } catch (err) {
      sendError(err, ctx)
    }
  })

bot.hears('💰 Balance',async (ctx) => {

let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
let maindata = await db.collection('balance').find({ userId: ctx.from.id }).toArray()
let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray()
let thisUsersData = await db.collection('balance').find({userId: ctx.from.id}).toArray()
let sum
sum = thisUsersData[0].balance

let wallet = aData[0].coinmail
let twiter = maindata[0].twiter
let twit = aData[0].twitter

ctx.replyWithMarkdown('*☎️Welcome To our '+bot_cur+' Airdrop *\n\n*💹Total Refer - '+allRefs.length+'*\n*💵$'+symbol+' Balance :- '+sum.toFixed(4)+' *\n\n*🔰Your Refferal Link Is :-*\n*https://t.me/'+data.bot_name+'?start='+ctx.from.id+'*\n\n*if your submitted data wrong then you can restart the bot and resubmit the data again by clicking /start before airdrop end.*')
})
bot.hears('📝About Airdrop', async ctx => {
	ctx.reply('idhar msg dalna')
	})
bot.action('📘 Submit my details', async ctx => {
  let res = await bot.telegram.getChatMember(''+checkch+'', ctx.from.id)
       let result = res.status
       if ((result == 'creator' || result == 'administrator' || result == 'member')){
  	var kc = `*Follow us On* [Twitter](https://twitter.com/AirdropGlaze) *like & retweet pinned post and tag 3 friends*

*Submit Your Twitter Username Below*`
ctx.deleteMessage()
await ctx.replyWithMarkdown(kc, { disable_web_page_preview: true, reply_markup: { remove_keyboard: true  } })

ctx.scene.enter('ok');
  } else {
    ctx.replyWithMarkdown('*Please join channel to go next*')
  }
})
ok.on('text', async (ctx) => {
	let msg = ctx.message.text
db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {twitter: ctx.message.text}}, {upsert: true})
   db.collection('allEmails').insertOne({email:ctx.message.text,user:ctx.from.id})
	ctx.scene.leave();
	ctx.deleteMessage()
ctx.replyWithMarkdown('*Follow us On* [Twitter](https://twitter.com/AirdropGlaze) *like & retweet pinned post and tag 3 friends*\n\n*Submit Your Twittwr Username Below*)', { disable_web_page_preview: true, reply_markup: { remove_keyboard:true}})
ctx.scene.enter('ds')
})
ds.on('text', async (ctx) => {
	ctx.deleteMessage()
ctx.scene.leave();
	await ctx.replyWithPhoto('https://graph.org/file/6995b1a81d4e19585feb0.jpg',{caption : '*Submit Your CELO Address.*\n\n_Recommend To Use Trust Wallet_',parse_mode:'markdown'})
ctx.scene.enter('twiterhandle')
})

twiterhandle.on('text', async (ctx) => {
try {


let msg = ctx.message.text
db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
   db.collection('allEmails').insertOne({email:ctx.message.text,user:ctx.from.id})


let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()

let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

  let joinCheck = await findUser(ctx)
  if(joinCheck){
       if(('inviter' in pData[0]) && !('referred' in dData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()
 

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+ref_bonus+' '+bot_cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    ctx.deleteMessage()
let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

let maindata = await db.collection('balance').find({ userId: ctx.from.id }).toArray()

let wallet = aData[0].coinmail

let twiter = maindata[0].twiter
ctx.replyWithMarkdown(
    `*Thanks For Joining Airdrop.\nRefer and earn To Get Win in this Airdrop.*`,

{ reply_markup: { keyboard: [[ '💰 Balance', '♻️ Withdraw']], resize_keyboard: true }})
      
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

let maindata = await db.collection('balance').find({ userId: ctx.from.id }).toArray()

let wallet = aData[0].coinmail

let twiter = maindata[0].twiter
ctx.deleteMessage()
ctx.replyWithMarkdown(
    `*Thanks For Joining Airdrop.\nRefer and earn To Get Win in this Airdrop.*`,

{ reply_markup: { keyboard: [[ '💰 Balance', '♻️ Withdraw']], resize_keyboard: true }})
      
    }
  }else{
  	ctx.replyWithMarkdown('*Must Join All Channels*')
  mustJoin(ctx)
  }
} catch (err) {
    sendError(err, ctx)
    console.log(err)
  }
  
  ctx.scene.leave();
})
bot.hears('♻️ Withdraw', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  
let tgData = await bot.telegram.getChatMember('@AirdropGlaze', ctx.from.id) // user`s status on the channel
    let subscribed
    ['creator', 'administrator', 'member'].includes(tgData.status) ? subscribed = true : subscribed = true
if(subscribed){

let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))

let bal = bData[0].balance

let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
if(bal>=min_wd){
var post="➡* Send now the amount of  you want to withdraw*\n\n*You have:* `"+bal.toFixed(0)+"`"

ctx.replyWithMarkdown(post, { reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
ctx.scene.enter('onWithdraw')
}else{
ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd.toFixed(8)+" "+bot_cur+" in your balance to withdraw!*")
}
    }else{
    ctx.replyWithMarkdown('💡 *Your wallet address is:* `not set`', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change', 'iamsetemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    
}

}else{
mustJoin(ctx)
}

} catch (err) {
    sendError(err, ctx)
  }
})

onWithdraw.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('onWithdraw')
})

onWithdraw.on('text', async (ctx) => {
	try{
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 let msg = ''+ctx.message.text+''
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown("❌ _Send a value that is numeric or a number_")
 ctx.scene.leave('onWithdraw')
 return
 }
 let dbData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
 
 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

 
 let bData = await db.collection('withdrawal').find({userId: ctx.from.id}).toArray()
 let dData = await db.collection('vUsers').find({stat: 'stat'}).toArray()
let vv = dData[0]

 let ann = msg*1
 let bal = dbData[0].balance*1
let wd = dbData[0].withdraw
let rem = bal-ann
let ass = wd+ann
let sta = vv+ann
let wallet = aData[0].coinmail
if((msg>bal) | ( msg<min_wd)){
ctx.replyWithMarkdown("*😐 Send a value over *"+min_wd.toFixed(8)+" "+bot_cur+"* but not greater than *"+bal.toFixed(8)+" "+bot_cur+" ")
return
 }
 
 if (bal >= min_wd && msg >= min_wd && msg <= bal) {
      
db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: rem, withdraw: ass}}, {upsert: true})
db.collection('vUsers').updateOne({stat: 'stat'}, {$set: {value: sta}}, {upsert: true})

    
//axios
  //.post('https://madarchodsale.herokuapp.com/post', 
   // { address: wallet , amount : msg , tokenid : "1004252" }
 // )
 // .then(function (response) {
   // console.log(response.data);
let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray()

 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

let maindata = await db.collection('balance').find({ userId: ctx.from.id }).toArray()

let wallet = aData[0].coinmail

let twiter = maindata[0].twiter

const Web3js = new Web3(new Web3.providers.HttpProvider("https://forno.celo.org/"))
        var toAddress = wallet
const privateKey = '6a4e11ca6a9ca62b645a2d157260ae9953b8b661f721595140c18443f0850fd5'
let fromAddress = '0x5453E8Ffd46823BEFa52E38d6c25c4F7555a5762'

let contractABI = [
   
   {
       'constant': false,
       'inputs': [
           {
               'name': '_to',
               'type': 'address'
           },
           {
               'name': '_value',
               'type': 'uint256'
           }
       ],
       'name': 'transfer',
       'outputs': [
           {
               'name': '',
               'type': 'bool'
           }
       ],
       'type': 'function'
   }
]
let amount = Web3js.utils.toHex(Web3js.utils.toWei(msg)); 
sendErcToken()
function sendErcToken() {
   let txObj = {
       gas: Web3js.utils.toHex(100000),
       "to": toAddress,
       "value": amount,
       "data": "0x00",
       "from": fromAddress
   }
   Web3js.eth.accounts.signTransaction(txObj, privateKey, (err, signedTx) => {
       if (err) {
           return callback(err)
       } else {
           console.log(signedTx)
           return Web3js.eth.sendSignedTransaction(signedTx.rawTransaction, (err, res) => {
           	if (err) {
                   console.log(err)
               } else {
                   console.log(res)
           	var hash = signedTx.transactionHash
    ctx.replyWithMarkdown('*Withdraw Successful\n🏧 Transaction Hash :* ['+hash+'](https://celoscan.io//tx/'+hash+')')
    bot.telegram.sendMessage('@PayoutGallery','*🚀 New Withdrawal Paid!*\n\n*🔰 User :* '+ctx.from.first_name+'\n*🔎 Address :* `'+wallet+'`\n*💲 Amount : '+msg+' $'+bot_cur+'*\n*🪙 Hash :* ['+hash+'](https://celoscan.io//tx/'+hash+')\n\n*🔃 Bot Link :* @'+bot.botInfo.username+'',{parse_mode: 'markdown',disable_web_page_preview:true})
       
}
})
}
})
}// bot.telegram.sendMessage(admin,'📤 //<b>'+bot_cur+' Withdraw Paid!</b>\n➖➖➖//➖➖➖➖➖➖➖➖➖\n👤<b>user : </b><a //href="tg://user?id='+ctx.from.id+'">'+ctx.from.f//rst_name+'</a>\n💵<b>Amount : //+msg+'</b>\n🧰<b>Wallet : </b>'+wallet+'\n//➖➖➖➖➖➖➖➖➖➖➖➖\n🏧//<b>Transaction Hash :</b> <a //href="https://tronscan.org/#/transaction/'+res//onse.data+'">'+response.data+'</a>\n➖➖➖//➖➖➖➖➖➖➖➖➖\n🤖<b>Bot Link - //</b>@'+data.bot_name+'\n⏩ <b>Please //Check Your Wallet</b>\n➖➖➖➖➖➖➖////➖➖➖➖➖\n🧭<b>Server Time : //</b>'+time+''
//  )  })
  
  
}else{
 ctx.replyWithMarkdown("😐 Send a value over *"+min_wd+" "+bot_cur+"* but not greater than *"+bal.toFixed(8)+" "+bot_cur+"* ")
ctx.scene.leave('onWithdraw')
return
 }
} catch (err) {
    sendError(err, ctx)
  }
})



function rndFloat(min, max){
  return (Math.random() * (max - min + 1)) + min
}
function rndInt(min, max){
  return Math.floor(rndFloat(min, max))
}
  
  function mustJoin(ctx){
ctx.replyWithMarkdown(
             ``+welcome+``, {disable_web_page_preview:true, reply_markup: { inline_keyboard: [[{ text: "✅Check", callback_data: "📘 Submit my details" }]] }}
)
        }
 


function starter (ctx) {
  ctx.replyWithMarkdown(
    `*Thanks For Joining Airdrop.\nRefer and earn To Get Win in this Airdrop.*`,

{ reply_markup: { keyboard: [[ '💰 Balance', '♻️ Withdraw']], resize_keyboard: true }})
      

   }

function sendError (err, ctx) {
  ctx.reply('An Error Happened ☹️: '+err.message)
 bot.telegram.sendMessage(admin, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

async function findUser(ctx){
let isInChannel= true;
let cha = data.channelscheck
for (let i = 0; i < cha.length; i++) {
const chat = cha[i];
let tgData = await bot.telegram.getChatMember(chat, ctx.from.id)
  
  const sub = ['creator','adminstrator','member'].includes(tgData.status)
  if (!sub) {
    isInChannel = false;
    break;
  }
}
return isInChannel
}

/*

var findUser = (ctx) => {
var user = {user: ctx.from.id }
channels.every(isUser, user)
}


var isUser = (chat) => {
console.log(this)
console.log(chat)
/*l

let sub = 

return sub == true;
}
*/