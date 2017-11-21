'use strict';

class Board{
    constructor(){
        this.stage = new Konva.Stage({
            container: 'ctx',
            width: 600,
            height: 600
        });
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.pieceList = [];

        this.currentPiece = undefined;
        this.dropPiece = false;

        this.addDefaultPieces();
        this.setupEvents();
    }

    getUnitPosition(index){
        index = parseInt(index);
        let piece = this.pieceList[index];

        let position = piece.position();

        return {
            x: position.x / 600,
            y: position.y / 600
        }
    }

    setUnitPosition(index, unitPos){
        index = parseInt(index);
        let piece = this.pieceList[index];

        piece.moveToTop();

        let newPos = {
            x: unitPos.x * 600,
            y: unitPos.y * 600
        }

        let position = piece.position(newPos);
        theBoard.layer.draw();
    }

    setupEvents(){
        let layer = this.layer;
        let getUnitPos = this.getUnitPosition.bind(this);

        this.stage.on("dragstart", function (e) {
            console.log('Grabbed ' + e.target.name());
            e.target.moveToTop();

            theBoard.currentPiece = e.target;
            socket.emit("grabbedPiece", { lobby: myLobby, color: myColor, piece: e.target.name() });

            layer.draw();
        });

        this.stage.on("dragmove", function (e) {
            //if told to drop -> dont send information
            if(this.dropPiece){
                layer.draw();
                return;
            }

            let unitPos = getUnitPos(e.target.name());
            socket.emit("movedPiece", { lobby: myLobby, color: myColor, piece: e.target.name(), x: unitPos.x, y: unitPos.y});

            layer.draw();
        });

        this.stage.on("dragend", function (e) {
            console.log('Dropped ' + e.target.name());
            this.dropPiece = false;
            this.currentPiece = undefined;

            let unitPos = getUnitPos(e.target.name());
            socket.emit("droppedPiece", { lobby: myLobby, color: myColor, piece: e.target.name(), x: unitPos.x, y: unitPos.y});
            layer.draw();
        });
    }

    addDefaultPieces(){
        let stage = this.stage;

        for (let i = 0; i < 10; i++) {

            let x = stage.getWidth() * (i / 12) + 12;
            let y = stage.getHeight() / 2;

            let piece = this.makePiece(x, y, "red", i);

            this.pieceList.push(piece);
            this.layer.add(piece);
        }
    }

    makePiece(_x, _y, _fill, _name){
        let board = this;

        return new Konva.Circle({
            x: _x, 
            y: _y,
            radius: 10,
            fill: _fill,
            stroke: 'black',
            strokeWidth: 2,
            draggable: true,
            name: _name.toString(),
            dragBoundFunc: function (pos) {
                return {
                    x: clamp(pos.x, 0, board.stage.getWidth() - 0),
                    y: clamp(pos.y, 0, board.stage.getHeight() - 0)
                }
            }            
        });
    }
}