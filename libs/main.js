new Vue({
	el: '#app',
	data: {
		/*會員資料*/
		member: {
			account: '',
			chance: 3,
			dialogShow: false
		},
		/*中獎查詢*/
		search: {
			account: '',
			historyList: [],
			historyListTemp: [],
			dialogShow: false,
			resultShow: 0 //查詢結果，0:初始、1:有資料、2:無資料
		},		
		lotteryProcess: 0,//抽獎流程，0:初始、1:顯示結果
		prize: "", //獎項
		prizeType: 0,//獎項類型，0:初始、1:有獎、2:謝謝參加
		pageStatus: '', //活動狀態
		activeTimeShow: { //活動倒數時間顯示
			day: '0',
			hour: '0',
			minute: '0',
			seconds: '0'
		},
		activeTime: { //活動時間資料處理
			nowTime: '',
			endTime: '',
			next_start_time: ''
		},
		activeTimeInterval: { //活動倒數時間
			nowTime: '',
			endTime: ''
		},
		checkUserLock: false, //按鍵鎖
		luck:{}, //獎項格子設置
	},
	created: function () {
		this.getActivityStatus();

		this.luck={
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
				};
			},				
			roll:function(){
				var index = this.index;
				var count = this.count;
				var luck = this.obj;
				$(luck).find(".luck-unit-"+index).removeClass("active");
				index += 1;
				if (index>count-1) {
					index = 0;
				};
				$(luck).find(".luck-unit-"+index).addClass("active");
				this.index=index;
				return false;
			},
			stop:function(index){
				this.prize=index;
				return false;
			}
		};
	},
	mounted: function () {
		this.luck.init('luck');
	},
	watch:{
		"member.dialogShow": function () {
			if(!this.member.dialogShow) this.member.account = "";
		}
	},
	methods: {
		//轉格子
		roll: function () {
			var vm = this;				
			this.luck.times += 1;
			this.luck.roll();

			//顯示抽獎結果
			if (this.luck.times > this.luck.cycle+10 && this.luck.prize==this.luck.index) {					
				clearTimeout(this.luck.timer);
				this.luck.prize=-1;
				this.luck.times=0;
				this.prize = $('.luck-unit-'+this.luck.index).find('span').text(); //取得html上的獎項名稱

				var date = new Date();
				this.search.historyListTemp.push({ //新增中獎記錄
					gift_name: this.prize,
					payout_status: (this.luck.index!=17)?"未領取":"-",
					pick_up_time: date.getFullYear()+"-"+(date.getMonth()+1)+ "-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
				})

				var music = document.getElementById("music_rotate");
				music.pause();
				music.currentTime = 0;
				setTimeout(function(){
					document.getElementById("music_win").play();
					vm.lotteryProcess = 1;
					vm.checkUserLock = false;
				},100);
			}else{
				document.getElementById("music_rotate").play();
				if (this.luck.times<this.luck.cycle) {
					//抽到前加速
					this.luck.speed -= 10;
				}else if(this.luck.times==this.luck.cycle) {
					//抽獎
					this.startLottery();
				}else{
					//抽到後減速
					if (this.luck.times > this.luck.cycle+10 && ((this.luck.prize==0 && this.luck.index==7) || this.luck.prize==this.luck.index+1)) {
						this.luck.speed += 110;
					}else{
						this.luck.speed += 20;
					}
				}
				if (this.luck.speed<40) {
					this.luck.speed=40;
				};
				
				this.luck.timer = setTimeout(this.roll,this.luck.speed);
			}
			return false;
		},
		//彈出輸入會員
		userLogin: function () {
			if(this.pageStatus=='in_time' && this.checkUserLock == false)
				this.member.dialogShow = true;
		},
		//檢查帳戶輸入
		checkUser: function () {
			var vm = this, account;
			account = vm.member.account;
			if (vm.verification(account, "會員帳號") == false) return false;
			if (vm.checkUserLock == false) {
				vm.checkUserLock = true;
				if (account == "shanie") {
					if (vm.member.chance > 0) {
						// alert("您剩餘 "+vm.member.chance+" 次抽獎機會");
						vm.member.chance -= 1;
						console.log("剩餘抽獎次數："+vm.member.chance);
						vm.member.dialogShow = false;
						vm.luck.speed=100;
						vm.roll(); //開始旋轉
					} else {
						alert("您的抽獎次數已經用完啦!");
						vm.checkUserLock = false;
					}
				}else{
					alert("您的帳號無法參與活動!");
					vm.checkUserLock = false;
				}
			}
		},
		//開紅包
		startLottery: function () {
			var vm = this, account;
			account = this.member.account;
			vm.luck.prize = Math.random()*(this.luck.count)|0; //停止位置
			vm.prizeType = (vm.luck.prize != 17)? 1 : 2; //1=有獎，2=謝謝參加
		},
		//關閉抽獎彈窗
		closeLotteryDialog: function () {
			this.lotteryProcess = 0;
			this.member.account = ""; //清空會員帳號
			// this.member.chance = 0; //清空抽獎次數
			this.prize = ""; //清空獎項
			this.prizeType = 0;//初始化狀態
		},
		//中獎查詢
		searchRecords: function () {
			this.search.historyList = (this.search.account == "shanie")? this.search.historyListTemp : [];
			this.search.resultShow = (this.search.historyList.length > 0)? 1 : 2;
		},
		closeSearchDialog: function () {
			this.search.dialogShow = false;		
			this.search.account = '';//清空查詢帳號
			this.search.historyList = [];//清空查詢資料
			this.search.resultShow = 0;//初始化			
		},
		//活動狀態
		getActivityStatus: function () {
			var vm = this;
			var endTime = "2023-06-30 23:59:59";
			vm.activeTime.nowTime = new Date(); //當前時間
			vm.activeTime.endTime = new Date(endTime); //結束時間
			vm.pageStatus = 'in_time';
			vm.activeTimeInterval.nowTime = setInterval(function () { vm.getActiveTime('ing') }, 1000);
		},
		//取得進行中時間
		getActiveTime: function (type) {
			var vm = this;
			var t_s = vm.activeTime.nowTime.getTime();
			var NowTime = vm.activeTime.nowTime.setTime(t_s + 1000);
			var t = '';
			if (type == 'ing') {
				t = vm.activeTime.endTime - NowTime;
				if (t < 0) {
					clearInterval(vm.activeTimeInterval.nowTime);
					vm.pageStatus = 'activity_close';
					return;
				}
			} else if (type == 'next_time') {
				t = vm.activeTime.next_start_time - NowTime;
				if (t < 0) {
					clearInterval(vm.activeTimeInterval.endTime);
					vm.pageStatus = 'activity_close';
					return;
				}
			}
			var d = Math.floor(t / 1000 / 60 / 60 / 24);
			var h = Math.floor(t / 1000 / 60 / 60 % 24);
			var m = Math.floor(t / 1000 / 60 % 60);
			var s = Math.floor(t / 1000 % 60);
			vm.activeTimeShow.day = d;
			vm.activeTimeShow.hour = h;
			vm.activeTimeShow.minute = m;
			vm.activeTimeShow.seconds = s;
		},	
		//驗證輸入是否有不符規定的文字
		verification: function (data, field) {
			if (data == "") {
				alert(field + '不能為空!');
				return false;
			}
			
			//判斷是否只有英文、數字與-_
			var regex = /^[\w-]{1,}$/g;
			var check = regex.test(data);
			if (!check) {
				alert(field + "只允許輸入英文、數字、_、-");
				return false;
			}
		},
	},		
});
