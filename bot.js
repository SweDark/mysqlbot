const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const mysql = require("mysql");

logger.remove(logger.transports.console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

const client = new Discord.Client({
  token: auth.token,
  autorun: true
});

client.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(client.user.tag + ' - (' + client.user.id + ')');
});

var UserHandler = (function(){

  function createStatsEmbed(color, title, url, authorName, iconUrl, authorUrl, description, thumbnailUrl, footerText, footerIconUrl){
     /*var Embed = {
      color: 0x007fff,
      title: ' > Servers',
      url: 'https://discord.js.org',
      author: {
        name: 'SweDark',
        icon_url: 'https://i.imgur.com/rwEF8Tt.png',
        url: 'https://discord.js.org',
      },
      description: '__Connected bot servers__',
      thumbnail: {
        url: 'https://i.imgur.com/rwEF8Tt.png',
      },
      timestamp: new Date(),
      footer: {
        text: '> Servers <',
        icon_url: 'https://i.imgur.com/rwEF8Tt.png',
      },
    };*/
    var Embed = {
      color: color,
      title: title,
      url: url,
      author: {
        name: authorName,
        icon_url: iconUrl,
        url: authorUrl,
      },
      description: description,
      thumbnail: {
        url: thumbnailUrl,
      },
      footer: {
        text: footerText,
        icon_url: footerIconUrl,
      },
    };
    //message.channel.send("test");
    return Embed;
  }
  function addNewField(embed, name, value, inline){
    var newembed = new Discord.MessageEmbed(embed).addField(name, value, inline);
    return newembed;
  }
  
  function addImageToDb(imagelink, message){
    let sql = `INSERT INTO images (imageLink, serverId) VALUES ('${imagelink}', '${message.guild.id}')`
    con.query(sql);
    message.reply("Image link has been added to the database!");
  }
  return{
    createStatsEmbed,
    addImageToDb,
    addNewField
  }
})();

con.connect(err => {
  if(err) throw err;
  console.log("Connected to database!");
  });

  function randomNumber(maxvalue){
    return Math.floor(Math.random() * maxvalue + 1);
  }
 
client.on('message', message => {
  let array = message.content.split(" ");
  con.query(`SELECT * FROM server WHERE id = '${message.guild.id}'`, (err, rows) => {
    if(err) throw err;
    let sql;

    //checks if the server already has entered the database
    if(rows.length < 1){
      //About to check if this one can be sent when it joins a server.
      var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      //if the server doesn't exist in the database, insert it into the database.
      sql = `INSERT INTO server (id, isactive, joined, allowAnnouncement) VALUES ('${message.guild.id}', ${'1'}, '${date}', ${'1'})`
      con.query(sql);
    }
    //checks if the date is null or not (probably best to delete it later)
    if(rows[0].joined == null){
      var date = new Date().toISOString().slice(0, 19).replace('T', ' '); 
      sql = `UPDATE server SET joined = '${date}' WHERE id = '${rows[0].id}'`
      con.query(sql);
    }
    var name = message.guild.name;
    var result = name.replace(/"/g, `'`);
    //name.replace('"', "'");
    //checks if the server name is the same as the saved servername, if not - then update 
    if(rows[0].name != result){
      sql = `UPDATE server SET name = "${result}"  WHERE id = '${rows[0].id}'`
      con.query(sql); 
    }
    //If you have removed the bot before and then gotten it again, then it needs to change isactive to 1.
    if(rows[0].isactive == 0){
      sql = `UPDATE server SET isActive = "${1}" WHERE id = '${rows[0].id}'`
      con.query(sql);
    }
  });

  // console.log below gives the member (user) count.
  //console.log(message.guild.members.cache.filter(member => !member.user.bot).size); 
  switch (array[0].toLowerCase()) {
    case ".checkservers":
      con.query(`SELECT * FROM server`, (err, rows) => {
        if(err) throw err;

        var newembed = UserHandler.createStatsEmbed(0x007fff, "> Servers", 'https://discord.js.org', "SweDark", 'https://i.imgur.com/rwEF8Tt.png', 'https://discord.js.org',
        "__Connected bot servers__:", 'https://i.imgur.com/rwEF8Tt.png', "> Servers <", 'https://i.imgur.com/rwEF8Tt.png');
        //var newembed = UserHandler.createStatsEmbed(message);
        for(let i = 0; i < rows.length; i++){
          var name = "`server id: " + rows[i].id + "`";
          var value = "Server name: __" + rows[i].name + "__\n" + "Join date: " + rows[i].joined.toISOString().slice(0, 19).replace('T', ' ') + "\n";
          if(rows[i].isactive == 1){
            value += "bot: Active";
          } else {
            value += "bot: Inactive";
          }
          newembed = UserHandler.addNewField(newembed, name, value, false);
        } 
      message.channel.send({embed: newembed});
      });
      break;

      case ".checkserver":
        con.query(`SELECT * FROM server WHERE id = '${message.guild.id}'`, (err, rows) => {
          if(err) throw err;
  
          var newembed = UserHandler.createStatsEmbed(0x007fff, `> ${message.guild.name}`, 'https://discord.js.org', "SweDark", 'https://i.imgur.com/rwEF8Tt.png', 'https://discord.js.org',
          '', 'https://i.imgur.com/rwEF8Tt.png', "> Server <", 'https://i.imgur.com/rwEF8Tt.png');
          //var newembed = UserHandler.createStatsEmbed(message);
          var name = '\u200b';
          var value = "`Server name:` " + message.guild.name +
          "\n\n`Server-id:` " + rows[0].id +
          "\n\n`Bot joined:` " + rows[0].joined.toISOString().slice(0, 19).replace('T', ' ') + 
          "\n\n`Announcements:` ";
          if(rows[0].allowAnnouncement == 1){
            value += "Allowed";
          } else{
            value += "Denied";
          }
          if(rows[0].aChannelId != undefined && rows[0].allowAnnouncement == 1){
            var channelName = message.guild.channels.cache.find(channel => channel.id == rows[0].aChannelId).name;
            value += "\n\n`Announcement channel:` " + channelName;
          } else if(rows[0].aChannelId == undefined && rows[0].allowAnnouncement == 1){
            value += "\n\n`Announcment channel:` No channel specified"
          }
          newembed = UserHandler.addNewField(newembed, name, value, false);
          message.channel.send({embed: newembed});
        });
        break;
      
    case ".allowannouncement":
      con.query(`SELECT allowAnnouncement FROM server WHERE Id = '${message.guild.id}'`, (err, rows) => {
        if(err) throw err;
        var sql;

        console.log(rows);
        console.log("still in here?");
        if(rows[0].allowAnnouncement != true){
          console.log("this is allowAnnouncement value: " + rows[0].allowAnnouncement);
          sql = `UPDATE server SET allowAnnouncement = '${1}' WHERE Id = '${message.guild.id}'`
          con.query(sql);
          message.reply("\nYour server is set to allow announcements!\n Don't forget to use `.setac <channel.id>` to set where the announcements will appear, else they'll be sent to the systemchannel.");
        } else {
          
          message.channel.send("\nServer already allow announcements!\n Use `.setac <channel.id>` to choose where announcements will appear! ");
        }
      });
      break;

    case ".setac":
      var channelId = array.slice(1).join(" ");
      var channel = message.guild.channels.cache.get(channelId);
      if(channel != undefined){
        var sql = `UPDATE server SET aChannelId = '${channel.id}' WHERE Id = '${message.guild.id}'`
        con.query(sql);
        console.log("channel id set to: " + channel.id);
        message.reply("\nannouncements has been set to appear in " + channel.name + "!");
      } else {
        message.reply("\nChannel not found, did you get the id from the channel?");
      }

      break;
    case ".announcement":
      con.query(`SELECT Id, allowAnnouncement, aChannelId FROM server WHERE allowAnnouncement = '1'`, (err, rows) => {
        for(let i = 0; i < rows.length; i++){
         // if(rows[i].allowAnnouncement == 1){
            var server = client.guilds.cache.get(rows[i].Id);
            var channel = server.channels.cache.find(channel => channel.id == rows[i].aChannelId);
            var mEveryone = server.roles.cache.find(role => role.name === "@everyone").toString();

            if(channel != undefined){
              channel.send(mEveryone + "\ntest if sent to correct channel!");
            } else {
              server.systemChannel.send(mEveryone + "\ntest if sent to correct channel!");
            }
          //}
          
        }
      });
      break;

    case ".outputemoji":
      //creates variables for serverid of the emoji and puts the emoji-name in a variable too
      var serverId = array.slice(1, 2).join(" ");
      var emojiName = array.slice(2).join(" ");
      
      //attempts to get the server from its id.
      var server = client.guilds.cache.get(serverId);
      if(server != undefined){
        var emojiByName = server.emojis.cache.find(emoji => emoji.name.toLowerCase() == emojiName.toLowerCase()).toString();
        if(emojiByName != undefined){
          var emojiId = server.emojis.cache.find(emoji => emoji.name.toLowerCase() == emojiName.toLowerCase()).id;
          //needs to add emojiname to database, else we won't be able to check if the emoji has changed name or not.
          con.query(`SELECT * FROM emojiTop WHERE serverId = '${serverId}' AND emojiId = '${emojiId}'`, (err, rows) => {
            if(err) throw err;
            let sql;
            if(rows.length <1){
              sql = `INSERT INTO emojiTop (serverId, emojiId, usedCount) VALUES ('${serverId}', '${emojiId}', ${'1'})`
              con.query(sql);
            } else {
              var newCount = rows[0].usedCount + 1;
              sql = `UPDATE emojiTop SET usedCount = '${newCount}' WHERE serverId = '${serverId}' AND emojiId = '${emojiId}'`
              con.query(sql);
            }
          });
          message.channel.send(emojiByName);
        } else {
        }

      } else {
        message.reply("The server with the emoji doesn't have the bot anymore")
      }

      break;

    case ".checkemojis":
      var serverId = array.slice(1).join(" ");
      server = client.guilds.cache.get(serverId);
      var newembed = UserHandler.createStatsEmbed(0x007fff, server.name, 'https://discord.js.org', 'SweDark', 'https://i.imgur.com/rwEF8Tt.png', 'https://discord.js.org',
      '__' + server.name + "'s emojis__:", 'https://i.imgur.com/rwEF8Tt.png', '> emojis @ ' + server.name + ' <', 'https://i.imgur.com/rwEF8Tt.png');
      var fieldName = "emojis";
      var fieldValue = "";
      var count = 0;
      console.log(server.emojis.cache.forEach(emoji => console.log(emoji.name)));
      server.emojis.cache.forEach(emoji => {
        count++;
        fieldValue += (emoji.name + ": " + emoji.toString() + "    | ");
        if(count % 3 === 0){
          fieldValue += "\n";
        } else if(count == 25){
          newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, false);
          count = 0;
        }
        
      } );
      if(count != 0){
        newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, true);
      }
      message.channel.send({embed: newembed});
      break;

    case ".emojitop":
      var newembed = UserHandler.createStatsEmbed(0x007fff, "> Top Emojis", 'https://discord.js.org', 'SweDark', 'https://i.imgur.com/rwEF8Tt.png', 'https://discord.js.org',
      '', 'https://i.imgur.com/rwEF8Tt.png', '> Top emojis<', 'https://i.imgur.com/rwEF8Tt.png');
      var fieldName = '\u200b';
      var fieldValue = "`Top Emojis used: `\n";
      con.query(`SELECT * FROM emojiTop ORDER BY usedCount DESC LIMIT 10 `, (err, rows) => {
        for(let i = 0; i < rows.length; i++){

          var server = client.guilds.cache.get(rows[i].serverId);
          var emoji = server.emojis.cache.find(emoji => emoji.id == rows[i].emojiId).toString();

          fieldValue += ("`" + (i + 1) +".` " + "Server-id: " + server + " | Emoji: " + emoji + " | Count: " + rows[i].usedCount + "\n");
        }
        newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, false);
        message.channel.send({embed: newembed});
      });
      //newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, false);

      //message.channel.send({embed: newembed});
      break;

    case ".randomimage":
      con.query(`SELECT * FROM images`, (err, rows) =>{
        if(err) throw err;
        var maxvalue = (rows.length - 1);
        var imagenumber = randomNumber(maxvalue);
        console.log(imagenumber);
        var newimagelink = rows[imagenumber].imageLink;
        var embedimg = {
          color: 0xDA70D6,
          title: 'random image',
          url: newimagelink,
          image: {
            url: newimagelink,
          }
        } 
        message.channel.send({embed: embedimg});
      });
      break;

    case ".addimage":
      if (message.member.hasPermission("ADMINISTRATOR")) {
        //var Attachmentt = message.attachments.map.info();
        
        var imagelink = array.slice(1).join(" ");

        if (!imagelink.length <= 4000) {
          try {new URL(imagelink);
          } catch (_){
            return false;
          }
          
          if(imagelink.match(/\.(jpeg|jpg|gif|png)$/) != null){
            if(message.embeds[0] == undefined){
              message.reply("Picture not found");
            } else {
              UserHandler.addImageToDb(message.embeds[0].url, message);
            }  
          }  
        }
      } else {
        message.reply("You don't have access to this function!");
        }
      break;

      case ".test":
        var newembed = UserHandler.createStatsEmbed(0x007fff, "> Example", 'https://discord.js.org', 'SweDark', 'https://i.imgur.com/rwEF8Tt.png', 'https://discord.js.org',
        '', 'https://i.imgur.com/rwEF8Tt.png', '> test<', 'https://i.imgur.com/rwEF8Tt.png');
        var fieldName = '\u200b';
        var fieldValue = '`The Great test`\nThe Great test The Great test The Great test The Great test The';
        newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, false);
        newembed = UserHandler.addNewField(newembed, fieldName, fieldValue, false);
        console.log(newembed);
        message.channel.send({embed: newembed});
      break;
  }

});

client.on("guildCreate", guild => {

    con.query(`SELECT * FROM server WHERE id = '${guild.id}'`, (err, rows) => {
    if(err) throw err;
    let sql;
    //checks if the server already has entered the database
    var name = guild.name;
    var result = name.replace(/"/g, `'`);
    if(rows.length < 1){
      var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      //if the server doesn't exist in the database, insert it into the database.
      sql = `INSERT INTO server (id, isactive, name, joined, allowAnnouncement) VALUES ('${guild.id}', ${'1'}, '${result}' , '${date}', ${'1'})`
      con.query(sql);
    } else {
      if(rows[0].name != result){
        sql = `UPDATE server SET name = "${result}"  WHERE id = '${guild.id}'`
        con.query(sql); 
      }
      //If you have removed the bot before and then gotten it again, then it needs to change isactive to 1.
      if(rows[0].isactive == 0){
        sql = `UPDATE server SET isActive = "${1}" WHERE id = '${guild.id}'`
        con.query(sql);
      }
    }
    
    //checks if the server name is the same as the saved servername, if not - then update 
   
  });
  guild.systemChannel.send("Thanks for inviting me!");
});

client.on("guildDelete", guild => {
  console.log(guild);
  con.query(`UPDATE server SET isActive = "${0}" WHERE id = '${guild.id}'`);
  //server.systemChannel.send(mEveryone + "\ntest if sent to correct channel!");
});

client.login(auth.token);
//everytime you change the bot, use node bot.js in command in the folder of the bot.