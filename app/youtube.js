'use strict';
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

//const config =require('../config/config');
//var oauth2Client = new OAuth2(config.google.clientID,config.google.clientSecret,config.google.callbackURL);

var youtube_api_model = function YoutubeApiModel(config,accessToken,refreshToken)
{
    this.oauth2Client = new OAuth2(
        config.google.clientID,
        config.google.clientSecret,
        config.google.callbackURL
    );
    this.oauth2Client.setCredentials({
        access_token:   accessToken,
        refresh_token:  refreshToken
    });
    this.youtube = google.youtube({
        version: "v3",
        auth:this.oauth2Client
    });
    var fake_this = this;

    this.getPlaylistData = function getPlaylistData(){
        return new Promise(function (res,rej){
            fake_this.youtube.playlists.list({
                part:'snippet, contentDetails',
                mine:"true",
                maxResults : 25
            },function (err,data){
                if(err){
                    console.error('Error' + err);
                    return rej();
                }
                if(data){
                    res(data);
                }
            });
        });
    };

    this.getPlaylistItems = function getPlaylistItems(id){
        return new Promise(function (res,rej){
            fake_this.youtube.playlistItems.list({
                part:'snippet, contentDetails',
                playlistId: id,
                mine:"true",
                maxResults : 25
            },function (err,data){
                if(err){
                    console.error('Error' + err);
                    return rej();
                }
                if(data){
                    res(data);
                }
            });
        });
    };
    this.insertPlaylist=function insertPlaylist(obj){
        return new Promise(function (res,rej) {
            fake_this.youtube.playlists.insert({
                part: 'snippet,status',
                resource:{
                    snippet:obj,
                    status: {
                        privacyStatus: 'private'
                    }
                }
            },function (err,result) {
                if (err) {
                    rej();
                }
                else{
                    console.log("Playlist inserted " + result.id);
                    res(result.id);
                }
            });
        });
    };

    this.deletePlaylist=function deletePlaylist(id){
        return new Promise(function (res,rej) {
            fake_this.youtube.playlists.delete({
                id:id
            },function (err,result) {
                if (err) {
                    rej();
                }
                else{
                    res();
                    console.log("Playlist deleted "  + id)
                }
            });
        });
    };
    this.insertVideo=function insertVideo(obj){
        return new Promise(function (res,rej) {
            fake_this.youtube.playlistItems.insert({
                part: 'snippet',
                resource:{
                    snippet:{
                        playlistId:obj.playlist_id,
                        title:obj.playlist_title,
                        resourceId:{
                            kind:"youtube#video",
                            videoId:obj.video_id
                        }
                    },
                }
            },function (err,result) {
                if (err) {
                    rej();
                }
                else{
                    console.log("Video inserted " + obj.video_id);
                    res();
                }
            });
        });
    };
};

module.exports = youtube_api_model;