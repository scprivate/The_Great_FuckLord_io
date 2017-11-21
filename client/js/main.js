'use strict';

let theBoard;
let myColor;
let myLobby;
let socket;
let verbose = true;

$(document).ready(function () {
    

    window.addEventListener('resize', fitStageIntoParentContainer);

    socket = io();

    socket.on("lobbyList", (lobbyList)=>{
        clearChat(false);
        addMsgToChat("Open Lobbies: ", 4, true);
        for(let i=0;i<lobbyList.length; i++){
            addMsgToChat(lobbyList[i].toString(), 4, true);
        }
        addMsgToChat("type /join <number>", 4, true);
    });

    socket.on("joined", (lobbyNum) => {
        debug("joined lobby: " + lobbyNum);
        myLobby = lobbyNum;

        newGame();
    });

    socket.on("failedToJoin", () => {
        debug("failed to join lobby");
        clearChat(false);
        addMsgToChat("Failed to join lobby", 4, true);
        socket.emit("getLobbyList");
    });

    socket.on("yourColor", (color) => {
        debug("my color: " + color);
        myColor = color;
        clearChat(false);
        addMsgToChat("You are " + numToColor[color], color, true);
    });

    socket.on("newMsg", (chatObj) => {
        addMsgToChat(chatObj.msg, chatObj.color);
    });

    socket.on("getKicked", () => {
        window.location.href = "https://www.youtube.com/watch?v=Wp1kzZ-eDTw";
    });

    socket.on("letGo", () => {
        if(theBoard.currentPiece){
            theBoard.dropPiece = true;
        }
    });

    socket.on("pieceMoving", (unitPosition) => {
        theBoard.setUnitPosition(unitPosition.piece, unitPosition);
    });

    socket.on("pieceDropped", (unitPosition) => {
        theBoard.setUnitPosition(unitPosition.piece, unitPosition);
    });

    socket.on("gameState", (histArr) => {
        debug(histArr);
        for(let i=0;i<histArr.length;i++){
            theBoard.setUnitPosition(histArr[i].index, histArr[i].position);
        }
    });

    socket.on("clearChat", () => {
        clearChat();
    });

    socket.on("newGame", () => {
        newGame();
    });

    $(document).keydown(function (e) {
        if (e.keyCode === 27) {
            return; //###
        }
        else if (e.keyCode == 13) { //enter
            $("#chatInput").focus();
            sendChat();
        }
        else {
            $("#chatInput").focus();
        }
    });

});
