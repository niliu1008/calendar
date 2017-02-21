!(function($) {
    "use strict"; // jshint ;_;

    var selectionIndex = 1;
    var print = function(object) {
        for (var key in object) {
            console.log(key + ": " + object[key]);
        }
    }

    var timeStringMap = {
        0: '0:00',
        1: '0:30',
        2: '1:00',
        3: '1:30',
        4: '2:00',
        5: '2:30',
        6: '3:00',
        7: '3:30',
        8: '4:00',
        9: '4:30',
        10: '5:00',
        11: '5:30',
        12: '6:00',
        13: '6:30',
        14: '7:00',
        15: '7:30',
        16: '8:00',
        17: '8:30',
        18: '9:00',
        19: '9:30',
        20: '10:00',
        21: '10:30',
        22: '11:00',
        23: '11:30',
        24: '12:00',
        25: '12:30',
        26: '13:00',
        27: '13:30',
        28: '14:00',
        29: '14:30',
        30: '15:00',
        31: '15:30',
        32: '16:00',
        33: '16:30',
        34: '17:00',
        35: '17:30',
        36: '18:00',
        37: '18:30',
        38: '19:00',
        39: '19:30',
        40: '20:00',
        41: '20:30',
        42: '21:00',
        43: '21:30',
        44: '22:00',
        45: '22:30',
        46: '23:00',
        47: '23:30'
    }
   

    function removeFromArray(arrayOfObjects, toBeDelete) {
    	for(var i = 0; i < arrayOfObjects.length; i++) {
		    var obj = arrayOfObjects[i];

		    if(toBeDelete.indexOf(obj.id) !== -1) {
		        arrayOfObjects.splice(i, 1);
		    }
		}
    }

    function OccupiedVo(v) {
        this.id = v.id;
        this.roomInfoId = v.roomInfoId;
        this.startTime = v.startTime;
        this.endTime = v.endTime;
        this.content = v.content;
        this.startGrid = v.startGrid;
        this.interval = v.interval;
    }

    function DateCapture(element, options) {
        this.init(element, options);
    }


    DateCapture.prototype = {
        init: function(element, options) {
            this.options = $.extend({}, $.fn.dateCapture.defaults, options);
            this.$element = $(element);
            this.day = new Date();
            // this.hasLoad = false; //此标志用于控制绑定事件。若没有load数据，则onmousedown事件将无效
            this.relativeModal = $(this.options.targetModal);

            this.selectionCache = {};

            this.render();
            this.loadData(); //由用户点击加载
            this.listen();
        },
        render: function() {
        	var dateContainer = $("<div class='dateContainer'></div>");
            var gridContainer = $("<div></div>");
            gridContainer.addClass("gridcontainer").append(this.buildTable());

            //empty the outter most container then add the listContainer inside.
            this.$element.empty().append(dateContainer).append(gridContainer);

            //自定义名称显示
            if(this.options.roomName) {
                var nameContainer = $("<div class='dateContainer'><span>名称：</span><span>"+this.options.roomName+"</span></div>");
                dateContainer.append(nameContainer);
            }
        },
        buildTable: function() {
            var contentTable = $("<table></table>"),
                //thead = $("<thead><tr><th>时间</th><th>事件</th><th>事件</th><th>事件</th><th>事件</th><th>事件</th><th>事件</th><th>事件</th></tr></thead>"),
                tbody = $("<tbody><tr><td class='timeTd'></td><td class='eventTd tdA' ></td> <td class='eventTd' ></td><td class='eventTd' ></td><td class='eventTd' ></td><td class='eventTd' ></td><td class='eventTd' ></td><td class='eventTd' ></td><td class='eventTd' ></td></tr></tbody>"),
                tableContainerClass = this.options.tableClass;

            this.$gutter = $("<div class='tg-gutter'><div class='tg-gutter-hour-wrap'></div></div>");

            //构造时间显示列
            for (var i = this.options.startGrid; i < this.options.endGrid; i++) {
                $('td:first-child', tbody).append('<div class="tg-hour-part">' + timeStringMap[i] + '</div>');
                $(".tg-gutter-hour-wrap", this.$gutter).append("<div class='tg-hour-part noselect' data-tg-hour='" + i + "'></div>");
            }
            $('td:nth-child(2)', tbody).append(this.$gutter.clone());
            $('td:nth-child(3)', tbody).append(this.$gutter.clone());
            $('td:nth-child(4)', tbody).append(this.$gutter.clone());
            $('td:nth-child(5)', tbody).append(this.$gutter.clone());
            $('td:nth-child(6)', tbody).append(this.$gutter.clone());
            $('td:nth-child(7)', tbody).append(this.$gutter.clone());
            $('td:nth-child(8)', tbody).append(this.$gutter.clone());
             $('td:nth-child(9)', tbody).append(this.$gutter.clone());
            
            contentTable.addClass(tableContainerClass).append(tbody);
            return contentTable;
        },
        setDate: function(date) {
            this.options.date = date;
        },
        _getHourDesc: function(start, interval, withDay) {
            var result = {},
                end = (start + interval) > this.options.endGrid ? this.options.endGrid : (start + interval),
                time = timeStringMap[start] + '点 - ' + (timeStringMap[end]) + '点',
                day = new Date(this.options.date).format("yyyy年mm月dd日") + "，";
            result.start = start;
            result.desc = time;
            result.fullDesc = day + time;
            result.height = (end - start) * this.options.gridHeight;
            result.end = end;
            result.startTime = this.getDateTime(start);
            result.endTime = this.getDateTime(end);

            return result;
        },
        _getTop: function(startGrid) {
            return (startGrid - this.options.startGrid) * this.options.gridHeight;
        },
        _generateId: function() {
            return 'selection-' + selectionIndex++;
        },
        //创建选区
        createSelection: function(startGrid, interval, bussinessData,num_td) {
            var $selection = $("<div class='tg-selected-hour'><span class='dt'></span><span class='dd'></span><div class='resizer'></div></div>"),
                gutterWidth = $(".tg-gutter:eq("+num_td+")").width() - 20,
                selectionId = this._generateId();

            $selection.attr('id', selectionId);
            $selection.css({
                top: this._getTop(startGrid),
                width: gutterWidth,
            });

            var bd = bussinessData ? bussinessData : {
                'startGrid': startGrid,
                'interval': interval,
                'roomInfoId': this.options.roomInfoId
            };

            $selection.data("business-data", bd); //保存业务数据

            this.adjustSelection($selection, startGrid, interval);

            //填充内容
            $(".dd", $selection).html(bd ? bd.content : '');
            this.selectionCache[selectionId] = $selection;

            return $selection;
        },
        getDateTime: function(gridValue) {
            return this.options.date + " " + timeStringMap[gridValue] + ":00";
        },
        //调整选区
        adjustSelection: function($selection, startGrid, interval) {
            var selectionHourDesc = this._getHourDesc(startGrid, interval);
            $selection.css({
                height: selectionHourDesc.height
            });
            $selection.find(".dt").html(selectionHourDesc.desc);
            $selection.data('start-grid', startGrid);
            $selection.data('interval', interval);
            $selection.data('full-desc', selectionHourDesc.fullDesc);
            //同时需要更新 businessData
            $selection.data('business-data').startTime = selectionHourDesc.startTime;
            $selection.data('business-data').endTime = selectionHourDesc.endTime;
        },
        updateBusinessData: function($selection) {
            //更新业务数据
            var bdata = $selection.data("business-data");
            bdata.startGrid = $selection.data('start-grid');
            bdata.interval = $selection.data('interval');
            bdata.startTime = selectionHourDesc.startTime;
            bdata.endTime = selectionHourDesc.entTime;
        },
        _getGridCount: function(startY, endY) {
            return (endY <= startY) ? 1 : Math.round((endY - startY) / this.options.gridHeight) + 1;
        },
        listen: function(num_td) {
            if(!num_td){
                num_td = 0;
            }
            var self = this;
            var gutter = $(".tg-gutter:eq("+num_td+")");

            $('.noselect').on('selectstart dragstart', function(evt) {
                evt.preventDefault();
                return false;
            });

            gutter.on("mousedown", function(de) {

                var $target = $(de.target),
                    showModalParams = {};

                if ($target.hasClass('resizer')) { //调整大小
                    de.stopPropagation();

                    var $selection = $target.closest('.tg-selected-hour'),
                        startGrid = $selection.data('start-grid'),
                        startY = $selection.offset().top;
                    gutter.on("mousemove", function(me) {
                        var endY = me.pageY;
                        self.adjustSelection($selection, startGrid, self._getGridCount(startY, endY));
                    });
                    showModalParams.selectionId = $selection.attr('id');
                    showModalParams.isPersist = true;
                } else if ($target.hasClass('tg-selected-hour') || $target.parent('div.tg-selected-hour').length) { //这是编辑的状态
                    de.stopPropagation();
                    var $selection = $target.closest('.tg-selected-hour');

                    showModalParams.selectionId = $selection.attr('id');
                    showModalParams.isPersist = true;
                } else { //新增
                    var startGrid = $target.data("tg-hour"),
                        interval = 1,
                        $selection = self.createSelection(startGrid, interval,null, num_td),
                        startY = de.pageY;
                    gutter.append($selection);

                    gutter.on("mousemove", function(me) {
                        var endY = me.pageY;
                        self.adjustSelection($selection, startGrid, self._getGridCount(startY, endY));
                    });

                    showModalParams.selectionId = $selection.attr('id');
                    showModalParams.isPersist = false;
                }

                gutter.on("mouseup", function(ue) {
                    gutter.off("mousemove");
                    if (showModalParams && showModalParams.selectionId) {
                        self.onShowModal.call(self, showModalParams.selectionId, showModalParams.isPersist);
                    }
                    gutter.off("mouseup");
                });
            });

            //模态窗口关闭事件，如何区分关闭来源？？？？
            //关闭有好几种形态。1、右上角点击关闭，且是新创建选区，则删除选区
            //2、点击提交关闭时，需要更新选区的业务数据
            //3、点击删除关闭时，需要删除选区
            
            this.relativeModal.on('hidden.bs.modal', function(e) {
                var isPersist = self.relativeModal.data('is-persist'),
                    selectionId = self.relativeModal.data('selection-id');
                if (!isPersist) { //没有持久化则删除选区
                    self.deleteSelection(selectionId);
                }
            });

            //删除
            this.relativeModal.delegate('button[data-btn-type="delete"]', 'click', function(event) {
                var isPersist = self.relativeModal.data('is-persist'),
                    selectionId = self.relativeModal.data('selection-id'),
                    businessId = self.selectionCache[selectionId].data('business-data').id;

                if (!businessId) {
                	self.relativeModal.modal('hide');
                    self.deleteSelection(selectionId); //删除选区
                } else {
                	$.ajax({
                        url: self.options.deleteUrl,
                        type: 'post',
                        dataType: 'json',
                        data: {
                        	'roomOccupied.id': businessId
                        }
                    })
                    .done(function(data) {
                        self.relativeModal.modal('hide');
                        self.deleteSelection(selectionId); //删除选区

                        //更新关联日历里对应的元素
                        var relativeCal = self.relativeCalendar,
                        	$calContext = relativeCal.context;
                        if (relativeCal) {
                        	removeFromArray(relativeCal.options.events, businessId);
                        	$calContext.find("a[data-event-id='" + businessId + "']").remove();
                        }
                    })
                    .fail(function() {
                        alert("删除失败");
                    });
                }
            });

            //提交
            this.relativeModal.delegate('button[data-btn-type="submit"]', 'click', function(event) {
                var isPersist = self.relativeModal.data('is-persist'),
                    selectionId = self.relativeModal.data('selection-id');

                var formData = self.relativeModal.find('form').serialize();
                $.ajax({
                        url: self.options.saveUrl,
                        type: 'post',
                        dataType: 'json',
                        data: formData
                    })
                    .done(function(data) {
                        //更新成功后将数据设置成persist状态
                        self.relativeModal.data('is-persist', true);
                        self.relativeModal.modal('hide');

                        //更新选区业务数据
                        self.selectionCache[selectionId].find('.dd').html(data.content);
                        self.selectionCache[selectionId].data('business-data', new OccupiedVo(data));

                        //更新关联日历里对应的元素
                        var relativeCal = self.relativeCalendar,
                        	$calContext = relativeCal.context,
                            ocuppiedAnchor,
                            eventList;
                        if (relativeCal) {
                            if (isPersist) { //更新
                                removeFromArray(relativeCal.options.events, data.id);
                                relativeCal.options.events.push(data);
                                ocuppiedAnchor = $("[data-cal-date=" + self.options.date + "]").siblings('.events-list').find("a[data-event-id='" + data.id + "']");
                                ocuppiedAnchor && ocuppiedAnchor.attr('data-original-title', data.desc);
                            } else { //添加
                                relativeCal.options.events.push(data);
                                var ah = '<a href="javascript:void(0)" data-event-id="' + data.id + '" data-event-class="event-important"'
                                + 'class="pull-left event event-important" data-toggle="tooltip" data-original-tile="' + data.desc + '"></a>';
                                eventList = $("[data-cal-date=" + self.options.date + "]").siblings('.events-list');
                                if (eventList && eventList.length === 0) {
                                    eventList = $('<div class="events-list">').attr('data-cal-start', data.start).attr('data-cal-end', data.end);
                                    $("[data-cal-date=" + self.options.date + "]").append(eventList);
                                }
                                eventList.append(ah);
                                loadRight("meetingRoom!roomCalendar.hl",{"roomInfo.id":data.roomInfoId});
                            }
                        }
                    })
                    .fail(function() {
                        alert("更新失败");
                    });
            });
        },
        deleteSelection: function(selectionId) {
            this.selectionCache[selectionId].remove();
        },
        onShowModal: function(selectionId, isPersist) {
            var $selection = this.selectionCache[selectionId]
            var bussinessData = $selection.data("business-data");
            $("#timeLabel").html($selection.data('full-desc'));

            //填充表单数据
            var $form = this.relativeModal.find('form');
            if (bussinessData) {
            	$form.find("textarea[name='roomOccupied.content']").val(bussinessData.content || '');
            	$form.find("input[name='roomOccupied.id']").val(bussinessData.id || '');
            } else {
            	$form.find("textarea[name='roomOccupied.content']").val('');
            	$form.find("input[name='roomOccupied.id']").val('');
            }

            $form.find("input[name='roomOccupied.startTime']").val(bussinessData.startTime);
            $form.find("input[name='roomOccupied.endTime']").val(bussinessData.endTime);
            $form.find("input[name='roomOccupied.roomInfoId']").val(bussinessData.roomInfoId);

            this.relativeModal.data('selection-id', selectionId);
            this.relativeModal.data('is-persist', isPersist);
            this.relativeModal.modal({
                backdrop: 'static',
                keyboard: false
            });
        },
        clear: function() { //清除所有选区 和 对应的换成
            this.$gutter.find(".tg-selected-hour").remove();
            this.selectionCache = {};
        },
        setRelativeCalendar: function(calendar) {
        	this.relativeCalendar = calendar;
        },
        loadData: function(date) {
            var self = this;
            date && this.setDate(date);
            $.ajax({
                    url: this.options.loadUrl,
                    type: 'post',
                    dataType: 'json',
                    data: {
                    	'roomOccupied.roomInfoId': this.options.roomInfoId,
                        'roomOccupied.startTime': this.options.date
                    },
                })
                .done(function(data) {
                    self.clear();
                    self.$element.find('.date').html(self.options.date);
                    $.each(data, function(i, d) {
                        var s = self.createSelection(d.startGrid, d.interval, new OccupiedVo(d),0);
                        self.$gutter.append(s);
                    });
                })
                .fail(function() {
                	alert("加载数据失败");
                });
        }
    }

    $.fn.dateCapture = function(options) {
        var instance;
        instance = this.data('date-capture');
        var capture=null;

        /**
         *判断插件是否已经实例化过，如果已经实例化了则直接返回该实例化对象
         */
        if (!instance) {
            var date_Capture = new DateCapture(this, options);
            this.capture=function(){
                return date_Capture;
            }
            return this.each(function() {
                //将实例化后的插件缓存在dom结构里（内存里）

                return $(this).data('date-capture', date_Capture);
            });
        }
        if (options === true) {
            return instance;
        }

        if (typeof options === 'string') {
            if (instance[options]) {
                result = instance[options].apply(data, Array.prototype.slice.call(args, 1));
            } else {
                throw "Method " + option + " does not exist";
            }

        }
        return this;
    }

    $.fn.dateCapture.defaults = {
        gridHeight: 30,
        startGrid: 16,
        endGrid: 44,
        tableClass: 'table-condensed',
        roomInfoId: '1000',
        date: '2015-03-11',
        /*loadUrl: 'meetingRoom!loadCalendarData.hl',
        saveUrl: 'meetingRoom!operateRoomOccupied.hl',
        deleteUrl: 'meetingRoom!deleteRoomOccupied.hl',*/
        targetModal: '#calModal',
    };
})(jQuery);
