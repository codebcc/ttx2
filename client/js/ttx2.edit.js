var EDIT = {

    tdClick: function(t) {
        
        //only place the cursor on text cells
        if(t.find("span.t").length==0) {
            return false;
        } else {
            EDIT.cursor.init(t);
        }

    }, 
        
    tdDblClick: function(t) {
        MARQUEE.editMode.cancel();
    },

    cursor: {

        init: function(td) {
            EDIT.cursor.remove();
            td.append(
                $('<div id="cursor"/>').data("pos",td)
            )
            EL.cursor = $("#cursor");
            EDIT.keys.init();

            //determine if we need inset mode EG cursor is in the middle of text
            mData = EDIT.getEditableArea();
            cPos = CELL.getPos();
            ltcPos = CELL.getPos(MARQUEE.editMode.lastTextCell());

            /* DATA.insertMode = (cPos.row<ltcPos.row) ? true : (cPos.row==ltcPos.row) ? ((cPos.col<ltcPos.col) ? true : false) : false;
            charPos = EL.cursor.data().pos.data().charPos;
            DATA.insertHold ==false;

            if(DATA.insertMode && charPos && !DATA.insertHold) {
                DATA.insertOffset = (EL.curMarquee.data().charArr.length-charPos);
            } else if (DATA.insertMode && DATA.insertHold) {

            } else {
                DATA.insertOffset = 0;
            } 

            DATA.insertHold = DATA.insertMode; */



        },

        goBackBy: function(places) {

            $cellsWithText = $("#grid td.ui-selected:has(span.t)");
            var $cell;

            $cellsWithText.get().reverse().each(function(i) {
                
                if(i==(places-1)) $cell = $(this);

            });

            EDIT.cursor.init($cell);

            
            /* for(i=1;i<=(places-1);i++) {

                cPos = CELL.getPos();
                nextCell = CELL.getCell({row:ltcPos.row,col:(ltcPos.col-1)});
                //no text in this cell? go to last cell that has text
                if(nextCell.find("span.t").length==0) nextCell = MARQUEE.editMode.lastTextCellOnRow(nextCell.data().row);
                EDIT.cursor.init(nextCell);

            } */
        },

        remove: function() {
            $("#cursor").remove();
        },

        placeAtLastChar: function() {

            EDIT.cursor.init(MARQUEE.editMode.lastTextCell());

        },

        placeAfterLastChar: function() {
            
            ltcPos = CELL.getPos(MARQUEE.editMode.lastTextCell());
            EDIT.cursor.init(CELL.getCell({row:ltcPos.row,col:(ltcPos.col+1)}));
        },

        insertPlace: function() {

            EDIT.cursor.placeAfterLastChar();
            EDIT.cursor.goBackBy(EL.curMarquee.data().charArr.length-DATA.insertOffset);
            
        },

        move: function(o) {

            dir = o.direction;

            curData = CELL.getPos();

            if(o.delete) {
                EDIT.charArr.pop();
            }

            if(dir=="forward") {
                
                nextCell = CELL.getCell({row:curData.row,col:(curData.col+1)});
                    
            } else if (dir=="backward") {

                nextCell = CELL.getCell({row:curData.row,col:(curData.col-1)});    
                
            }

            /* if(o.arrow) {

                if(dir=="up") {
                    nextCell = CELL.getCell({row:(curData.row-1),col:curData.col,textOnly:true});
                } else if (dir=="down") {
                    nextCell = CELL.getCell({row:(curData.row+1),col:curData.col,textOnly:true});
                } else if (dir=="left") {
                    nextCell = CELL.getCell({row:curData.row,col:(curData.col-1),textOnly:true});
                } else if (dir=="right") {
                    nextCell = CELL.getCell({row:curData.row,col:(curData.col+1),textOnly:true});
                }

            } */

            EDIT.cursor.init(nextCell);
                

        },

        newLine: function(td) {
            
            EDIT.charArr.push({char:13,redraw:false});

            curData = EL.cursor.data("pos").data();

            nextCell = CELL.getCell({row:(curData.row+1),col:MARQUEE.firstColOffset()});

            EDIT.cursor.init(nextCell);

        }


    },

    keys: {
        
        init: function() {

            if($(document).data("events").keypress) return false;

            $(document).keypress(function(e) { 

                if((DATA.chars.indexOf(String.fromCharCode(e.charCode))>-1) || (e.charCode==13)) {

                    EDIT.addChar(e.charCode);

                }

                return false;
            });

            $(document).jkey('backspace', function() {

                
                if($("div.marquee.edit").length>0) {

                    EDIT.cursor.move({
                        direction: "backward",
                        delete: true
                    })

                }

            }).jkey('up,down,left,right', function(e) {
                EDIT.cursor.move({direction:e,arrow:true});
            });


        },

        cancel: function() {

            $(document).unbind("keypress");

        }

    },

    textSpan: function(key, special) {

        return $('<span class="t"/>').addClass(special ? "s": "").text(key);

    },

    addChar: function(char) {
        
        redraw = (char!=13);
        EDIT.charArr.push({char:char,redraw:redraw});

        if(char==13) {

            curData = EL.cursor.data("pos").data();
            nextCell = CELL.getCell({row:(curData.row+1),col:(MARQUEE.firstColOffset()-DATA.insertOffset)});
            EDIT.cursor.init(nextCell);

        } else {

            if(DATA.insertMode) {

                EDIT.cursor.move({direction:"forward"})

            } else {

                EDIT.cursor.placeAfterLastChar();

            }
            

        }

    },

    getEditableArea: function(o) {

        if(!o) o = {};
        cmData = (EL.curMarquee && !o.ignoreMarquee) ? EL.curMarquee.data().pos : undefined;

        return {
            firstCol: cmData ? (o.fullMarquee ? cmData.firstCol: MARQUEE.firstColOffset()) : 1,
            lastCol: cmData ? cmData.lastCol : DATA.cols,
            firstRow: cmData ? cmData.firstRow : 1,
            lastRow: cmData ? cmData.lastRow : DATA.rows
       }
    },

    charArr: {

        push: function(o) {

            charArr = EL.curMarquee.data().charArr;     
            if(DATA.insertMode) {
                io = (charArr.length-DATA.insertOffset);
                console.log(io,charArr.length,DATA.insertOffset);
                sliceArr = charArr.slice(0,io);
                sliceArr.push(o.char);
                sliceArr1 = charArr.slice(io,charArr.length);
                EL.curMarquee.data().charArr = sliceArr.concat(sliceArr1);
                console.log(FN.charArrToWords());
            } else {
                charArr.push(o.char);
            }

            if(o.redraw!=false) MARQUEE.editMode.drawText();

        },

        pop: function() {
            
            EL.curMarquee.data().charArr.pop();
            MARQUEE.editMode.drawText();
        },
    },

    drawing: {
        
        init: function() {
            
        }
    }


}