/*
 * File: socket.controller.js
 * Functions : Chat application
 * Operations :
 *     - User online
 *     - User Offline
 */

/* eslint-disable max-len */
// load models
const userModel = require("./../models/chat_user.model");
const ConversationModel = require("./../models/conversation.model");
const MessageModel = require("./../models/message.model");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectID;

const socketController = {
  login: async (_data, socketList) => {
    // save data in db
    const rows = await userModel
      .find({ userId: _data.userId })
      .catch((error) => {
        console.log(error);
      });
    if (rows.length > 0) {
      // already extis update status
      const socketIdList = [];
      for (let y = 0; y < rows[0].socketId.length; y++) {
        const element = rows[0].socketId[y];
        if (socketList[element] != undefined) {
          socketIdList.push(element);
        }
      }

      rows[0].status = "online";
      rows[0].profile_pic = _data.profile_pic;

      rows[0].socketId = [...socketIdList, _data.socketId];
      rows[0].save();
      return rows[0]._id;
    } else {
      _data.status = "online";
      _data.socketId = _data.socketId;
      const user = userModel(_data);
      user.save();
      return user._id;
    }
  },
  getOnlineUser: async () => {
    // find
    const userList = await userModel.aggregate([
      { $match: { status: "online" } },
    ]);
    return userList;
  },
  makeUserOffline: async (userId) => {
    const user = await userModel.find({ _id: userId });
    if (user.length > 0) {
      user[0].status = "offline";
      user[0].socketId = [];
      user[0].save();
      return user;
    }
    return [];
  },
  save_message: function (obj) {
    if (obj.conversation_type == 0) {
      // personal
      return ConversationModel.find({
        conversation_type: obj.conversation_type,
        members: {
          $all: [obj.senderId, obj.authorId],
        },
      })
        .then((result) => {
          let conversationId = 0;
          if (result.length == 0) {
            // create convertion
            const conversationModelObj = new ConversationModel();
            conversationModelObj.members = [obj.senderId, obj.authorId];
            conversationModelObj.conversation_type = 0;
            conversationModelObj.userId = obj.authorId;
            conversationModelObj.save();
            conversationId = conversationModelObj._id;
          } else {
            conversationId = result[0]._id;
          }
          // save message
          const messageModelObj = new MessageModel();
          messageModelObj.conversationId = conversationId;
          messageModelObj.author_id = ObjectId(obj.authorId);
          messageModelObj.message_type = obj.message_type;
          messageModelObj.message_body = obj.message_body;
          messageModelObj.message_deleted = false;
          messageModelObj.message_seen = {
            [obj.authorId]: true,
            [obj.senderId]: false,
          };
          messageModelObj.save();
          return messageModelObj._id;
        })
        .catch((err) => {
          console.log(err);
        });
    }
  },
  get_old_message: function (userId, senderId, limit) {
    return ConversationModel.find({
      conversation_type: 0,
      members: {
        $all: [userId, senderId],
      },
    })
      .then(async (result) => {
        // update message all read
        await MessageModel.updateMany(
          { conversationId: result[0]._id, ["message_seen." + userId]: false },
          { ["message_seen." + userId]: true }
        );
        if (result.length > 0) {
          const messages = await MessageModel.aggregate([
            {
              $match: {
                conversationId: ObjectId(result[0]._id),
              },
            },
            {
              $lookup: {
                from: "user_chats",
                localField: "author_id",
                foreignField: "_id",
                as: "userData",
              },
            },
            {
              $project: {
                message_type: 1,
                message_body: 1,
                conversationId: 1,
                author_id: 1,
                createdAt: 1,
                userData: {
                  userName: 1,
                  profile_pic: 1,
                  status: 1,
                  _id: 1,
                },
              },
            },
          ]);
          const responce = [];
          for (let z = 0; z < messages.length; z++) {
            const message = {};

            message.message_type = messages[z].message_type;
            message.message_body = messages[z].message_body;
            if (messages[z].author_id == userId) {
              message.isSend = true;
            } else {
              message.isSend = false;
            }
            message.author_id = messages[z].author_id;
            message.time = moment(messages[z].createdAt);
            message.date = moment(messages[z].createdAt);

            if (messages[z].userData && messages[z].userData.length > 0) {
              message.user = messages[z].userData[0];
              message.status = messages[z].userData[0].status;
            }
            responce.push(message);
          }
          return responce;
        }
        return [];
      })
      .catch(function (err) {
        console.log(err);
      });
  },
  getPersonalConversation: function (userId) {
    return ConversationModel.aggregate([
      {
        $match: {
          conversation_type: 0,
          members: userId + "",
        },
      },
      {
        $sort: { updatedAt: 1 },
      },
    ])
      .then(async (result) => {
        // fetch message count
        const responce = [];
        for (let z = 0; z < result.length; z++) {
          let findId = "";
          if (result[z].members[0] != userId + "") {
            findId = result[z].members[0];
          } else {
            findId = result[z].members[1];
          }
          const userData = await userModel.find({ _id: findId });

          if (userData.length == 0) continue;
          const messageCount = await MessageModel.count({
            ["message_seen." + userId]: false,
            conversationId: result[z]._id,
          });
          const obj = {
            _id: userData[0]._id,
            userId: userData[0].userId,
            userName: userData[0].userName,
            status: userData[0].status,
            profile_pic: userData[0].profile_pic,
            socketId: userData[0].socketId,
            messageCount: messageCount,
          };
          responce.push(obj);
        }
        return responce;
      })
      .catch(function (err) {
        console.log(err);
      });
  },
  personalMessageAck: function (messageId, userId) {
    return MessageModel.updateMany(
      { _id: messageId },
      { ["message_seen." + userId]: true }
    );
  },
  flushUser: async function () {
    // rmeove all socketid from user and make them status offline
    await userModel.updateMany(
      { status: "online" },
      { socketId: [], status: "offline" }
    );
  },
  fetchPeople: async function (name, userId, edit, groupId) {
    let resp;
    if (edit) {
      const editUser = await ConversationModel.findById(groupId);
      const editUserList = [];
      if (editUser.members.length > 0) {
        await editUser.members.forEach((element) => {
          editUserList.push(element._id);
        });
      }
      resp = await userModel.find(
        {
          userName: { $regex: ".*" + name + ".*" },
          _id: { $nin: editUserList },
        },
        { _id: 1, userName: 1 }
      );
    } else {
      resp = await userModel.find(
        { userName: { $regex: ".*" + name + ".*" }, _id: { $ne: userId } },
        { _id: 1, userName: 1 }
      );
    }
    return resp;
  },
  createGroup: async function (name, listOfPeople, authorId, createrName) {
    // create group
    const conversationModelObj = new ConversationModel();
    conversationModelObj.members = listOfPeople;
    conversationModelObj.name = name;
    conversationModelObj.conversation_type = 1;
    conversationModelObj.userId = authorId;
    await conversationModelObj.save();
    conversationId = conversationModelObj._id;
    // Group Created Message
    const messageModelObj = new MessageModel();
    messageModelObj.conversationId = conversationId;
    messageModelObj.author_id = ObjectId(authorId);
    messageModelObj.message_type = "6";
    // eslint-disable-next-line camelcase
    const messageBody = name + " Created by " + createrName;
    messageModelObj.message_body = messageBody;
    messageModelObj.message_deleted = false;
    const messageSeen = {};

    for (let y = 0; y < listOfPeople.length; y++) {
      messageSeen[listOfPeople[y]._id] = false;
    }
    messageSeen[authorId] = true;
    messageModelObj.message_seen = messageSeen;
    messageModelObj.save();

    return {
      groupId: conversationId,
      messageData: {
        message_id: messageModelObj._id,
        message_type: "6",
        message_body: messageBody,
        authorId: authorId,
      },
    };
  },
  getGroupConversation: function (userId) {
    return ConversationModel.aggregate([
      {
        $match: {
          conversation_type: 1,
          members: {
            $elemMatch: { _id: userId + "" },
          },
        },
      },
      {
        $sort: { updatedAt: 1 },
      },
    ])
      .then(async (result) => {
        // fetch message count
        const responce = [];
        for (let z = 0; z < result.length; z++) {
          let isOwn = false;
          for (let u = 0; u < result[z].members.length; u++) {
            const element = result[z].members[u];
            if (element.role == "admin" && element._id == userId) isOwn = true;
          }
          const obj = {
            _id: result[z]._id,
            userName: result[z].name ? result[z].name : "group ",
            profile_pic: "",
            isOwn,
            type: 1,
          };
          responce.push(obj);
        }
        return responce;
      })
      .catch(function (err) {
        console.log(err);
      });
  },
  saveGroupMessage: function (data) {
    // save message in group
    // fetch group
    return ConversationModel.find({
      _id: data.conversationId,
    }).then(function (result) {
      // result success
      if (result.length > 0) {
        // save message
        const messageModelObj = new MessageModel();
        messageModelObj.conversationId = data.conversationId;
        messageModelObj.author_id = ObjectId(data.authorId);
        messageModelObj.message_type = data.message_type;
        messageModelObj.message_body = data.message_body;
        messageModelObj.message_deleted = false;
        const messageSeen = {};

        for (let y = 0; y < result[0].members.length; y++) {
          messageSeen[result[0].members[y]] = false;
        }
        messageSeen[data.authorId] = true;
        messageModelObj.message_seen = messageSeen;
        messageModelObj.save();
        return messageModelObj._id;
      }
    });
  },
  get_group_old_message: function (id, userId, skip) {
    return ConversationModel.find({
      conversation_type: 1,
      _id: id,
    })
      .then(async (result) => {
        // update message all read
        await MessageModel.updateMany(
          { conversationId: result[0]._id, ["message_seen." + userId]: false },
          { ["message_seen." + userId]: true }
        );
        if (result.length > 0) {
          const messages = await MessageModel.find({
            conversationId: result[0]._id,
          })
            .limit(500)
            .skip(0);
          const responce = [];
          for (let z = 0; z < messages.length; z++) {
            const message = {};

            message.message_type = messages[z].message_type;
            message.message_body = messages[z].message_body;
            if (messages[z].author_id == userId) {
              message.isSend = true;
            } else {
              message.isSend = false;
            }
            message.author_id = messages[z].author_id;
            message.chatType = 1;
            message.user = await userModel.findById(message.author_id);
            message.time = messages[z].createdAt;
            message.date = messages[z].createdAt;
            responce.push(message);
          }
          return responce;
        }
        return [];
      })
      .catch(function (err) {
        console.log(err);
      });
  },
  getGroupMember: async function (groupId, logUserId) {
    // return all member with role
    const group = await ConversationModel.find({
      _id: groupId,
    });
    const members = [];
    for (let y = 0; y < group[0].members.length; y++) {
      const item = group[0].members[y];
      const user = await userModel.find({
        _id: item._id,
      });
      if (user.length == 0) return false;
      members.push({
        userName: user[0].userName,
        profile_pic: user[0].profile_pic ? user[0].profile_pic : "",
        _id: user[0]._id,
        role: item.role,
        isUser: user[0]._id + "" == logUserId,
      });
    }
    console.log(members);
    return members;
  },
  removeUser: async function (groupId, userId) {
    // remove user
    const convertion = await ConversationModel.findById(groupId);
    // check he is admin & alone ?
    const newList = await convertion.members.filter(function (item) {
      return item._id !== userId;
    });
    const adminCount = await newList.filter((item) => item.role == "admin");
    const leftGuy = await convertion.members.filter(function (item) {
      return item._id == userId && item.role == "admin";
    });
    console.log(leftGuy);
    if (
      leftGuy.length > 0 &&
      leftGuy[0]._id == userId &&
      leftGuy[0].role == "admin" &&
      adminCount.length == 0
    ) {
      // make another guy a admin
      console.log("pla");
      if (newList.length > 0) {
        newList[0]["role"] = "admin";
        console.log("pal");
      }
    }
    console.log(newList);
    convertion.members = newList;
    return await convertion.save();
  },
  getGroupUpdate: async function (data) {
    console.log(data);
    const conversation = await ConversationModel.find({ _id: data.groupId });
    if (conversation.length > 0) {
      await data.listOfPeople.forEach((element) => {
        delete element.label;
        element.role = "member";
      });
      conversation[0].name = data.groupName;
      conversation[0].members = [
        ...conversation[0].members,
        ...data.listOfPeople,
      ];
      await conversation[0].save();
    }
  },
  changRole: async (data) => {
    // find group
    const conversation = await ConversationModel.find({ _id: data.groupId });
    const newList = [];
    console.log(conversation[0].members);
    await conversation[0].members.forEach(function (item) {
      if (item._id == data.id) {
        newList.push({
          _id: item._id,
          role: data.role,
        });
      } else {
        newList.push({
          _id: item._id,
          role: item.role,
        });
      }
    });
    conversation[0].members = newList;
    console.log(newList);
    conversation[0].save().then(function (data) {
      console.log(data);
    });
  },
};

module.exports = socketController;
