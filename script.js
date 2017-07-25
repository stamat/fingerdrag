$(document).ready(function(){
	$('.wrap .content a').on('click', function(){
		alert('TEST!!!');
	});

	var $wrap = $('.wrap');

    function Drag(e, element, limit, lock, debug) {
        this.element = null;
        this.startx = 0;
        this.starty = 0;
        this.direction = null;
        this.oldx = 0;
        this.oldy = 0;
        this.x = 0;
        this.y = 0;
        this.direction_old = null;
        this.dx = 0;
        this.dy = 0;
        this.movex = 0;
        this.movey = 0;
        this.endx = 0;
        this.endy = 0;
        this.width = 0;
        this.height = 0;
        this.lock = false;
        this.limit = 0;
        this.debug = false;
        this.blocked = false;

        this.block = function() {
            this.blocked = true;
        };

        this.unblock = function() {
            this.blocked = false;
        };

        this.calcRel = function(e) {
            var off = this.element.offset();
            var xy = {};

            if (!e.hasOwnProperty('pageX')) {

                if (e.originalEvent.touches.length) {
                    e = e.originalEvent.touches[0];
                } else {
                    e = e.originalEvent.changedTouches[0];
                }
            }

            xy.x = e.pageX - off.left;
            xy.y = e.pageY - off.top;
            return xy;
        };

        this.start = function(e, element, limit, lock, debug) {
            this.element = $(element);
            this.lock = lock !== undefined && lock;

            var xy = this.calcRel(e);

            this.startx = xy.x;
            this.starty = xy.y;
            this.oldx = xy.x;
            this.oldy = xy.y;

            this.width = this.element.width();
            this.height = this.element.height();

            this.limit = limit ? limit : this.width;
            this.debug = debug;
        };

        this.move = function(e) {
            if (this.blocked) {
                return;
            }

            var xy = this.calcRel(e);
            this.x = xy.x;
            this.y = xy.y;
            this.dx = this.oldx - xy.x;
            this.dy = this.oldy - xy.y;
            this.movex = this.startx - xy.x;
            this.movey = this.starty - xy.y;

            if (this.lock) {
                if (!this.direction) {
                    if (this.dx > 0) {
                        this.direction = 'right';
                    } else if (this.dx < 0) {
                        this.direction = 'left';
                    }
                }
            } else {
                if (this.dx > 0) {
                    this.direction = 'right';
                } else if (this.dx < 0) {
                    this.direction = 'left';
                }
            }

            if (this.direction_old && this.direction_old !== this.direction) {
                this.element.trigger('fingerdrag:change', this);
            }

            if (this.direction === 'right') {
                if (this.movex > this.limit || this.movex < 0) {
                    this.end();
                } else {
                    this.element.trigger('fingerdrag:right', this);
                }
            }

            if (this.direction === 'left') {
                if (this.movex < -1 * this.limit || this.movex > 0) {
                    this.end();
                } else {
                    this.element.trigger('fingerdrag:left', this);
                }
            }

            this.direction_old = this.direction;
            this.oldx = xy.x;
            this.oldy = xy.y;

            this.element.trigger('fingerdrag:move', this);

            if (this.debug) {
                var debug_arr = ['startx', 'x', 'movex', 'limit', 'direction'];
                for (var i = 0; i < debug_arr.length; i++) {
                    var key = debug_arr[i];
                    $('.'+key).html(this[key]);
                }
            }
        };

        this.end = function(e) {
            if (e) {
                var xy = this.calcRel(e);
                this.endx = xy.x;
                this.endy = xy.y;
            }
            this.element.data('fdrag', null);

            if (this.direction === 'right') {
                if (this.movex < this.limit) {
                    this.element.trigger('fingerdrag:fail', this);
                } else {
                    this.element.trigger('fingerdrag:success', this);
                }
            }

            if (this.direction === 'left') {
                if (this.movex > -1 * this.limit) {
                    this.element.trigger('fingerdrag:fail', this);
                } else {
                    this.element.trigger('fingerdrag:success', this);
                }
            }

            this.element.trigger('fingerdrag:end', this);
        };

        this.start(e, element, limit, lock, debug);
    }

	$wrap.on('tapstart', function(e) {
        if ($(this).hasClass('fingerdrag')) {
            return;
        }

        var fdrag = new Drag(e, this, 100, true, true);
        fdrag.elem_right = fdrag.element.find('.drag-overlay.right');
        fdrag.elem_left = fdrag.element.find('.drag-overlay.left');
        fdrag.element.data('fdrag', fdrag);
	});

    $wrap.on('fingerdrag:right', function(e, drag) {
        if (!drag.elem_right.hasClass('active')) {
            drag.elem_right.addClass('active');
        }

        drag.elem_right.find('.inner').css({'transform': 'translate3d('+(100 - drag.movex)+'px, 0, 0)'});
    });

    $wrap.on('fingerdrag:left', function(e, drag) {
        if (!drag.elem_left.hasClass('active')) {
            drag.elem_left.addClass('active');
        }
        var move = -1*(100 + drag.movex);
        drag.elem_left.find('.inner').css({'transform': 'translate3d('+move+'px, 0, 0)'});
    });

    $wrap.on('fingerdrag:success', function(e, drag){
        console.log('success');
        drag.block();

        if (drag.direction === 'right') {
            drag.elem_right.addClass('success-right');
            drag.elem_right.css('left', -drag.width);
        }

        if (drag.direction === 'left') {
            drag.elem_left.addClass('success-left');
            drag.elem_left.css('left', drag.width);
        }

        setTimeout(function(){
            drag.unblock();
            drag.elem_right.css('left', 0);
            drag.elem_left.css('left', 0);
            drag.elem_left.removeClass('success-left');
            drag.elem_right.removeClass('active');
            drag.elem_left.removeClass('active');
            drag.elem_right.removeClass('success-right');
            drag.element.removeClass('fingerdrag');
        }, 300);
	});

    $wrap.on('fingerdrag:fail', function(e, drag){
        console.log('fail');
        drag.block();

        if (drag.direction === 'right') {
            drag.elem_right.addClass('fail-right');
            drag.elem_right.css('left', drag.limit);
        }

        if (drag.direction === 'left') {
            drag.elem_left.addClass('fail-left');
            drag.elem_left.css('left', -drag.limit);
        }

        setTimeout(function(){
            drag.unblock();
            drag.elem_right.css('left', 0);
            drag.elem_left.css('left', 0);
            drag.elem_right.removeClass('fail-right');
            drag.elem_right.removeClass('active');
            drag.elem_left.removeClass('active');
            drag.elem_left.removeClass('fail-left');
            drag.element.removeClass('fingerdrag');
        }, 300);
	});

    $wrap.on('tapmove', function(e){
        var fdrag = $(this).data('fdrag');
        if (fdrag) {
            fdrag.move(e);
			if (!$(fdrag.element).hasClass('fingerdrag')) {
				fdrag.element.addClass('fingerdrag');
			}
        }
	});

    $wrap.on('tapend', function(e){
        var fdrag = $(this).data('fdrag');
        if (fdrag) {
            fdrag.end(e);
            //fdrag.elem_left.removeClass('active').hide();
        }
	});
});
