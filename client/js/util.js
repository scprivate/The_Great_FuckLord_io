var numToColor = { 0: "Red", 1: "Blue", 2: "Yellow", 3: "Green", 4: "Black" };
var ColorToNum = { "Red": 0, "Blue": 1, "Yellow": 2, "Green": 3, "Black": 4 };

var piecePositions = {
    0: { x: 79, y: 58 },
    1: { x: 98.5, y: 77.7 },
    2: { x: 79, y: 97.4 },
    3: { x: 60.3, y: 77.7 },
    4: { x: 521.6, y: 60 },
    5: { x: 540.2, y: 78.7 },
    6: { x: 521.6, y: 96.2 },
    7: { x: 503, y: 78.7 },
    8: { x: 521.6, y: 503.9 },
    9: { x: 538, y: 521.3 },
    10: { x: 521.6, y: 539.9 },
    11: { x: 503, y: 521.3 },
    12: { x: 79, y: 502 },
    13: { x: 97.5, y:521.39 },
    14: { x: 79, y: 537.7 },
    15: { x: 60.4, y: 521.39 },
    
};

let cards = {
    "1": "Move\nOne Space\nor\nLeave Start",
    "2": "Move\nTwo Spaces\nor\nLeave Start\n\nand\nDraw Again",
    "3": "Move\nThree Spaces",
    "4": "Move\nFour Spaces\nor\nMove Enemy\nOne Space",
    "5": "Move\nFive Spaces",
    "6": "Move\nSix Spaces\nor\nSwitch Positions\nWith an Enemy",
    "7": "Move\nSeven Spaces\nor\nSplit the Move\nBetween\nTwo Pieces",
    "8":"Move\nEight Spaces\nor\nDraw Again",
    "9":"Move\nNine Spaces",
    "10":"Move\nTen Spaces\nor\nMove Enemy\nTwo Spaces",
    "Fuck Off": "Expell Enemy\nFrom Home\nor\nLeave Start",
    "Get Fucked": "Take a Piece\nFrom Start\nand\nBump an Enemy\nBack to Start",
    "FuckLord": "Leave Start\nor\nMove Piece\nDirectly to Home\n\nAnd\nDraw Again"
};

function getPieceColor(index){
    return numToColor[Math.floor(index / 4)];
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

function fitStageIntoParentContainer(){
    if(!theBoard){
        return;
    }
    let stage = theBoard.stage;

    if (stage === undefined) {
        console.log("stage undefined");
        return;
    }
    
    var container = document.querySelector('#ctx');
    var containerWidth = container.offsetWidth;
    
    var scale = containerWidth / 600;
    
    stage.setWidth(600 * scale);
    stage.setHeight(600 * scale);
    stage.setScale({ x: scale, y: scale });
    stage.draw(); 
}

function debug(data) {
    if (verbose) {
        console.log(data);
    }
}

function sendChat() {
    let input = $("#chatInput");
    let msg = input.val();
    if (!msg || msg == "" || msg == " ") {
        return;
    }
    else if(msg.indexOf("/join") == 0 && myLobby !== undefined){
        input.val("");
        addMsgToChat("Already in a lobby", 4, true);
        return;
    }
    socket.emit("chat", { "color": myColor, "msg": msg, "lobby": myLobby });
    input.val("");
    addMsgToChat(msg);
}

function addMsgToChat(msg, colorNum = myColor, overrideMsg = false) {
    if (msg.indexOf("/") == 0) {
        return;
    }

    let color = numToColor[colorNum];

    if(color == undefined){
        color = "Guest";
    }

    if (overrideMsg) {
        $("#chatList").append($("<li class='chatMessage'>").text(msg).css('color', color));
        return;
    }
    $("#chatList").append($("<li class='chatMessage'>").text(color + ": " + msg).css('color', color));
}

function clearChat(verbose=true) {
    $("#chatList").html("");
    if(verbose){
        addMsgToChat("Chat Cleared", "4", true);
    }
}

function newGame(){
    debug("starting new Game");
    theBoard = new Board();
    fitStageIntoParentContainer();
}

function displayCardOnCanvas(cardVal) {
    cardVal = cardVal.toString();
    cardDesc = cards[cardVal];

    let cardCanvas = document.getElementById("cardCanvas");
    let cardCanvasCtx = cardCanvas.getContext("2d");
    cardCanvasCtx.font = '25px Arial';

    //clear card
    cardCanvasCtx.clearRect(0, 0, cardCanvas.width, cardCanvas.height);
    cardCanvasCtx.fillStyle = "red";
    cardCanvasCtx.textAlign = "center";
    cardCanvasCtx.fillText(cardVal, cardCanvas.width / 2, cardCanvas.height / 5);

    var lineheight = 30;
    var lines = cardDesc.split('\n');

    for (var i = 0; i < lines.length; i++)
        cardCanvasCtx.fillText(lines[i], cardCanvas.width / 2, cardCanvas.width / 2 + (i * lineheight));
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function changeDeckColor(){
    debug("hit");
    let color = getRandomColor();
    let card = theBoard.layer.find(".card");
    card.fill(color);
    theBoard.layer.draw();
}