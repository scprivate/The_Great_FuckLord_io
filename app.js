var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//express routing
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/client', function (req, res) {
    res.sendFile(__dirname + '/client');
});

app.use('/client', express.static(__dirname + '/client'));

var port = process.env.PORT || 3000;
server.listen(port);


//defaults + constants
var DEBUG = true;
var verbose = true;

var MaxLobbySize = 4;

var lobbies = [];

var numToColor = { 0: "Red", 1: "Blue", 2: "Yellow", 3: "Green", 4: "Black" };
var ColorToNum = { "Red": 0, "Blue": 1, "Yellow": 2, "Green": 3, "Black": 4 };

var numCardVals = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
var fuckCardVals = ["Fuck Off", "Get Fucked", "FuckLord"];
var fuckCardChance = 0.15;

Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
};

class Lobby{
    constructor(number){
        this.number = number;
        this.playerList = []; //[{color:0, socket:socket, holding: undefined}, ]
        this.gameState = []; //[{index:1, position:{x:0, y:0}}, ...]
        this.currentCard = undefined;
    }
    newGame(){
        this.broadCast("newGame");
        this.clearPlayerHoldings();
        this.gameState = [];
        this.currentCard = undefined;
    }
    updateGameState(index, position){
        let found = false;
        for(let i=0;i<this.gameState.length;i++){
            if(this.gameState[i].index == index){
                found = true;
                this.gameState[i].position = position;
            }
        }
        if(!found){
            this.gameState.push({ index: index, position: position });
        }
    }
    sendGameState(socket){
        debug("sending game state");
        socket.emit("gameState", this.gameState);
    }
    forceGameState(){
        for (let i = 0; i < this.playerList.length; i++) {
            this.sendGameState(this.playerList[i].socket);
        }
    }
    isFull(){
        return this.playerList.length >= MaxLobbySize;
    }
    hasRoom(){
        return this.playerList.length < MaxLobbySize;
    }
    isEmpty(){
        return this.playerList.length == 0;
    }
    broadCast(type, msg){
        for(let i=0;i<this.playerList.length;i++){
            this.playerList[i].socket.emit(type, msg);
        }
    }
    broadCastExceptToColor(type, msg, color) {
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i].color == color){
                continue;
            }
            this.playerList[i].socket.emit(type, msg);
        }
    }
    getUniquePlayerColor() {
        let colors = [3, 2, 1, 0];
        for (let i = 0; i < this.playerList.length; i++) {
            let index = colors.indexOf(this.playerList[i].color);
            colors.splice(index, 1);
        }
        return colors.pop();
    }
    add(socket){
        let playerColor = this.getUniquePlayerColor();
        this.playerList.push({color: playerColor, socket: socket, holding: undefined});
        socket.emit("yourColor", playerColor);
        this.broadCast("playerJoined", playerColor);
    }
    kick(color) {
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i].color == color) {
                let player = this.playerList[i];
                this.playerList.splice(i, 1);
                player.socket.emit("getKicked");
            }
        }
    }
    pieceIsOpen(num){
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i].holding == num) {
                return false;
            }
        }
        return true;
    }
    clearPlayerHoldings(){
        for (let i = 0; i < this.playerList.length; i++) {
            this.playerList[i].holding = undefined;
        }
    }
    setPlayerHolding(color, piece){
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i].color == color) {
                this.playerList[i].holding = piece;
                return;
            }
        }
    }
    playerIsHolding(color, piece){
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i].color == color && this.playerList[i].holding == piece) {
                return true;
            }
        }
        return false;
    }
}

function debug(data) {
    if (verbose) {
        console.log(data);
    }
}

function openLobbys(){
    let openLobbyList = [];
    for (let i = 0; i < lobbies.length; i++) {
        if(lobbies[i].hasRoom()){
            openLobbyList.push(lobbies[i].number);
        }
    }
    return openLobbyList;
}

function getUniqueLobbyNumber(){
    let lobbyNums = [];
    for (let i = 0; i < lobbies.length; i++) {
        lobbyNums.push(lobbies[i].number);
    }
    let i=1;
    while(true){
        if(lobbyNums.includes(i)){
            i++;
            continue;
        }
        return i;
    }
}

function maintainLobbies(){
    //prune empty lobbies
    for (let i = 0; i < lobbies.length; i++) {
        if (lobbies[i].isEmpty()) {
            lobbies.splice(i, 1);
        }
    }

    let openLobbyList = openLobbys();
    
    //always at least 1 lobby available
    if (openLobbyList.length === 0){
        lobbies.push(new Lobby(getUniqueLobbyNumber()));
        return;
    }
}

function removePlayer(socket){
    for (let i = 0; i < lobbies.length; i++){
        for (let j = 0; j < lobbies[i].playerList.length; j++){
            if(lobbies[i].playerList[j].socket === socket){
                lobbies[i].broadCast("playerLeft", lobbies[i].playerList[j].color);
                lobbies[i].playerList.splice(j, 1);
            }
        }
    }
}

function getLobby(num){
    for (let i = 0; i < lobbies.length; i++) {
        if(lobbies[i].number == num){
            return lobbies[i];
        }
    }
}

function joinLobby(lobbyNum, socket){
    let lobby = getLobby(lobbyNum);
    if(!lobby || lobby.isFull()){
        socket.emit("failedToJoin");
        return;
    }
    socket.emit("joined", lobby.number);
    lobby.add(socket);
    lobby.sendGameState(socket);
    if (lobby.currentCard) {
        socket.emit("newCard", lobby.currentCard);
    }
}


function getRandomCard(){
    if(Math.random() < fuckCardChance){
        return fuckCardVals.random();
    } else{
        return numCardVals.random();
    }
}

//sockets
io.sockets.on('connection', function (socket) {

    //Initial connection message
    debug("new socket connection");

    //keep lobbys available and clean
    maintainLobbies();

    //send Open lobby list
    socket.emit("lobbyList", openLobbys());


    //handle disconnect
    socket.on("disconnect", function () {
        maintainLobbies();
        removePlayer(socket);
        maintainLobbies();
    });

    socket.on("grabbedPiece", function (startObj) {
        let lobby = getLobby(startObj.lobby);
        if(!lobby){
            debug("lobby is undefined at dragStart");
            return;
        }

        if(lobby.pieceIsOpen(startObj.piece)){
            lobby.setPlayerHolding(startObj.color, startObj.piece);
        }
        else{
            socket.emit("letGo");
        }
    });

    socket.on("movedPiece", function (moveObj) {
        let lobby = getLobby(moveObj.lobby);
        if (!lobby) {
            debug("lobby is undefined at movedPiece");
            return;
        }
        if (lobby.playerIsHolding(moveObj.color, moveObj.piece)) {
            let unitPosition = {x: moveObj.x, y:moveObj.y, piece:moveObj.piece};
            lobby.broadCastExceptToColor("pieceMoving", unitPosition, moveObj.color);
        }
    });

    socket.on("getLobbyList", function (moveObj) {
        maintainLobbies();
        socket.emit("lobbyList", openLobbys());
    });

    socket.on("droppedPiece", function (dropObj) {
        let lobby = getLobby(dropObj.lobby);
        if (!lobby) {
            debug("lobby is undefined at droppedPiece");
            return;
        }
        
        if (lobby.playerIsHolding(dropObj.color, dropObj.piece)) {
            let unitPosition = { x: dropObj.x, y: dropObj.y, piece: dropObj.piece };
            lobby.broadCastExceptToColor("pieceDropped", unitPosition, dropObj.color);
            lobby.setPlayerHolding(dropObj.color, undefined);
            lobby.updateGameState(dropObj.piece, unitPosition);
        }
    });
 
    //card handling
    socket.on("getNewCard", function (lobbyNum) {
        let cardVal = getRandomCard();
        let lobby = getLobby(lobbyNum);
        if(!lobby){
            debug("invalid lobby num at getNewCard");
            return;
        }
        lobby.broadCast("newCard", cardVal);
        lobby.currentCard = cardVal;
    });

    //chat handling
    socket.on("chat", function (chatObj) {
        //Length validation
        if (chatObj.msg.length > 55) {
            return;
        }
        //Command for joining lobby
        if (chatObj.msg.indexOf("/join") == 0) {
            maintainLobbies();
            //join a lobby
            let lobbyNum = chatObj.msg.replace("/join", "").trim();
            if(lobbyNum){
                joinLobby(lobbyNum, socket);
            }
            maintainLobbies();
            return;
        }
        //All other commands require a valid lobby number
        let lobby = getLobby(chatObj.lobby);
        if(!lobby){
            debug("invalid lobby number at chat handling");
            return;
        }
        //New game command
        if (chatObj.msg == "/ng") {
            debug("starting new game");
            maintainLobbies();
            lobby.newGame();
            return;
        }
        //clear chat
        else if (chatObj.msg == "/clear") {
            lobby.broadCast("clearChat");
            return;
        }
        //Roll
        else if (chatObj.msg == "/roll") {
            let value = Math.floor(Math.random() * 4);
            lobby.broadCast("rollValue", value);
            return;
        }
        //force game state + remove all player holdings
        else if (chatObj.msg == "/fix") {
            lobby.clearPlayerHoldings();
            lobby.forceGameState();
            return;
        }
        //kick player
        else if (chatObj.msg.indexOf("/kick") == 0) {
            maintainLobbies();
            let color = chatObj.msg.replace("/kick", "").trim();
            let num = ColorToNum[color];
            if (num !== undefined) {
                debug("kicking " + color);
                lobby.kick(num);
            }
        }

        //Normal text, not a command
        lobby.broadCastExceptToColor("newMsg", chatObj, chatObj.color);
    });
});