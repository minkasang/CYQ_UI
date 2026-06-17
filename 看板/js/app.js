const {createApp}=Vue;

createApp({
  data(){
    const d=window.看板数据||{};
    return{
      project:d.项目||{},
      specs:d.规范列表||[],
      todos:d.待办||{阻塞:[],待处理:[],已完成:[]},
      feeds:d.最近动态||[],
      quicks:d.快捷入口||[],
      search:'',
      filter:'全部',
      collapsed:{specs:false,todos:false,feed:false,inspo:false},
      // 灵感墙
      inspos:JSON.parse(localStorage.getItem('inspo_notes')||'[]'),
      newInspoText:'',
      newInspoColor:'pink',
      // 数字动画
      animReady:false,
      // 壁纸
      lg:null,
      wallpapers:[
        {name:'紫蓝流体',url:'wallpapers/purple-blue-fluid.jpg'},
        {name:'粉紫晕染',url:'wallpapers/pink-purple.jpg'},
        {name:'山脉',url:'wallpapers/mountains.jpg'},
        {name:'蓝绿漩涡',url:'wallpapers/blue-green-swirl.jpg'},
        {name:'彩虹油墨',url:'wallpapers/rainbow-ink.jpg'},
        {name:'极光',url:'wallpapers/aurora.jpg'},
        {name:'深蓝液态',url:'wallpapers/deep-blue.jpg'},
        {name:'星空',url:'wallpapers/stars.jpg'},
        {name:'金橙交融',url:'wallpapers/gold-orange.jpg'},
        {name:'海洋',url:'wallpapers/ocean.jpg'},
        {name:'极光默认',url:'wallpapers/aurora-default.jpg'},
      ],
      showWallpaperPanel:false,
      // Markdown 预览
      showPreview:false,
      previewTitle:'',
      previewContent:'',
      previewLoading:false,
      // 文字毛玻璃衬底开关
      textGlass:true,
      // 左侧导航
      showSideNav:false,
      // 液态玻璃调参
      showGlassCtrl:false,
      // 文件浏览器
      showFileBrowser:false,
      fileBrowserPath:'',
      fileBrowserDirs:[],
      fileBrowserFiles:[],
      fileBrowserBread:[],
      fileBrowserLoading:false,
      glassParams:{
        blurAmount:{label:'模糊强度',type:'range',val:0,min:0,max:30,step:0.5},
        refraction:{label:'折射强度',type:'range',val:0.69,min:0,max:2,step:0.01},
        chromAberration:{label:'色散强度',type:'range',val:0.05,min:0,max:0.5,step:0.01},
        edgeHighlight:{label:'边缘高光',type:'range',val:0.05,min:0,max:1,step:0.01},
        specular:{label:'镜面反射',type:'range',val:0,min:0,max:2,step:0.01},
        fresnel:{label:'菲涅尔效应',type:'range',val:1,min:0,max:3,step:0.01},
        distortion:{label:'扭曲强度',type:'range',val:0,min:0,max:1,step:0.01},
        cornerRadius:{label:'圆角大小',type:'range',val:65,min:0,max:100,step:1},
        zRadius:{label:'深度半径',type:'range',val:40,min:0,max:100,step:1},
        opacity:{label:'不透明度',type:'range',val:1,min:0,max:1,step:0.01},
        saturation:{label:'饱和度',type:'range',val:0,min:-1,max:1,step:0.01},
        tintStrength:{label:'色调强度',type:'range',val:0,min:0,max:1,step:0.01},
        brightness:{label:'亮度',type:'range',val:0,min:-1,max:1,step:0.01},
        shadowOpacity:{label:'阴影不透明度',type:'range',val:0.3,min:0,max:1,step:0.01},
        shadowSpread:{label:'阴影扩散',type:'range',val:10,min:0,max:40,step:1},
        shadowOffsetY:{label:'阴影偏移Y',type:'range',val:1,min:-20,max:20,step:1},
        floating:{label:'浮动模式',type:'toggle',val:false},
        button:{label:'按钮模式',type:'toggle',val:false},
        bevelMode:{label:'斜面模式',type:'range',val:0,min:0,max:1,step:1}
      }
    }
  },

  computed:{
    filteredSpecs(){
      let list=this.specs;
      if(this.filter==='风险') list=list.filter(s=>s.风险);
      else if(this.filter!=='全部') list=list.filter(s=>s.分类===this.filter);
      if(this.search){
        const q=this.search.toLowerCase();
        list=list.filter(s=>s.名称.toLowerCase().includes(q)||(s.风险&&s.风险.toLowerCase().includes(q)));
      }
      return list;
    },
    riskCount(){return this.specs.filter(s=>s.风险).length},
    healthScore(){
      const p=this.project;
      if(!p.规范总数)return 0;
      let s=0;
      s+=(p.规范初稿完成/p.规范总数)*40;
      s+=(1-this.riskCount/p.规范总数)*35;
      s+=p.阻塞项===0?25:Math.max(0,25-p.阻塞项*8);
      return Math.round(s);
    },
    healthColor(){
      const s=this.healthScore;
      return s>=80?'#30d158':s>=50?'#ff9f0a':'#ff453a';
    },
    healthBarWidth(){return Math.min(100,Math.max(0,this.healthScore))+'%'},
    filteredTodosBlock(){
      if(!this.search)return this.todos.阻塞||[];
      const q=this.search.toLowerCase();
      return (this.todos.阻塞||[]).filter(t=>t.标题.toLowerCase().includes(q)||t.描述.toLowerCase().includes(q));
    },
    filteredTodosDoing(){
      if(!this.search)return this.todos.进行||[];
      const q=this.search.toLowerCase();
      return (this.todos.进行||[]).filter(t=>t.标题.toLowerCase().includes(q)||t.描述.toLowerCase().includes(q));
    },
    filteredTodosPending(){
      if(!this.search)return this.todos.待处理||[];
      const q=this.search.toLowerCase();
      return (this.todos.待处理||[]).filter(t=>t.标题.toLowerCase().includes(q)||t.描述.toLowerCase().includes(q));
    }
  },

  async mounted(){
    setTimeout(()=>this.animReady=true,100);
    // 加载任务清单（同步执行）
    if(window.加载任务清单){
      window.加载任务清单();
      // 创建新对象引用，强制 Vue 重新渲染
      const d=window.看板数据.待办;
      this.todos={阻塞:[...d.阻塞],进行:[...d.进行],待处理:[...d.待处理],已完成:[...d.已完成]};
      this.feeds=[...window.看板数据.最近动态];
    }
    // 初始化液态玻璃面板（统计卡片）
    await this.$nextTick();
    if(window.LiquidGlass){
      let bgUrl = this.wallpapers[0].url;
      document.body.style.background = `url(${bgUrl}) center/cover no-repeat fixed`;
      this.lg=new window.LiquidGlass(bgUrl);
      await this.lg.init();
      const cards=this.$refs.lgCard;
      if(cards&&cards.length){
        cards.forEach(el=>this.lg.addPanel(el,{
          cornerRadius:20
        }));
      }
      // 给大面板添加玻璃效果
      const panelDefs=[
        {el:this.$refs.lgPanelHealth,r:24},
        {el:this.$refs.lgPanelSpecs,r:40},
        {el:this.$refs.lgPanelTodos,r:40},
        {el:this.$refs.lgPanelQuick,r:40},
        {el:this.$refs.lgPanelFeed,r:40},
        {el:this.$refs.lgPanelInspo,r:40}
      ];
      panelDefs.forEach(p=>{if(p.el)this.lg.addPanel(p.el,{cornerRadius:p.r})});
      this.lg.start();
    }
  },

  methods:{
    toggle(key){this.collapsed[key]=!this.collapsed[key]},
    openFile(path,title){
      if(!path)return;
      if(path.endsWith('.md')){
        this.loadFile(path,title||path.split('/').pop());
      }else if(path.endsWith('/')){
        // 目录暂时尝试新标签打开
        window.open(path,'_blank');
      }else{
        window.open(path,'_blank');
      }
    },
    async loadFile(path,title){
      this.previewTitle=title||path;
      this.showPreview=true;
      this.previewLoading=true;
      try{
        const res=await fetch(path);
        if(!res.ok)throw new Error('加载失败');
        const md=await res.text();
        this.previewContent=window.marked?window.marked.parse(md):'<pre>'+md.replace(/</g,'&lt;')+'</pre>';
      }catch(e){
        this.previewContent='<div style="color:#ff453a;padding:20px">无法加载文件，请确认文件路径正确。<br><code style="opacity:.7">'+path+'</code></div>';
      }
      this.previewLoading=false;
    },
    closePreview(){this.showPreview=false;},
    scrollTo(key){
      const el=document.getElementById('sec-'+key);
      if(el){el.scrollIntoView({behavior:'smooth',block:'start'});this.showSideNav=false;}
    },
    async setWallpaper(url){
      document.body.style.background = `url(${url}) center/cover no-repeat fixed`;
      if(this.lg) await this.lg.changeBg(url);
      this.showWallpaperPanel=false;
    },
    addInspo(){
      if(!this.newInspoText.trim())return;
      this.inspos.unshift({id:Date.now(),text:this.newInspoText,color:this.newInspoColor});
      this.newInspoText='';
      this.saveInspo();
    },
    delInspo(id){
      this.inspos=this.inspos.filter(n=>n.id!==id);
      this.saveInspo();
    },
    saveInspo(){localStorage.setItem('inspo_notes',JSON.stringify(this.inspos))},
    aiInspo(){
      const tips=[
        {text:"NPC应该能记住玩家上个月做过的坏事",color:"pink"},
        {text:"给每个NPC加一个'秘密'字段，影响其社交行为",color:"blue"},
        {text:"天气系统应该影响NPC的情绪，下雨天更忧郁",color:"yellow"},
        {text:"考虑加入'谣言传播'机制，信息会失真",color:"pink"},
        {text:"NPC死亡时，其知识应该部分传给子女",color:"green"}
      ];
      const t=tips[Math.floor(Math.random()*tips.length)];
      this.inspos.unshift({id:Date.now(),text:t.text,color:t.color});
      this.saveInspo();
    },
    exportInspo(){
      const blob=new Blob([JSON.stringify(this.inspos,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='灵感数据.json';
      a.click();
    },
    fmtDate(){return new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})},
    updateGlassParam(key){
      if(!this.lg)return;
      const p=this.glassParams[key];
      const overrides={};
      overrides[key]=p.val;
      this.lg.updateConfig(overrides);
    },
    resetGlassParams(){
      const defaults=window.LiquidGlass?window.LiquidGlass.DEFAULTS:{};
      for(const key in this.glassParams){
        const p=this.glassParams[key];
        if(defaults[key]!==undefined) p.val=defaults[key];
      }
      if(this.lg) this.lg.updateConfig(defaults);
    },
    // ---- 文件浏览器 ----
    async openFileBrowser(){
      this.showFileBrowser=!this.showFileBrowser;
      if(this.showFileBrowser && !this.fileBrowserDirs.length && !this.fileBrowserFiles.length){
        await this.loadFileBrowserList(this.fileBrowserPath||'');
      }
    },
    async navigateFileBrowser(path){
      this.fileBrowserPath=path;
      await this.loadFileBrowserList(path);
    },
    async loadFileBrowserList(dirPath){
      this.fileBrowserLoading=true;
      try{
        const url='/api/list?dir='+encodeURIComponent(dirPath||'');
        const res=await fetch(url);
        if(!res.ok)throw new Error('HTTP '+res.status);
        const data=await res.json();
        if(!data.ok)throw new Error(data.error);
        // 分离目录和文件
        this.fileBrowserDirs=(data.items||[]).filter(i=>i.type==='dir'&&!i.name.startsWith('.'));
        this.fileBrowserFiles=(data.items||[]).filter(i=>i.type==='file');
        // 构建面包屑
        const segs=[{name:'根目录',path:''}];
        if(dirPath){
          const parts=dirPath.split('/');
          let acc='';
          for(const p of parts){
            if(!p)continue;
            acc+=p+'/';
            segs.push({name:p,path:acc.replace(/\/$/,'')});
          }
        }
        this.fileBrowserBread=segs;
      }catch(e){
        this.fileBrowserDirs=[];
        this.fileBrowserFiles=[{name:'加载失败: '+e.message,path:'',size:0}];
      }
      this.fileBrowserLoading=false;
    },
    async openFromFileBrowser(file){
      if(!file||!file.path)return;
      if(file.path.endsWith('.md')){
        // 通过 API 读取 Markdown
        try{
          this.previewTitle=file.name;
          this.showPreview=true;
          this.previewLoading=true;
          const res=await fetch('/api/read?path='+encodeURIComponent(file.path));
          const data=await res.json();
          if(!data.ok)throw new Error(data.error);
          this.previewContent=window.marked?window.marked.parse(data.content):'<pre>'+data.content.replace(/</g,'&lt;')+'</pre>';
        }catch(e){
          this.previewContent='<div style="color:#ff453a;padding:20px">读取失败: '+e.message+'</div>';
        }
        this.previewLoading=false;
      }else if(file.path.endsWith('.json')||file.path.endsWith('.js')){
        // 代码文件也通过 API 读取
        try{
          this.previewTitle=file.name;
          this.showPreview=true;
          this.previewLoading=true;
          const res=await fetch('/api/read?path='+encodeURIComponent(file.path));
          const data=await res.json();
          if(!data.ok)throw new Error(data.error);
          this.previewContent='<pre style="white-space:pre-wrap;font-size:13px;color:#ccc">'+data.content.replace(/</g,'&lt;')+'</pre>';
        }catch(e){
          this.previewContent='<div style="color:#ff453a;padding:20px">读取失败: '+e.message+'</div>';
        }
        this.previewLoading=false;
      }else{
        window.open(file.path,'_blank');
      }
    }
  }
}).mount('#app');
