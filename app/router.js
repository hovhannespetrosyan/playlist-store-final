'use strict';

const router = require('koa-router')();
const passport = require('./passport');
const config = require('../config/config');
const youtube = require('./youtube');
const send = require('./payment');
const koaBody = require('koa-body')();

//here we require DB's tables
const {Users, Orders, Sales, Playlists, Messages, Copies} = require('./model');

// there we define appropriate function names which will work then(routing)
router.get('/', main);
router.get('/main', main);
router.get('/login', login);
router.get('/store', store);
router.get('/my_playlists', my_playlists);
router.get('/playlist_page/:id', playlist_page);
router.get('/store_playlist_page/:id', store_playlist_page);
router.get('/bought_playlists', bought_playlists);
router.get('/account', account);
router.get('/payment', payment);
router.get('/seller_page/:seller', seller_page);
router.get('/messages', messages);
router.get('/logout', logout);

router.get('/auth/google', passport.authenticate('google', {
    scope: config.google.scope,
    accessType: config.google.accessType,
    approvalPrompt: config.google.approvalPrompt
}));
router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/account',
    failureRedirect: '/'
}));

//here are 2 managers:they help us to sell and buy...
router.post('/db_store_manager', koaBody, sell_manager);
router.post('/db_store_manager_buy', koaBody, buy_manager);
router.post('/payment_settings', koaBody, payment_settings);
router.post('/messenger', koaBody, messenger);
// there are such functions those respond to urls

//this works on page messages
async function messages(ctx) {
    if (ctx.isAuthenticated()) {
        let send_messages = [];
        const message_box = await Messages.findAll({where: {$or: [{receiver: ctx.state.user.id}, {sender: ctx.state.user.id}]}});
        smartPrinter(message_box);
        for (let i in message_box) {
            let column = [];
            let message = message_box[i].message;
            let sender_account = await Users.findOne({where: {googleID: message_box[i].sender}});
            let receiver_account = await Users.findOne({where: {googleID: message_box[i].receiver}});
            let sender_name = sender_account.displayName;
            let sender_photo = sender_account.photos;
            let sender_id = sender_account.googleID;
            smartPrinter(sender_id);
            column.push(message);
            column.push(sender_name);
            column.push(sender_photo);
            column.push(sender_id);
            column.push(message_box[i].status);
            column.push(receiver_account.photos);
            column.push(receiver_account.displayName);
            column.push(receiver_account.googleID);

            smartPrinter(message_box[i].status);
            send_messages[i] = column;

        }
        smartPrinter(message_box);
        await Messages.update({status: "read"}, {where: {receiver: ctx.state.user.id, status: "unread"}});
        await ctx.render('/messages', {userInfo: ctx.state.user, message_sender_info: send_messages});
    }
    else {
        ctx.redirect('/login');
    }

}

//this sends and saves messages on db's messages table
async function messenger(ctx) {
    let message = ctx.request.body.msg;
    let whom = ctx.request.body.whom;
    smartPrinter(whom);
    smartPrinter(message.length);
    smartPrinter(ctx.url);
    await Messages.upsert({
        sender: ctx.state.user.id,
        receiver: whom,
        message: message
    });
    ctx.response.body = {what: "ok"};

}

//this saves payment settings in Users table
async function payment_settings(ctx) {
    if (ctx.isAuthenticated()) {
        let username = ctx.request.body.username;
        let password = ctx.request.body.password;
        let userID = ctx.state.user.id;
        await Users.upsert({
            googleID: ctx.state.user.id,
            pay_username: username,
            pay_password: password
        });
        ctx.response.body = {m: "OK"};
    }
    else {
        ctx.redirect('/login');
    }
}

//shows the components of selling playlist
async function store_playlist_page(ctx) {
    if (ctx.isAuthenticated()) {
        let item_playlist = await Playlists.findOne({where: {youtubeID: ctx.params.id}});

        await ctx.render('store_playlist_page', {info: item_playlist, userInfo: ctx.state.user});
    }
    else {
        ctx.redirect('/login');
    }

}

//shows the content of playlist...there is ctx.params.id which tell us which playlist our user wants to watch
async function playlist_page(ctx) {
    if (ctx.isAuthenticated()) {
        let user = await  Users.findOne({where: {googleID: ctx.state.user.id}});
        let playlist = await Playlists.findOne({where: {id: ctx.params.id}});
        let playlist_id = playlist.youtubeID;
        let youtube_data = new youtube(config, user.accessToken, user.refreshToken);

        let playlist_items = await youtube_data.getPlaylistItems(playlist_id);
        let playlist_items_photos = '';

        for (let i = 0; i < playlist_items.items.length; i++) {
            playlist_items_photos += playlist_items.items[i].snippet.thumbnails.medium.url + ",";
        }
        await Playlists.upsert(
            {
                youtubeID: playlist_id,
                photos: playlist_items_photos
            });
        await ctx.render('playlist_page', {
            userInfo: ctx.state.user,
            videos: playlist_items
        });
    }
    else {
        ctx.redirect('/login');
    }


}

//shows authenticated user playlists from db
async function my_playlists(ctx) {
    if (ctx.isAuthenticated()) {
        let data = [];
        let playlists = await Playlists.findAll({where: {userID: ctx.state.user.id}});
        smartPrinter("----------------------------lets start---------------------------------------");
        for (let i in playlists) {
            let check_in_copies = await Copies.findOne({where: {copy_playlistID: playlists[i].youtubeID}});
            smartPrinter(check_in_copies + "\n" + playlists[i].youtubeID + "\n" + ctx.state.user.id);
            if (check_in_copies == null) {
                data.push(playlists[i]);
            }

        }
        smartPrinter('------------------------------------------------------------------------------');

        await ctx.render('my_playlists', {
            userInfo: ctx.state.user,
            data: data
        });
    }
    else {
        ctx.redirect('/login');
    }
}

//shows bought playlists
async function bought_playlists(ctx) {
    if (ctx.isAuthenticated()) {
        let orders = await Orders.findAll({where: {ownerID: ctx.state.user.id}});
        let bought_playlists = [];
        for (let i in orders) {
            let playlist = await Playlists.findOne({where: {youtubeID: orders[i].playlistID}});
            bought_playlists.push(playlist);
        }
        await ctx.render('bought_playlists', {userInfo: ctx.state.user, bought_playlists: bought_playlists});
    }
    else {
        ctx.redirect('/login');
    }
}

//shows the playlists list which are in Sales table but not mine
async function store(ctx) {
    if (ctx.isAuthenticated()) {
        let store_data = [];
        let price_data = [];
        let items_for_sell = await Sales.findAll({where: {googleID: {$ne: ctx.state.user.id}}});
        for (let i in items_for_sell) {
            let selling_item = await Playlists.findOne({where: {youtubeID: items_for_sell[i].playlistID}});
            let bought_item = await Orders.findOne({
                where: {
                    playlistID: items_for_sell[i].playlistID,
                    ownerID: ctx.state.user.id
                }
            });
            let user = await Users.findOne({where: {googleID: items_for_sell[i].googleID}});
            let array_cell = [];
            array_cell.push(selling_item);
            array_cell.push(items_for_sell[i]);
            array_cell.push(bought_item);
            array_cell.push(user);
            store_data[i] = array_cell;
            smartPrinter(user.photos);
            // store_data = [[selling_item,items_for_sell[i],bought_item],[.....]...[.....]]


        }

        await ctx.render('store', {userInfo: ctx.state.user, store_info: store_data});
    }
    else {
        ctx.redirect('/login');

    }
}

//it redirect us to seller account
async function seller_page(ctx) {
    if (ctx.isAuthenticated()) {
        let seller_id = ctx.params.seller;

        let store_data = [];
        //there we gather some useful info about seller (on whom page now we ara)
        let user = await Users.findOne({where: {googleID: seller_id}});
        let items_for_sell = await Sales.findAll({where: {googleID: seller_id}});
        let count_sellers_selling_items = items_for_sell.length;
        let count_sellers_sold_items = 0;

        // we check sold playlists count of seller
        for (let i in items_for_sell) {
            if (await Orders.findOne({where: {playlistID: items_for_sell[i].playlistID}})) {
                count_sellers_sold_items += 1;
            }
        }
        let user_details = {
            user: user,
            selling_playlists: count_sellers_selling_items,
            sold_playlists: count_sellers_sold_items
        };

        for (let i in items_for_sell) {
            let selling_item = await Playlists.findOne({where: {youtubeID: items_for_sell[i].playlistID}});
            let bought_item = await Orders.findOne({
                where: {
                    playlistID: items_for_sell[i].playlistID,
                    ownerID: ctx.state.user.id
                }
            });

            let array_cell = [];
            if (items_for_sell[i].googleID == ctx.params.seller) {
                array_cell.push(selling_item);
                array_cell.push(items_for_sell[i]);
                array_cell.push(bought_item);
                store_data[i] = array_cell;
            }

            // store_data = [[selling_item,items_for_sell[i],bought_item],[.....]...[.....]]


        }
        await ctx.render('seller_page', {store_info: store_data, userInfo: ctx.state.user, user_seller: user_details});
    }
    else {
        ctx.redirect('/login');
    }
}

async function login(ctx) {
    await ctx.render('/login', {userInfo: ctx.state.user});
}

async function logout(ctx) {
    ctx.logout();
    ctx.redirect('/login');
}

async function main(ctx) {
    await ctx.render('/main', {userInfo: ctx.state.user});
}

async function account(ctx) {
    if (ctx.isAuthenticated()) {
        let info_pay;
        let unread_messages = await Messages.findAll({where: {receiver: ctx.state.user.id, status: "unread"}});
        let count_of_unread = unread_messages.length;

        //there we save user's info
        await Users.upsert({
                googleID: ctx.state.user.id,
                accessToken: ctx.state.user.accessToken,
                refreshToken: ctx.state.user.refreshToken,
                displayName: ctx.state.user.name.givenName,
                photos: ctx.state.user.photos[0].value.split('=')[0] + "=200"
            }
        );

        //there we get user's playlists

        let user = await Users.findOne({
            where: {googleID: ctx.state.user.id}
        });
        if (user.pay_password != null && user.pay_username != null && user.pay_password != " " && user.pay_username != " ") {
            info_pay = {
                pay_password: user.pay_password,
                pay_username: user.pay_username
            };
        }

        //there we complete youtubeClient form from youtube.js for access to user's account playlists

        const youtubeClient = new youtube(config, user.accessToken, user.refreshToken);
        const playlist_data = await youtubeClient.getPlaylistData();
        console.log("WE have playlist_data:" + playlist_data);
        for (let i = 0; i < playlist_data.items.length; i++) {

            await  Playlists.upsert({
                title: playlist_data.items[i].snippet.title,
                description: playlist_data.items[i].snippet.description,
                youtubeID: playlist_data.items[i].id,
                thumbnail: playlist_data.items[i].snippet.thumbnails.medium.url,
                userID: ctx.state.user.id
            });
            const checking_thumbnail_existing = playlist_data.items[i].snippet.thumbnails.medium.url.split('/')[5].substring(0, 12);
            if (checking_thumbnail_existing == "no_thumbnail") {
                await Playlists.update({
                    thumbnail: "http://cdn.mos.cms.futurecdn.net/5a0afaa88485ccf212e9e58ca6de4bb9-320-80.jpg"
                }, {where: {youtubeID: playlist_data.items[i].id}});
            }


        }
        if (info_pay != undefined) {
            await ctx.render('account', {userInfo: ctx.state.user, pay_info: info_pay, new_msg: count_of_unread});
        }
        else {
            await ctx.render('account', {userInfo: ctx.state.user, pay_info: undefined, new_msg: count_of_unread});
        }

    }
    else {
        ctx.redirect('/login');
    }

}

//this is our smart Sell Manager
async function sell_manager(ctx) {


    let user = await Users.findOne({where: {googleID: ctx.state.user.id}});
    if(user.pay_username != null && user.pay_password != "null")
    {
        let sell_item = await Playlists.findOne({
            where: {id: ctx.request.body.item}
        });
        await Sales.upsert(
        {
            googleID: sell_item.userID,
            playlistID: sell_item.youtubeID,
            price: ctx.request.body.price
        });

        const youtubeClient = new youtube(config, user.accessToken, user.refreshToken);
        const playlist_data = await youtubeClient.getPlaylistItems(sell_item.youtubeID);
        let selling_video_urls = '';
        let selling_video_photos = '';

        smartPrinter("--->SELL Manager is gathering info about selling playlist...");

        for (let i = 0; i < playlist_data.items.length; i++) {
            selling_video_urls += playlist_data.items[i].snippet.resourceId.videoId + ",";
            selling_video_photos += playlist_data.items[i].snippet.thumbnails.medium.url + ","
        }

        smartPrinter("--->SELL Manager has gathered info and is starting upserting");

        await Playlists.upsert(
        {
            id: ctx.request.body.item,
            videos: selling_video_urls,
            photos: selling_video_photos,
            status: 'selling'
        });

        smartPrinter("--->SELL Manager has upserted");

        smartPrinter("Sell manager responds:  OK...");
        ctx.response.body = {
            item_status: 'selling'
        };
    }
    else{
        ctx.response.body = {
            move_to: 'payment'
        }

    }



}

async function buy_manager(ctx) {

    let user = await Users.findOne({where: {googleID: ctx.state.user.id}});

    if (user.pay_username != null || user.pay_password != null){
        smartPrinter("BUY MANAGER");
        ctx.response.body = {
            item_status: 'bought'
        };

        smartPrinter(user.pay_password);

        const playlist = await  Playlists.findOne({where: {id: ctx.request.body.item}});

        await Orders.upsert({
            playlistID: playlist.youtubeID,
            ownerID: ctx.state.user.id
        });


        let buyer = user.pay_username;

        let buyer_pass = user.pay_password;

        let selling_play = await    Sales.findOne({where: {playlistID: playlist.youtubeID}});

        let money = selling_play.price;

        let seller_id = selling_play.googleID;

        let seller = (await
            Users.findOne({where: {googleID: seller_id}})).pay_username;

        await send(buyer, buyer_pass, money, seller, "You have sold this playlist: " + playlist.title);


        let youtubeClient = new youtube(config, user.accessToken, user.refreshToken);
        const created_playlist = await
            youtubeClient.insertPlaylist({
                title: playlist.title,
                description: playlist.description
            });

        await Copies.upsert({playlistID: playlist.youtubeID, copy_playlistID: created_playlist});

        let new_playlist = await    youtubeClient.getPlaylistItems(created_playlist);
        let videos_array = playlist.videos.split(',');

        smartPrinter("starting uploading videos in new playlist");

        for (let i in videos_array) {
            await
                youtubeClient.insertVideo({
                    playlist_id: created_playlist,
                    playlist_title: playlist.title,
                    video_id: videos_array[i]
                });
        }

        smartPrinter("END");
    }
    else{
        ctx.response.body = {
            move_to:'payment'
        };
    }

}

async function payment(ctx) {
    if (ctx.isAuthenticated()) {
        await ctx.render('payment', {userInfo: ctx.state.user});
    }
    else {
        ctx.redirect('/login');
    }

}


function smartPrinter(item) {
    console.log('-------------------');
    console.log('-------------------');
    console.log(item);
    console.log('-------------------');
    console.log('-------------------');
}

module.exports = router;