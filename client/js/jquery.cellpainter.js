/**
 * @author Stefan Hoth <sh@jnamic.com>
 * @created 2011/09/24
 *
 * based on http://www.webspeaks.in/2011/02/create-simple-paint-canvas-using.html
 */

(function($) {
        $.fn.cellpainter = function(options) {

	 	var settings = {
            //id of the HTML-element which helds the canvas
            htmlId: 'cellcanvas',

			//number of blocks
			width: 40,
			height: 23,

            log: true
        };
        
        options = $.extend(true, settings, options);	
		
        var sub_width  = 3;
        var sub_height = 4;
		var statusId = "cellpainter_status";
        var activeColor = "black";
        var paintModeActive = false;
        
		var version = '0.5.0';
	
		function prepareCanvas() {

			log("Preparing canvas...");
			
			buildTable(options.htmlId);
			
			$container = $('#'+options.htmlId+' td').mousemove(repaint).click(repaint);
			
			$('#'+options.htmlId)
				.mousedown(function(){
					log("Paint mode active");
					paintModeActive = true;
				})
				.mouseup(function(){
					log("Paint mode inactive");
					paintModeActive = false;
				})
				.mousemove(function(){
					updateStatus();
				});
			
			$('#'+options.htmlId).append("<div id='"+statusId+"'></div>");
		}
		
		/**
		 * build table, all rows including subblocks
		 */
		function buildTable(wrapperId){

			$table = $('#'+wrapperId).append("<table></table>").find('table');
			
			for( k = 1; k <= options.height;k++){
				log("Building row "+k+"/"+options.height);
				buildRow($table);
			}
		}
		
		/**
		 * builds one row of blocks, including subblocks
		 */
		function buildRow(tableElem){
			
			isTop = false;
			isBottom = false;
			
			for( i = 1; i <= sub_height;i++){
				
				$row = $('<tr></tr>');
				
				if(i == 1){
					isTop = true;
				}
				if(i == sub_height){
					isBottom = true;
				}
				
				for( j = 1; j <= (options.width * sub_width);j++){
					
					$cell = $("<td></td>");
					
					if( (j - 1) % sub_width == 0){
						$cell.addClass("left");
					}
					if(j % sub_width == 0){
						$cell.addClass("right");
					}
					if(isTop){
						$cell.addClass("top");
					}
					if(isBottom){
						$cell.addClass("bottom");
					}
					
					$row.append($cell);
				}

				$(tableElem).append($row);
				
				isTop = false;
				isBottom = false;
			}
		}

		/**
		 * render the palette
		 */
		function preparePalette(){
			
			log("Preparing palette...");
			$container = $('#'+options.htmlId);
			
			$container
				.prepend("<div class='colorbox_wrap' />")
				.find('.colorbox_wrap')
				.append("<div class='colorbox White'/>")			
				.append("<div class='colorbox Black'/>")			
				.append("<div class='colorbox Red'/>")		
				.append("<div class='colorbox Yellow'/>")			
				.append("<div class='colorbox Blue'/>")			
				.append("<div class='colorbox Green'/>")			
				.append("<div class='colorbox Magenta'/>")			
				.append("<div class='colorbox CYAN'/>")			
			
			$('.colorbox').click(function(){
  				activeColor = $(this).css('background-color');
  				log("Switched active color to "+activeColor);
 			});
		} 
		
		/**
		 * paints the cell according to the setting
		 */
		function repaint(e){
			log(e);
			
			if(paintModeActive || e.type == "click"){
				log("Painting current cell to "+activeColor);
				$(this).addClass("filled");
			}
		}
		
		/**
		 * reads the status from the 
		 */
		function updateStatus(){
			
			row=1;
			
			$status = $('#'+statusId).text("").append("<p>Filled:</p><ul>");
			$('#'+options.htmlId+' tr').each(function(){
				
				if($(this).find('td.filled').length > 0){
				
					text = "<li>Row #"+row+": "+ $(this).find('td.filled').length+"</li>";
					
					$status.append(text);
				}
				row++;
			});
			$status.append('</ul>');
		} 
	
        /**
         * a simple log wrapper to switch logging on/off and avoid js-errors on non-console browsers (looking at you IE!)
         */ 
        function log(message){
            if(options.log && typeof console == "object" && typeof console.log == "function"){
                console.log(message);   
            }
        }
	 	
	 	/**
	 	 * invokes internal commands in the correct order
	 	 */  
	 	function run(){
	 		//disable cursor change on drag
	 		document.onselectstart = function () { return false; }
            prepareCanvas();
            preparePalette();
        }
        
        log("Starting jquery.cellpainter [version="+version+"]");
        log("Options:");
        log(options);
        
        //build the page
        run();
     };
     
})(jQuery);