/*!
* NiteLite
**
    Stipped-down lightbox plugin for jQuery
        github.com/premasagar/nitelite

    by Premasagar Rose
        premasagar.com
        dharmafly.com

    license:
        opensource.org/licenses/mit-license.php

*//*

    creates method:
        jQuery.lightbox()
        
    **
    
    with reverence:
        last.fm/music/The+Nite-Liters
        
*/

'use strict';

(function($){
    var
        namespace = 'nitelite',
        version = '0.1',
       
        win = window,
        document = win.document,
        
        settings = {
            overlay: {
				opacity: 0.7,
				bgColor: '#000'
			}
        },
        
        ns = function ns(props, delimiter){
			delimiter = delimiter || '-';
			if (!props){
				return namespace;
			}
			else if (typeof props === 'string'){
				return namespace + delimiter + props;
			}
			else {
				return [namespace].concat(props).join(delimiter);
			}
        },
    
        notifyGlobalWindow = function(origin, eventTypes, namespace){ // origin is originating object (e.g. Overlay instance), eventTypes is array (e.g. ['add', 'remove']), namespace is optional - if not provided, the origin must have a 'type' property (e.g. 'overlay')
			$.each(eventTypes, function(i, type){
				try {
				    $(origin)
					    .bind(type, function(){
						    $(win).trigger(ns(), {type: (namespace || origin.type) + '.' + type, origin:this});
					    });
			    }
			    catch(e){}
			});
			return origin;
		},
        
        Nitelite = {
            // TODO: Could use an iframe for overlay, to prevent small chance of CSS bleed
            Overlay: $.extend(
	            function(opacity, bgColor){								
		            if (opacity){ // TODO: This doesn't allow opacity=0. Perhaps we should check typeof==='number'||typeof==='string'
			            this.opacity = opacity;
		            }
		            if (bgColor){
			            this.bgColor = bgColor;
		            }
	            },
	            {
		            prototype: {
			            type: 'overlay',
			            opacity: settings.overlay.opacity, // TODO: This should use *instance* settings, not global settings
			            bgColor: settings.overlay.bgColor, // TODO: as above
			
			            fillScreen: function(){
			                this.node
			                    // match document dimensions
			                    .width($(document).width() + 'px')
			                    .height($(document).height() + 'px');
			                return this;
			            },
			            
			            create: function(){
				            var overlay = this;
				            this.node = $('<div></div>')
					            .addClass(ns() + ' ' + ns('overlay'))
					            .css({ // TODO: Should this be moved to a <style> element in the <head>, along with other CSS? (except opacity and bgColor, if different from default)
						            opacity:this.opacity,
						            backgroundColor:this.bgColor,
						            position:'absolute',
						            top:0,
						            left:0,
						            margin:0,
						            padding:0,
						            border:'0 none ' + this.bgColor
					            });
			                this.fillScreen();
			                
				            $(win).unload(function(){
					            overlay.unload();
				            });
				            $(this).triggerHandler('create');
				            return this;
			            },
			            
			            add: function(callback){
				            var overlay = this;
				            
				            if (callback){
				                $(overlay).one('add', callback);
				                return this.add();
				            }
				            
				            if (!this.node){
				                this.create();
				            }
				            
				            this.node
					            .hide()
					            .data(ns(), this) /* add the Overlay object as the value of the 'sqwidget' data property - NOTE: the data is attached to the add() method and added every time the overlay is inserted into the DOM, rather than being attached to the create() method, because jQuery automatically destroys data on removal from the DOM TODO: probably the actual Sqwidget instance object should go here */
					            .appendTo('body')
					            .fadeIn(function(){
						            $(overlay).triggerHandler('add');
					            });
				            return this;
			            },
			            
			            remove: function(){
				            var
				                overlay = this,
				                node = this.node;
				            
				            if (node){
				                node.fadeOut(function(){
					                $(this).remove();
					                $(overlay).triggerHandler('remove');
				                });
					        }
				            return this;
			            },
			            
			            unload: function(){
				            this.remove();
				            delete this.node;
				            $(this).triggerHandler('unload');
				            return this;
			            }
		            }
	            }
            ),

            Lightbox: $.extend(
	            function(){
		            var lb = this;
		
		            function centerHandler(){
		                lb.center();
		                lb.overlay.fillScreen();
		            }
		
		            $.extend(
			            this,
			            {
				            overlay: $.extend(
					            new Nitelite.Overlay(), // or $.lightbox.overlay()
					            {lightbox:this}
				            )
			            }
		            );
		
		            // Add handler to close the lightbox when the overlay is clicked
		            // We bind one('click') to every overlay.add(). We can't bind click() on overlay.create(), because jQuery automatically removes the click handler when the node is removed from the DOM and so, it wouldn't remain the next time the overlay is added back to the DOM
		            $(this.overlay)
		                .bind('add', function(){
			                this.node
				                .one('click', function(){
					                lb.close();
				                });
		                });
		                
		            $(this)
		                .bind('open', function(){
		                    $(win).resize(centerHandler);
		                })
		                .bind('close', function(){
		                    $(win).unbind('resize', centerHandler);
		                });
	            },
	            {
		            prototype: {
			            type: 'lightbox',
			            
			            center: function(){
			                var
			                    container = this.container,
			                    lbLeft, lbTop;
			                    
			                if (container){
			                    lbLeft = Math.floor(($(win).width() - container.width()) / 2) + $(document).scrollLeft();
			                        lbTop = Math.floor(($(win).height() - container.height()) / 2) + $(document).scrollTop();
			                        if (lbLeft < 0){
				                        lbLeft = 0;
			                        }
			                        if (lbTop < 0){
				                        lbTop = 0;
			                        }
			                        container  
			                            .css({
			                                left: lbLeft + 'px',
			                                top: lbTop + 'px'
			                            });
			                }
			                return this;
			            },
			            
			            open: function(contents){
			                var lb = this;
			                
			                this.overlay.add(function(){
			                    if (!lb.container){
			                        lb.container = $('<div></div>')
			                            .hide()
					                    .addClass(ns() + ' ' + ns([lb.type, 'container']))
					                    .css({ // TODO: Should this be moved to a <style> element in the <head>, along with other CSS?
						                    position:'absolute',
						                    margin:0,
						                    padding:0
						                    //,position:'fixed' // TODO: only do this if the contents fits within the window viewport, and what about scrolling the background contents? and IE6?
					                    });
					                $(win).unload(function(){
					                    lb.unload();
				                    });
		                        }
			                    lb.container
		                            .append(contents)
		                            .appendTo('body');
			                    lb
			                        .center() // TODO: Is this necessary?
			                        .container.show();
			                    lb.overlay.fillScreen();
			                    
				                $(lb).triggerHandler('open'); // TODO: The 'open' and 'close' events will fire before the overlay has finished fading in. Is that OK? Should triggerHandler() be called before overlay.add(); Is it better to have an 'openstart' and 'open' event, plus 'closestart' and 'close'?
				                lb.center();
			                });
			                
			                return this;
			            },
			            
			            close: function(handler, eventType){
			                var lb = this;
			                
			                // Assign a handler element (some kind of jQuery collection) to trigger.close()
			                if (typeof handler === 'object'){
			                    handler.bind(eventType || 'click', function(){
			                        lb.close();
			                    });
			                }
			                else {
				                this.overlay.remove();
				                this.container
				                    .empty()
				                    .remove();
				                $(this).triggerHandler('close');
				            }
				            return this;
			            },
			            
			            unload: function(){
				            this.close();
				            delete this.container;
				            $(this).triggerHandler('unload');
				            return this;
			            }
		            }
	            }
            )
        },
        
        // API
        api = $.extend(
            function(){
                var lb = new Nitelite.Lightbox();
                // Notify global window of internal events
                // This 'firehose' of Sqwidget events would allow innovation and loosely coupled plugins
                return notifyGlobalWindow(lb, ['create', 'add', 'remove', 'unload']);
            },
            {
                nitelite: version,
            
                overlay: function(){
                   var ov = new Nitelite.Overlay();
                   return notifyGlobalWindow(ov, ['open', 'close', 'remove', 'unload']);
                }
            }
        );
    
    // Assign jQuery.lightbox
    $.lightbox = api;
}(jQuery));

/*jslint onevar: true, browser: true, devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
