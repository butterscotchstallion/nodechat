

function Chat(socket) {
    this.socket           = socket;
    this.commandCharacter = '/';
    this.users            = [];
    this.maxMessageLength = 255;
    
    /** 
     * Handle incoming messages
     *
     */
    this.handleIncomingMessage = function (message) {
        if (this._isCommand(message)) {
            this.processCommand(message);
        } else {
            io.sockets.emit('updatechat', {
                from: this.socket.username,
                message: message.substring(0, maxMessageLength-1)
            });
        }
    };
    
    /**
     * Check if message starts with command character
     *
     */
    this._isCommand = function (message) {
        return message.substring(0, 1) === this.commandCharacter;
    };
}