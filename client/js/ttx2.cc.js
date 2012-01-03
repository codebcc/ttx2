
var CC = {

    init: function() {

        //*** Determine what control characters are required

        //make an array of selected tools
        
        selectedTools = $("#tools li.selected");

        var tools = []; //will hold data about our selected tools
        DATA.ccArr = new Array(); //array of control characters

        if(selectedTools.length==0) {

            DATA.tools = [];
            CC.addToGrid();
            return false;            
        }

        DATA.blackBGLeftEdge = false; //black BG at left edge has no control character
        DATA.blackBGNotLeftEdge = false; //black BG not at left edge has one less control character
        DATA.whiteTextLeftEdge = false; //white text at left edge has no control character

        DATA.atLeftEdge = CC.checkLeftEdge(); //are we at the left edge?

        selectedTools.each(function(i) {
            t = $(this);
            toolset = t.parents("div.toolset");
            tools[i] = {
                background:     toolset.data("background"),
                foreground:     toolset.data("foreground"),
                text:           toolset.data("text"),
                graphics:       toolset.data("graphics"),
                color:          t.data("color") ? COLORS[t.data("color")] : false,
                cc:             ccs[t.attr("cc")]
            }


            //the default text color is white and default background color is black so
            //we don't need control characters if these are selected AND we're at the left edge
            //
            //if black is the background color and we're not at the left edge we'll need one less control character

            if(DATA.atLeftEdge) {
                if(!DATA.whiteTextLeftEdge) DATA.whiteTextLeftEdge = (tools[i].text && (tools[i].color.name=="White"));
                if(!DATA.blackBGLeftEdge) DATA.blackBGLeftEdge = (tools[i].background && (tools[i].color.name=="Black"));
            }

            if(!DATA.blackBGNotLeftEdge) DATA.blackBGNotLeftEdge = (tools[i].background && (tools[i].color.name=="Black"));

        });


        //first determine if a background tool was used that needs a special 'new background' tool
        for(i in tools) {
            if(tools[i].background && !DATA.blackBGLeftEdge) {
                arrStart = tools.slice(0,(i+1));
                arrStart.push({new: "new", cc: ccs["b_n"]});
                arrEnd = tools.slice((i+1),tools.length);
                tools = arrStart.concat(arrEnd); 
            }
        }

        //determine what CCs are needed
        for(i in tools) {
            tool = tools[i];
            if(tool.foreground) CC.addFG(tool);
            if(tool.background) CC.addBG(tool);
            if(tool.new) CC.addNewBG(tool);
        }

        DATA.tools = tools;

        //check marquee is big enough to hold the CCs
        ccLen = DATA.ccArr.length;
        if(FN.getCSSInt("width",EL.curMarquee) < (ccLen*DATA.blockX)) {
            FN.help("Marquee too small");
        } else {
            FN.help("");
            //add our CCs to the grid
            if(tools.length>0) CC.addToGrid();
        }

    },
    addBG: function(tool) {
        //background is a text color CC followed by a new background CC
        if(!DATA.blackBGLeftEdge) {
            //a background color is a foreground color followed by a 'new background' character
            if(!DATA.blackBGNotLeftEdge) DATA.ccArr.push(tool.cc); //specifiy BG color if it's not black
        }
    },
    addNewBG: function(tool) {
        DATA.ccArr.push(tool.cc);
    },
    addFG: function(tool) {
        if(!DATA.whiteTextLeftEdge) DATA.ccArr.push(tool.cc);
    },
    checkLeftEdge: function() {
        //is our selection touching the left edge?
        return ($("#grid td#cell1_1.ui-selected").length>0);
    },
    addToGrid: function() {

        EL.curMarquee.removeClass("empty");

        cr = CELL.getCellsRange($("#grid td.ui-selected"));

        //delete any CCs covered by this selection
        CC.removeSelected();

        atRightEdge = ($("#grid td.col40.ui-selected").length>0);

        //add CCs to the grid
        for(i = cr.firstRow; i<=cr.lastRow; i++) {

            for(j in DATA.ccArr) {

                j = parseInt(j);

                //add CC data to the grid
                thisCol = CELL.getCell({row:i,col:(cr.firstCol+j),fullMarquee:true});

                CC.addCCTD(thisCol, DATA.tools[j], DATA.ccArr[j]);
            }
        }

    },
    addNewBg: function(td) {
        CC.addCCTD(td, {background: "background", color: COLORS["black"], new: "new"}, ccs["b_bk"]);
    },
    addCCTD: function(td, toolObj, cc) {

        if(toolObj==undefined) return false;
        td
            .addClass("cc")
            .find("span.cc").remove().end()
            .append(CC.addCC(cc))
            .data((toolObj) ? CC.addData(toolObj) : "")

    },
    addData: function(tool) {
        if(tool==undefined) return {};
        color = (tool.color) ? tool.color.name.toLowerCase() : "";
        return {
            color: color,
            background: tool.background,
            foreground: tool.foreground,
            graphics: tool.graphics,
            text: tool.text,
            new: tool.new,
            marquee: EL.curMarquee.data("id")
        }

    },
    addCC: function(ccData) {
        return $('<span>')
                .text(String.fromCharCode(parseInt(ccData.unicode.toLowerCase(), 16)))
                .attr({
                    "class": "cc"
                });
    },
    removeSelected: function(elems) {
        if(elems==undefined) elems=$("#grid td.ui-selected");
        elems.each(function() {
            t = $(this);
            col = t.data("col");
            cls = "ui-selectee ui-selected";
            t
                .attr("class",cls)
                .data({
                    color: "",
                    background: "",
                    foreground: "",
                    graphics: "",
                    text: "",
                    marquee: "",
                    new: ""
                })
                .find("span.cc").remove()

        });
    }
}
