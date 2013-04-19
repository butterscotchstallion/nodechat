/**
 *
 *
 */
'use strict';

var Chat = (function() {
    var settings         = {};
    var commandCharacter = '/';
    var users            = [];
    var maxMessageLength = 255;
    
    function initialize (userSettings) 
    {
        settings = userSettings;
    }
    
    function handleIncomingMessage (io, message, username) 
    {
        if (isCommand(message)) {
            var commandResult = processCommand({
                io: io,
                message: message,
                username: username
            });
            
            // If this is a nick change, assign new nick
            if (message === 'nick') {
                io.socket.username = commandResult;
            }
            
        } else {
            io.sockets.emit('updatechat', {
                from: username,
                message: message.substring(0, maxMessageLength-1)
            });
        }
    }
    
    /** 
     * Need to rebuild user list because merely deleting an element from
     * the array leaves nulls
     *
     */
    function rebuildUserList(departingUser)
    {
        var len         = users.length;
        var newUserList = [];
        
        for (var j = 0; j < len; j++) {
            // Don't add departing user to new user array
            if (users[j] !== departingUser) {
                newUserList.push(users[j]);
            }
        }
        
        users = newUserList;
        
        return users;
    }
    
    function addUser(username) 
    {
        users.push(username);
    }
    
    function getUserList() 
    {
        return users;
    }
    
    function isCommand (message) {
        return message.substring(0, 1) === commandCharacter;
    }
    
    function processCommand(commandData) 
    {
        var cmdParts = commandData.message.substring(1).split(' ');
        var cmd      = cmdParts[0];
        var cmdValue = cmdParts[1];
        
        switch (cmd) {
            // Change nick
            case 'nick':
                // Get user list, removing old nick
                var usernames = Chat.rebuildUserList(commandCharacter.username);
                
                // Set new one
                Chat.addUser(cmdValue);
                var newUsername = cmdValue;
                
                console.dir(commandData);
                
                // Update user list
                commandData.io.socket.emit('updateusers', usernames);
                
                // Let everyone else know
                commandData.io.socket.broadcast.emit('updatechat', {
                    from: 'SYSTEM',
                    message: commandData.username + ' changes into a <strong>"' + cmdValue + '"</strong>',
                    isSystemMessage: true
                });
                
                // Display to self
                commandData.io.socket.emit('updatechat', {
                    from: 'SYSTEM', 
                    message: 'You change into a <strong>"' + cmdValue + '"</strong>',
                    isSystemMessage: true
                });

                return newUsername;
            break;
        }
    }
    
    return {
        initialize: initialize,
        handleIncomingMessage: handleIncomingMessage,
        getUserList: getUserList,
        isCommand: isCommand,
        addUser: addUser,
        rebuildUserList: rebuildUserList
    };
    
})();

module.exports = Chat;