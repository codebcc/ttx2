
var TOOLS = {

    build: function() {

        toolset = $('<div class="toolset"><ul/></div>');

        //add title and IDs to container
        bgTools = toolset.clone().data("background","background").addClass("background").prepend('<h2>BG</h2>');
        fgToolsG = toolset.clone().data({foreground: "foreground", graphics: "graphics"}).addClass("graphics foreground").prepend('<h2>FG graphics</h2>');
        fgToolsT = toolset.clone().data({foreground: "foreground", text: "text"}).addClass("text foreground").prepend('<h2>FG text</h2>');

        //loop through all colors
        for(i in COLORS) {
            //add an LI with the class being the colors short name
            li = $("<li>").data("color",COLORS[i].name.toLowerCase()).addClass(COLORS[i].sname);

            //add a link
            a = $('<a href="#">').click(function() {
                TOOLS.toolClick($(this));
                return false;
            });

            //build our full element
            elem = li.append(a);
            var liClone = function(toolset) {
                toolset.find("ul").append(elem.clone({withDataAndEvents:true}));
            }

            //add these to our UL
            liClone(bgTools);
            liClone(fgToolsG);
            liClone(fgToolsT);
        }

        for(i in $(fgToolsG).find("li")) {
            fgClass = fgToolsT.find("li").eq(i).attr("class");
            if(fgClass) {
                $(fgToolsG).find("li").eq(i).attr({"class":fgClass, cc: "g_" + fgClass.toLowerCase()});
                $(fgToolsT).find("li").eq(i).attr({"class":fgClass, cc: "t_" + fgClass.toLowerCase()});
                $(bgTools).find("li").eq(i).attr({"class":fgClass, cc: "b_" + fgClass.toLowerCase()});
            }
        }
        //add the toolboxes to the tools area #tools
        EL.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("div.toolset[foreground] li.BK").remove();

        //add other tools
        //preview
        preview = $('<div class="toolset"/>')
            .append($('<input type="checkbox"/>')
                .change(function() {
                    EL.canvas.toggleClass("preview");
                })
            )
            .append($('<span/>').text("Preview"));
        $("div.toolset:last-child").after(preview);

    },
    setTools: function(tools) {

        //set tools back to a previous configuration

        TOOLS.reset();

        for(i in tools) {
            t = tools[i];
            if(t.background) {
                tsClass = "background";
            } else if (t.graphics) {
                tsClass = "graphics";
            } else if (t.text) {
                tsClass = "text";
            } else {
                tsClass = "";
            }
            par = (tsClass=="") ? $("#tools") : $("#tools div." + tsClass);

            if(t.color) par.find("li." + t.color.sname).addClass("selected");
        }
    },
    reset: function() {
        EL.tools.find("li.selected").removeClass("selected");
    },
    toolClick: function(t) {

        //what type of tool was clicked?
        
        toolset = t.parents("div.toolset");
        li = t.parent();

        foreground = toolset.data("foreground");
        background = toolset.data("background");

        //mark selection of tools in the toolbar
        if(li.hasClass("selected")) {
            //we're just deselecting a tool
            li.removeClass("selected"); 
        } else {
            //we're selecting a new tool
            //only one foreground tool can be selected at a time
            if(foreground) EL.tools.find("div.toolset.foreground li.selected").removeClass("selected");

            if(background) toolset.find("li.selected").removeClass("selected");
            li.addClass("selected");
        }

        tdSelected = $("#grid td.ui-selected");

        //add control characters to the grid
        if(tdSelected.length>0) CC.init();

        EL.curMarquee.data('tools',DATA.tools);

        MARQUEE.setTDClasses({marquee:true});
        MARQUEE.activate();

    }
}

var CANVAS = {

    build: function() {
        //first build our grid        
        EL.grid = $('<table id="grid" class="grid"/>');
        for(i=1; i<=DATA.rows; i++) {
            EL.grid
                .append(
                    $('<tr>')
                        .attr({
                            id: ("row" + i)
                        })
                        .data("row",i)
                );

            for(j =1; j<= DATA.cols; j++) {
                EL.grid.find("tr#row" + i)
                    .append(
                        $('<td>')
                            .attr({
                                id: ("cell" + i + "_" + j)
                            })
                            .data({
                                row: i,
                                col: j
                            })
                            .click(function() {
                                t = $(this);
                                if(!t.data("marquee")) {
                                    MARQUEE.editMode.cancel();
                                    MARQUEE.deactivate();
                                } else {
                                    EDIT.tdClick($(this));
                                }
                                EDIT.cursor.init(t);
                            })
                    );
                DATA.$cells["cell" + i + "_" + j] = EL.grid.find("#cell" + i + "_" + j);
            }
        }
        EL.canvas
            .append(EL.grid)
            .after($('<div id="help"/>'));

        EL.grid
            .selectable({
                stop: function(e,ui) {
                    sel = $("#grid td.ui-selected");
                    if(sel.length==1) {
                        MARQUEE.deactivate();
                        EDIT.cursor.init(sel);
                        return false;
                    }
                    coll = $("#grid td.collide");
                    if(coll.length>0) {
                        $("#grid td").removeClass("collide ui-selected");
                        MARQUEE.activate($("#marquee" + DATA.marqueeCount));
                    } else {
                        EDIT.cursor.remove();
                        MARQUEE.init();
                        FN.help("");
                    }
                },
                start: function() {
                    MARQUEE.removeEmpties();
                },
                selecting: function(e,ui) {
                    s = $(ui.selecting);
                    MARQUEE.markCollisions($(ui.selecting), $("div.marquee"));
                },
                unselecting: function(e,ui) {
                    u = $(ui.unselecting);
                    MARQUEE.unMarkCollisions($(ui.unselecting), $("div.marquee"));
                },
                filter: "td",
                cancel: "td.ui-selected, #canvas.edit td"
            });

    },
    keys: function() {

        //Marquee mode
        
        $(document).jkey('backspace,delete', function() {

            
            if($("div.marquee.edit").length<1) {

                tdSel = $("#grid td.ui-selected");
                MARQUEE.savePreviousSelection();
                if(tdSel.length>0) {
                    CC.removeSelected();
                    EL.curMarquee.addClass("empty");
                    MARQUEE.removeEmpties();
                    MARQUEE.setTDClasses({previousMarquee:true});
                    MARQUEE.editMode.removeText();
                    tdSel.removeClass("ui-selected");
                }

            }

        });


    },
    loop: function(opts) {

        //loop through specified cells and perform a function
        settings = {};

        if((EL.curMarquee.length>0) && (!EL.curMarquee.hasClass("empty"))) opts.marquee = true;

        if(opts.marquee) {

            posData = EL.curMarquee.data().pos;

            $.extend(settings, {
                lastRow: posData.lastRow,
                firstRow: posData.firstRow,
                firstCol: posData.firstCol,
                lastCol: posData.lastCol
            }, opts);

        } else {

            $.extend(settings, {
                lastRow: DATA.rows,
                firstRow: 1,
                lastCol: DATA.lastCol,
                firstCol: DATA.firstCol 
            }, opts);
        }
       
        if(settings.fullWidth) {
            settings.firstCol = 1;
            settings.lastCol = DATA.cols;
        }
        
        if(settings.inclusive) var endCol = settings.lastCol;


        for(i=settings.firstRow;i<=settings.lastRow;i++) {

            tr = $("#row" + i);

            if(settings.inclusive) {
               if((i>settings.firstRow) && (i<settings.lastRow)) {
                   settings.firstCol = MARQUEE.firstColOffset();
                   settings.lastCol = posData.lastCol;
               }
               if(i==settings.firstRow) {
                    settings.lastCol = posData.lastCol; 
               }
               if((i==settings.lastRow) && (!settings.until)) {
                    settings.lastCol = endCol; 
                    if(settings.lastRow!=settings.firstRow) settings.firstCol = MARQUEE.firstColOffset();
               }
            }


            if(settings.trFunction) settings.trFunction(tr,i)

            for(j=settings.firstCol;j<=settings.lastCol;j++) {

                if(settings.until) if(settings.until()) {
                    return td;
                    break;
                }

                td = CELL.getCell({row:i,col:j,noBoundary:true});

                if(settings.tdFunction) settings.tdFunction(td,j);

            }

        }
    }
}
