const moment = require("moment");

const socketApp = function (server) {
  const io = require("socket.io")(server);
  const socketController = require("../controllers/socket.controller");
  users = {};
  onlineUser = {};

  io.on("connection", function (socket) {
    socket.join("public");
    socket.on("login", async (data, resp) => {
      const userData = {
        userId: data._id,
        userName: data.firstName + " " + data.lastName,
        profile_pic: data.profile_pic,
        socketId: socket.id,
        status: "online",
      };
      const userId = await socketController.login(userData, io.sockets.sockets);
      userData._id = userId;
      socket.user = userId;
      // add this socket to the Set of sockets for this user
      if (!users[socket.user]) {
        users[socket.user] = new Set();
      }
      users[socket.user].add(socket);
      socket.user = userId;
      onlineUser[socket.user] = userData;
      console.log("login " + socket.user);
      const userList = Object.values(onlineUser);
      io.to("public").emit("updateOnlineUser", userList);
      io.to("public").emit("userOnline", socket.user);
      // join all group
      const listOfGroup = await socketController.getGroupConversation(
        socket.user
      );
      listOfGroup.forEach((groupId) => {
        users[socket.user].forEach((user) => {
          user.join("chat_" + groupId._id);
        });
      });
      resp(userId);
    });
    /* @todo list events
     * send personal message
     * get personal message (emit)
     * send group message
     * get group message (emit)
     * acknowlement_message (seen)
     */
    // send personal message
    socket.on("sendPersonalMessage", function (data, resp) {
      // save message and emit get personal message
      /*
       * data object {}
       * data.authorId
       * data.senderId
       * data.messageType
       * data.messageBody
       */
      // save message
      socketController
        .save_message({
          conversation_type: 0, // personal
          senderId: data.senderId,
          authorId: data.authorId,
          message_body: data.message_body,
          message_type: data.message_type,
        })
        .then((messageId) => {
          if (users[data.senderId]) {
            users[data.senderId].forEach((user) => {
              user.emit("getMessage", {
                message_id: messageId,
                conversationId: data.conversationId ? data.conversationId : "",
                message_type: data.message_type,
                message_body: data.message_body,
                user: onlineUser[data.authorId],
                isSend: false,
                chatType: 0,
                status: "online",
              });
              console.log("sent to oppo");
            });
            if (users[data.authorId].size > 1) {
              users[data.authorId].forEach((user) => {
                if (user.id != socket.id) {
                  user.emit("getMessage", {
                    message_id: messageId,
                    message_type: data.message_type,
                    conversationId: data.conversationId
                      ? data.conversationId
                      : "",
                    message_body: data.message_body,
                    user: onlineUser[data.senderId],
                    chatType: 0,
                    isSend: true,
                    status: "online",
                  });
                  console.log("sent to user");
                }
              });
            }
          }
          return resp({
            message_id: messageId,
            conversationId: data.conversationId ? data.conversationId : "",
            message_type: data.message_type,
            message_body: data.message_body,
            user: {
              userName: onlineUser[data.authorId].userName,
              profile_pic: onlineUser[data.authorId].profile_pic,
            },
            time: moment(),
            date: moment(),
            isSend: false,
            chatType: 0,
            status: "online",
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
    socket.on("getLastMessage", async function (data, resp) {
      // save message and emit get personal message
      /*
       * message_limit
       */
      // save message
      if (data.hasOwnProperty("type") && data.type == 1) {
        const getMessage = await socketController.get_group_old_message(
          data.senderId,
          data.authorId,
          data.skip
        );
        return resp(getMessage);
      } else {
        const getMessage = await socketController.get_old_message(
          data.authorId,
          data.senderId,
          data.message_limit
        );
        return resp(getMessage);
      }
    });
    socket.on("personalMessageAck", function (data) {
      return socketController.personalMessageAck(
        data.messageId,
        socket.user + ""
      );
    });
    socket.on("getPersonalConversation", async function (resp) {
      // save message and emit get personal message
      /*
       * message_limit
       */
      // save message
      const getMessage = await socketController.getPersonalConversation(
        socket.user
      );
      return resp(getMessage);
    });
    socket.on("getGroupConversation", async function (resp) {
      // save message and emit get personal message
      /*
       * message_limit
       */
      // save message
      const getMessage = await socketController.getGroupConversation(
        socket.user
      );
      return resp(getMessage);
    });
    // fetch People
    socket.on("fetchPeople", async function (data, cb) {
      if (data.name.length == 0) return false;
      const resp = await socketController.fetchPeople(
        data.name,
        socket.user,
        data.edit,
        data.groupId
      );
      return cb(resp);
    });
    // Get Group Member
    socket.on("getGroupMember", async function (data, cb) {
      const resp = await socketController.getGroupMember(data.id, socket.user);
      return cb(resp);
    });
    socket.on("removeUser", function (data) {
      // @data =  { groupId,id,name }
      // remove user from db first
      const groupId = data.groupId;
      socketController.removeUser(data.groupId, data.id).then(function (err) {
        if (err) console.log(err);
        // call OnRemoveUser Event
        if (users[data.id]) {
          users[data.id].forEach((user) => {
            user.emit("OnRemoveUser", { id: data.groupId });
          });
        }

        // remove message
        let message =
          data.senderName + " removed by " + onlineUser[socket.user].userName;
        if (socket.user == data.id)
          message = onlineUser[socket.user].userName + " left";
        socketController
          .saveGroupMessage({
            conversationId: groupId,
            authorId: socket.user,
            message_type: "6",
            message_body: message,
          })
          .then(function (resp) {
            socket.in("chat_" + groupId).emit("getMessage", {
              message_id: resp.messageId,
              conversationId: groupId,
              message_type: "6",
              message_body: message,
              user: onlineUser[socket.user],
              authorId: socket.user,
              chatType: 1,
              isSend: false,
            });
          });
        // send message to remove User
      });
    });
    // disconnect method
    socket.on("disconnect", function () {
      if (!socket.user) {
        return;
      }
      socket.leave("public");
      socket.leave("chat_*");
      // remove socket for this user
      // and remove user if socket count hits zero
      if (users[socket.user]) {
        users[socket.user].delete(socket);
        if (users[socket.user].size === 0) {
          delete onlineUser[socket.user];
          delete users[socket.user];
          io.to("public").emit("userOffline", socket.user);
        }
      }
      // find by
      socketController.makeUserOffline(socket.user);
    });
    socket.on("sendGroupMessage", function (data, response) {
      console.log(data.message_body);
      // send messaage
      socketController
        .saveGroupMessage({
          conversationId: data.conversationId,
          authorId: data.authorId,
          message_body: data.message_body,
          message_type: data.message_type,
        })
        .then((messageId) => {
          // public message in group
          response({
            message_id: messageId,
            conversationId: data.conversationId,
            message_type: data.message_type,
            message_body: data.message_body,
            user: onlineUser[data.authorId],
            authorId: data.authorId,
            chatType: 1,
            isSend: true,
          });
          socket.to("chat_" + data.conversationId).emit("getMessage", {
            message_id: messageId,
            conversationId: data.conversationId,
            message_type: data.message_type,
            message_body: data.message_body,
            user: onlineUser[data.authorId],
            authorId: data.authorId,
            chatType: 1,
            isSend: false,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
    socket.on("editGroup", async function (data, act) {
      await data.listOfPeople.forEach((element) => {
        delete element.label;
        element.role = "member";
      });
      await socketController.getGroupUpdate(data);
      act();
    });
    socket.on("groupChangeRole", async function (data, cb) {
      // return false
      await socketController.changRole(data);
      cb(null, "Role changed successfully");
    });
    socket.on("createGroup", async function (data, act) {
      // create group
      // name
      // list of people
      const name = data.groupName;
      data.listOfPeople.forEach((element) => {
        delete element.label;
        element.role = "member";
      });
      const listOfPeople = [
        ...data.listOfPeople,
        { _id: socket.user + "", role: "admin" },
      ];
      // save them to db
      const responceData = await socketController.createGroup(
        name,
        listOfPeople,
        socket.user,
        onlineUser[socket.user].userName
      );
      // event to all people
      await data.listOfPeople.forEach((element) => {
        if (users.hasOwnProperty(element._id)) {
          users[element._id].forEach((user) => {
            user.join("chat_" + responceData.groupId);
          });
        }
      });
      socket.to("chat_" + responceData.groupId).emit("getMessage", {
        message_id: responceData.messageData.message_id,
        message_type: responceData.messageData.message_type,
        message_body: responceData.messageData.message_body,
        user: onlineUser[responceData.messageData.authorId],
        authorId: responceData.messageData.authorId,
        chatType: 1,
        isSend: false,
      });
      act("done");
    });
  });
};
module.exports = socketApp;
