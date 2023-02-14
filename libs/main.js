const { createApp, ref, onMounted } = Vue
  
createApp({
	setup() {
		const search = ref({ //抽獎記錄查詢
			account: '', //會員帳號
			historyList: [], //查詢結果
			historyListTemp: [], //暫存抽獎記錄
			dialogShow: false, //彈窗顯示
			resultShow: 0, //查詢結果，0:初始、1:有資料、2:無資料
			closeSearchDialog: function () { //關閉彈窗
				search.value.dialogShow = false;
				search.value.account = '';
				search.value.historyList = [];
				search.value.resultShow = 0;
			},
			searchRecords: function () {
				search.value.historyList = (search.value.account == "shanie")? search.value.historyListTemp : [];
				search.value.resultShow = (search.value.historyList.length > 0)? 1 : 2;
			},
		})

		const activeTime = ref({ //活動時間資料處理
			nowTime: '', //當前時間
			endTime: '', //結束時間
			nextStartTime: '', //下次開始時間
			interval: { //活動倒數時間
				nowTime: '',
				endTime: ''
			},
			timeShow: { //活動倒數時間顯示
				day: '0',
				hour: '0',
				minute: '0',
				seconds: '0'
			},
			pageStatus: '', //活動狀態
			getActivityStatus: function () { //活動狀態
				var endTime = "2023-06-30 23:59:59";
				activeTime.value.nowTime = new Date();
				activeTime.value.endTime = new Date(endTime);
				activeTime.value.pageStatus = 'in_time';
				activeTime.value.interval.nowTime = setInterval(function () { activeTime.value.getActiveTime('ing') }, 1000);
			},
			getActiveTime: function (type) { //取得進行中時間
				var pastTime = activeTime.value.nowTime.getTime();
				var NowTime = activeTime.value.nowTime.setTime(pastTime + 1000);
				var timeLeft = '';
				if (type == 'ing') {
					timeLeft = activeTime.value.endTime - NowTime;
					if (timeLeft < 0) {
						clearInterval(activeTime.value.interval.nowTime);
						activeTime.value.pageStatus = 'activity_close';
						return;
					}
				} else if (type == 'next_time') {
					timeLeft = activeTime.value.nextStartTime - NowTime;
					if (timeLeft < 0) {
						clearInterval(activeTime.value.interval.endTime);
						activeTime.value.pageStatus = 'activity_close';
						return;
					}
				}
				var d = Math.floor(timeLeft / 1000 / 60 / 60 / 24);
				var h = Math.floor(timeLeft / 1000 / 60 / 60 % 24);
				var m = Math.floor(timeLeft / 1000 / 60 % 60);
				var s = Math.floor(timeLeft / 1000 % 60);
				activeTime.value.timeShow.day = d;
				activeTime.value.timeShow.hour = h;
				activeTime.value.timeShow.minute = m;
				activeTime.value.timeShow.seconds = s;
			},
		})

		activeTime.value.getActivityStatus();

		const member = ref({ //會員
			account: '', //會員帳號
			chance: 3, //抽獎次數
			dialogShow: false, //彈窗顯示
			checkUserLock: false, //按鍵鎖			
			userLogin: function () { //顯示會員登入彈窗
				if(activeTime.value.pageStatus=='in_time' && member.value.checkUserLock == false)
					member.value.dialogShow = true;
			},			
			checkUser: function () { //登入會員並開始抽獎
				const account = member.value.account;
				if (account == "") {
					alert("請輸入會員帳號");
					return false;
				}
				
				//判斷是否只有英文、數字與-_
				var regex = /^[\w-]{1,}$/g;
				var check = regex.test(account);
				if (!check) {
					alert("會員帳號只允許輸入英文、數字、_、-");
					return false;
				}

				if (member.value.checkUserLock == false) {
					member.value.checkUserLock = true;
					if (account == "shanie") {
						if (member.value.chance > 0) {
							// alert("您剩餘 "+member.value.chance+" 次抽獎機會");
							member.value.chance -= 1;
							console.log("剩餘抽獎次數："+member.value.chance);
							member.value.dialogShow = false;
							luck.value.speed=100;
							rotate(); //開始旋轉
						} else {
							alert("您的抽獎次數已經用完啦!");
							member.value.checkUserLock = false;
						}
					}else{
						alert("您的帳號無法參與活動!");
						member.value.checkUserLock = false;
					}
				}
			},
		})

		const luck = ref({ //獎項格子設置
			index:-1,	//當前轉動到哪個位置，起點位置
			count:0,	//總共有多少個位置
			timer:0,	//setTimeout的ID，用clearTimeout清除
			speed:20,	//初始轉動速度
			times:0,	//轉動次數
			cycle:50,	//轉動基本次數：即至少需要轉動多少次再進入抽獎環節
			prize:-1,	//中獎位置
			init:function(id){
				if ($("#"+id).find(".luck-unit").length>0) {
					$luck = $("#"+id);
					$units = $luck.find(".luck-unit");
					this.obj = $luck;
					this.count = $units.length;
					$luck.find(".luck-unit-"+this.index).addClass("active");
				}
			},				
			roll:function(){
				var index = this.index;
				var count = this.count;
				var luck = this.obj;
				$(luck).find(".luck-unit-"+index).removeClass("active");
				index += 1;
				if (index>count-1) index = 0;
				$(luck).find(".luck-unit-"+index).addClass("active");
				this.index=index;
				return false;
			},
			stop:function(index){
				this.prize=index;
				return false;
			}
		})

		const lottery = ref({ //抽獎
			process: 0,//抽獎流程，0:初始、1:顯示結果
			prize: "", //獎項
			prizeType: 0,//獎項類型，0:初始、1:有獎、2:謝謝參加
			startLottery: function () { //開紅包
				luck.value.prize = Math.random()*(luck.value.count)|0; //停止位置
				lottery.value.prizeType = (luck.value.prize != 17)? 1 : 2;
			},			
			closeLotteryDialog: function () { //關閉抽獎彈窗
				lottery.value.process = 0;				
				lottery.value.prize = ""; //清空獎項
				lottery.value.prizeType = 0;//初始化狀態
				member.value.account = ""; //清空會員帳號
			},
		})

		const rotate = () => { //轉格子
			luck.value.times += 1;
			luck.value.roll();
			
			if (luck.value.times > luck.value.cycle+10 && luck.value.prize==luck.value.index) {
				//顯示抽獎結果
				clearTimeout(luck.value.timer);
				luck.value.prize=-1;
				luck.value.times=0;
				lottery.value.prize = $('.luck-unit-'+luck.value.index).find('span').text(); //取得html上的獎項名稱

				var date = new Date();
				search.value.historyListTemp.push({ //新增中獎記錄
					gift_name: lottery.value.prize,
					payout_status: (luck.value.index!=17)?"未領取":"-",
					pick_up_time: date.getFullYear()+"-"+(date.getMonth()+1)+ "-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
				})

				var music = document.getElementById("music_rotate");
				music.pause();
				music.currentTime = 0;
				setTimeout(function(){
					document.getElementById("music_win").play();
					lottery.value.process = 1;
					member.value.checkUserLock = false;
				},100);
			}else{
				//開始轉動
				document.getElementById("music_rotate").play();
				if (luck.value.times<luck.value.cycle) {					
					luck.value.speed -= 10; //抽到前加速
				}else if(luck.value.times==luck.value.cycle) {					
					lottery.value.startLottery(); //抽獎
				}else{
					//抽到後減速
					if (luck.value.times > luck.value.cycle+10 && ((luck.value.prize==0 && luck.value.index==7) || luck.value.prize==luck.value.index+1)) {
						luck.value.speed += 110;
					}else{
						luck.value.speed += 20;
					}
				}				
				if (luck.value.speed<40) luck.value.speed=40; //最快速度為40
				luck.value.timer = setTimeout(rotate,luck.value.speed);
			}
		}

		onMounted(()=>{
			luck.value.init('luck');
		})

		return {
			search,
			activeTime,
			member,
			lottery,
		}
	}
}).mount('#app')