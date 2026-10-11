window.UI = {
  activeTab: 'tools',

  init: function(){
    UI.bindDock();
    UI.bindSide();
    UI.bindSheet();
    UI.bindModal();
    UI.refreshHistoryButtons();
    UI.openSheet('tools');
  },

  bindDock: function(){
    document.querySelectorAll('.dockbtn').forEach(function(b){
      b.addEventListener('click', function(){
        var tab = b.dataset.tab;
        document.querySelectorAll('.dockbtn').forEach(function(x){ x.classList.toggle('active', x === b); });
        UI.openSheet(tab);
      });
    });
  },

  bindSide: function(){
    var undo = document.getElementById('btnUndo');
    var redo = document.getElementById('btnRedo');
    var lang = document.getElementById('btnLang');
    if(undo) undo.addEventListener('click', function(){ History.undo(); });
    if(redo) redo.addEventListener('click', function(){ History.redo && History.redo(); });
    if(lang) lang.addEventListener('click', function(){
      var l = I18N.cycle();
      lang.textContent = l.toUpperCase();
      UI.openSheet(UI.activeTab);
    });
  },

  bindSheet: function(){
    // swipe down to close
    var sheet = document.getElementById('sheet');
    var startY = 0, curY = 0, dragging = false;
    sheet.addEventListener('touchstart', function(e){
      var t = e.changedTouches[0];
      if(t.clientY - sheet.getBoundingClientRect().top < 40){
        startY = t.clientY; dragging = true;
      }
    }, {passive:true});
    sheet.addEventListener('touchmove', function(e){
      if(!dragging) return;
      curY = e.changedTouches[0].clientY;
      if(curY - startY > 40){
        dragging = false;
        UI.closeSheet();
      }
    }, {passive:true});
    sheet.addEventListener('touchend', function(){ dragging = false; }, {passive:true});
  },

  bindModal: function(){
    document.getElementById('modalClose').addEventListener('click', function(){ UI.closeModal(); });
    document.getElementById('modal').addEventListener('click', function(e){
      if(e.target.id === 'modal') UI.closeModal();
    });
  },

  openSheet: function(tab){
    UI.activeTab = tab;
    document.querySelectorAll('.dockbtn').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === tab); });
    var title = document.getElementById('sheetTitle');
    var body = document.getElementById('sheetBody');
    document.getElementById('sheet').classList.add('show');
    if(tab === 'tools'){ title.textContent = I18N.t('tools'); UI.renderTools(body); }
    if(tab === 'electric'){ title.textContent = I18N.t('electric'); UI.renderElectric(body); }
    if(tab === 'board'){ title.textContent = I18N.t('board'); UI.renderBoard(body); }
    if(tab === 'project'){ title.textContent = I18N.t('project'); UI.renderProject(body); }
  },

  closeSheet: function(){
    document.getElementById('sheet').classList.remove('show');
  },

  // ===== Tools tab =====
  renderTools: function(body){
    body.innerHTML = '';
    var grid = document.createElement('div'); grid.className = 'toolgrid';
    var tools = [
      { t:'select', i:'🖱️', k:'select' },
      { t:'wall',   i:'🧱', k:'wall' },
      { t:'opening',i:'🚪', k:'opening' },
      { t:'move',   i:'✋', k:'move' },
      { t:'delete', i:'🗑️', k:'delete', cls:'danger' }
    ];
    tools.forEach(function(t){ grid.appendChild(UI.toolButton(t)); });
    body.appendChild(grid);
  },

  // ===== Electric tab =====
  renderElectric: function(body){
    body.innerHTML = '';
    var grid = document.createElement('div'); grid.className = 'toolgrid';
    var tools = [
      { t:'lamp',   i:'💡', k:'lamp' },
      { t:'switch', i:'🔘', k:'switch' },
      { t:'socket', i:'🔌', k:'socket' },
      { t:'wire',   i:'〰️', k:'wire' },
      { t:'link',   i:'🔗', k:'link', cls:'success' }
    ];
    tools.forEach(function(t){ grid.appendChild(UI.toolButton(t)); });
    body.appendChild(grid);

    var info = document.createElement('div');
    info.style.cssText = 'margin-top:14px;font-size:12px;color:#8fa6c8;line-height:1.7;padding:10px;background:rgba(20,26,44,.5);border-radius:12px';
    info.innerHTML = '<b style="color:#8fbfff">'+I18N.t('lamp')+':</b> '+CP.lights.length+
                     ' · <b style="color:#8fbfff">'+I18N.t('switch')+':</b> '+CP.switches.length+
                     ' · <b style="color:#8fbfff">'+I18N.t('socket')+':</b> '+CP.sockets.length;
    body.appendChild(info);
  },

  // ===== Board tab =====
  renderBoard: function(body){
    body.innerHTML = '';
    var tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:6px;margin-bottom:12px';
    ['circuits','check','stats'].forEach(function(k){
      var b = document.createElement('button');
      b.textContent = I18N.t(k);
      b.style.cssText = 'flex:1;padding:10px;border:none;border-radius:12px;font-weight:700;font-size:12px;color:#fff;'+
        'background:'+(UI._boardTab === k ? 'linear-gradient(160deg,#4a9dff,#2b7fff)' : 'rgba(60,68,90,.6)');
      b.onclick = function(){ UI._boardTab = k; UI.openSheet('board'); };
      tabs.appendChild(b);
    });
    body.appendChild(tabs);
    var tb = UI._boardTab || 'circuits';
    if(tb === 'circuits') UI.renderCircuits(body);
    if(tb === 'check') UI.renderCheck(body);
    if(tb === 'stats') UI.renderStats(body);
  },

  renderCircuits: function(body){
    // main
    var allOn = Circuits.list.every(function(c){return c.on;});
    var main = document.createElement('div'); main.className = 'row';
    main.innerHTML = '<span class="rk">'+I18N.t('mainBreaker')+'</span>';
    var mb = document.createElement('button');
    mb.textContent = allOn ? 'ON' : 'OFF';
    mb.style.cssText = 'padding:8px 18px;border:none;border-radius:10px;color:#fff;font-weight:700;background:'+(allOn?'linear-gradient(160deg,#2ecc71,#20a060)':'linear-gradient(160deg,#e74c3c,#a03030)');
    mb.onclick = function(){
      Circuits.list.forEach(function(c){ Circuits.setState(c, !allOn); });
      UI.openSheet('board');
    };
    main.appendChild(mb);
    body.appendChild(main);

    Circuits.list.forEach(function(c){
      var r = Circuits.analyze(c);
      var row = document.createElement('div');
      row.className = 'row status-'+r.status;
      var left = document.createElement('div');
      left.innerHTML = '<div class="rk">'+c.id+' <span style="color:#aaa;font-size:11px">'+c.breaker+'A</span></div>'+
                       '<div class="rv" style="margin-top:4px">⚡'+r.current.toFixed(2)+'A · 💡'+r.lamps+' · 📏'+r.length.toFixed(1)+'m · 📉'+r.dropPercent.toFixed(2)+'%</div>';
      row.appendChild(left);
      var tb = document.createElement('button');
      tb.textContent = c.on ? 'ON' : 'OFF';
      tb.style.cssText = 'padding:6px 14px;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:12px;background:'+(c.on?'linear-gradient(160deg,#2ecc71,#20a060)':'linear-gradient(160deg,#e74c3c,#a03030)');
      tb.onclick = function(){ Circuits.setState(c, !c.on); UI.openSheet('board'); };
      row.appendChild(tb);
      body.appendChild(row);

      r.issues.forEach(function(it){
        var iss = document.createElement('div');
        iss.style.cssText = 'font-size:11px;padding:6px 12px;color:'+(it.l==='danger'?'#ff7a7a':'#ffcc66');
        iss.textContent = (it.l==='danger'?'⚠ ':'! ')+it.t;
        body.appendChild(iss);
      });
    });

    var addB = document.createElement('button');
    addB.className = 'toolbtn';
    addB.style.cssText = 'width:100%;margin-top:8px';
    addB.textContent = I18N.t('addCircuit');
    addB.onclick = function(){ Circuits.add(); UI.openSheet('board'); };
    body.appendChild(addB);

    if(CP.lights.length){
      var sep = document.createElement('div'); sep.className='sectitle';
      sep.textContent = I18N.t('assignCircuits');
      body.appendChild(sep);
      CP.lights.forEach(function(l){
        var r = document.createElement('div'); r.className = 'row';
        r.innerHTML = '<span class="rk">'+l.id+'</span>';
        var sel = document.createElement('select');
        sel.style.cssText = 'padding:6px 10px;background:#222;color:#fff;border:1px solid #444;border-radius:8px';
        Circuits.list.forEach(function(c){
          var o = document.createElement('option');
          o.value = c.id; o.textContent = c.id;
          if(c.id === l.circuitId) o.selected = true;
          sel.appendChild(o);
        });
        sel.onchange = function(){ CP.setLampCircuit(l, sel.value); UI.openSheet('board'); };
        r.appendChild(sel);
        body.appendChild(r);
      });
    }
  },

  renderCheck: function(body){
    var reps = Circuits.analyzeAll();
    if(!reps.length){ body.innerHTML += '<div style="padding:14px;color:#aaa;text-align:center">'+I18N.t('noCircuits')+'</div>'; return; }
    var total = 0;
    reps.forEach(function(r){
      var row = document.createElement('div');
      row.className = 'row status-'+r.status;
      row.innerHTML = '<span class="rk">'+r.circuitId+'</span>';
      if(!r.issues.length){
        row.innerHTML += '<span style="color:#00cc66;font-size:12px">✓ OK</span>';
      } else {
        row.innerHTML += '<span style="color:#ff7a7a;font-size:12px">'+r.issues.length+' ⚠</span>';
      }
      body.appendChild(row);
      r.issues.forEach(function(it){
        var iss = document.createElement('div');
        iss.style.cssText = 'font-size:11px;padding:6px 12px;color:'+(it.l==='danger'?'#ff7a7a':'#ffcc66');
        iss.textContent = (it.l==='danger'?'⚠ ':'! ')+it.t;
        body.appendChild(iss);
        total++;
      });
    });
    var sum = document.createElement('div');
    sum.style.cssText = 'padding:14px;text-align:center;font-weight:700;margin-top:8px;color:'+(total?'#ff7a7a':'#00cc66');
    sum.textContent = total ? (total+' '+I18N.t('issues')) : I18N.t('allOk');
    body.appendChild(sum);
  },

  renderStats: function(body){
    var s = Circuits.stats();
    var grid = document.createElement('div'); grid.className = 'statgrid';
    [
      ['💡 '+I18N.t('lamp'), s.lamps],
      ['🔘 '+I18N.t('switch'), s.switches],
      ['🔌 '+I18N.t('socket'), s.sockets],
      ['🧱 '+I18N.t('wall'), s.walls],
      ['📏 طول الأسلاك', s.totalWireLength.toFixed(1)+' م'],
      ['⚙️ '+I18N.t('circuits'), s.circuits]
    ].forEach(function(it){
      var b = document.createElement('div'); b.className = 'statbox';
      b.innerHTML = '<div class="sl">'+it[0]+'</div><div class="sv">'+it[1]+'</div>';
      grid.appendChild(b);
    });
    body.appendChild(grid);

    var keys = Object.keys(s.wireBySection);
    if(keys.length){
      var sep = document.createElement('div'); sep.className = 'sectitle';
      sep.textContent = 'الأسلاك حسب المقطع';
      body.appendChild(sep);
      keys.forEach(function(k){
        var r = document.createElement('div'); r.className='row';
        r.innerHTML = '<span class="rk">'+k+' mm²</span><span class="rv">'+s.wireBySection[k].toFixed(1)+' م</span>';
        body.appendChild(r);
      });
    }
  },

  // ===== Project tab =====
  renderProject: function(body){
    body.innerHTML = '';
    var grid = document.createElement('div'); grid.className = 'toolgrid';
    [
      { i:'💾', k:'save', fn:function(){ Storage.save(); } },
      { i:'📤', k:'exportJ', fn:function(){ Storage.exportJSON(); } },
      { i:'📥', k:'importJ', fn:function(){ Storage.importJSON(); } },
      { i:'🔄', k:'reset', fn:function(){ Storage.resetAll(); }, cls:'danger' }
    ].forEach(function(it){
      var b = document.createElement('button');
      b.className = 'toolbtn '+(it.cls||'');
      b.innerHTML = '<span class="ti">'+it.i+'</span><span>'+I18N.t(it.k)+'</span>';
      b.onclick = it.fn;
      grid.appendChild(b);
    });
    body.appendChild(grid);

    var info = document.createElement('div');
    info.style.cssText = 'margin-top:14px;padding:12px;background:rgba(20,26,44,.5);border-radius:12px;font-size:12px;color:#8fa6c8;line-height:1.7';
    info.innerHTML = 'الإصدار 2.0<br>الحفظ التلقائي مفعّل';
    body.appendChild(info);
  },

  toolButton: function(t){
    var b = document.createElement('button');
    b.className = 'toolbtn '+(t.cls||'');
    if(Build.tool === t.t) b.classList.add('active');
    b.dataset.tool = t.t;
    b.innerHTML = '<span class="ti">'+t.i+'</span><span>'+I18N.t(t.k)+'</span>';
    b.onclick = function(){ Build.setTool(t.t); UI.updateToolPill(); };
    return b;
  },

  updateToolPill: function(){
    var p = document.getElementById('pillTool');
    if(!p) return;
    var map = {select:'🖱️', wall:'🧱', opening:'🚪', lamp:'💡', switch:'🔘', socket:'🔌', wire:'〰️', move:'✋', link:'🔗', delete:'🗑️'};
    p.textContent = (map[Build.tool]||'') + ' ' + I18N.t(Build.tool);
  },

  refreshSheet: function(){ if(document.getElementById('sheet').classList.contains('show')) UI.openSheet(UI.activeTab); },

  refreshHistoryButtons: function(){
    var u = document.getElementById('btnUndo');
    if(u) u.disabled = History.stack.length < 2;
  },

  // ===== Modal =====
  openModal: function(title, contentEl){
    document.getElementById('modalTitle').textContent = title;
    var mb = document.getElementById('modalBody');
    mb.innerHTML = '';
    if(typeof contentEl === 'string') mb.innerHTML = contentEl;
    else if(contentEl) mb.appendChild(contentEl);
    document.getElementById('modal').classList.add('show');
  },

  closeModal: function(){ document.getElementById('modal').classList.remove('show'); },

  openLinkMenu: function(sw){
    var wrap = document.createElement('div');
    var head = document.createElement('div');
    head.style.cssText = 'padding:10px 0;color:#8fbfff;font-weight:700;font-size:13px';
    head.textContent = 'ربط المفتاح ' + sw.userData.id;
    wrap.appendChild(head);

    if(CP.lights.length === 0){
      var e = document.createElement('div');
      e.style.cssText = 'color:#aaa;font-size:13px;padding:8px';
      e.textContent = I18N.t('noLamps');
      wrap.appendChild(e);
    } else {
      CP.lights.forEach(function(lamp){
        var b = document.createElement('button');
        b.className = 'toolbtn';
        b.style.cssText = 'width:100%;margin-bottom:8px;flex-direction:row;justify-content:space-between;padding:14px';
        b.innerHTML = '<span>💡 '+lamp.id+'</span><span style="color:'+(sw.userData.linkedLampId === lamp.id ? '#00ff88' : '#888')+'">'+(sw.userData.linkedLampId === lamp.id ? '✓ مرتبط' : '')+'</span>';
        if(sw.userData.linkedLampId === lamp.id) b.style.background = 'linear-gradient(160deg,rgba(50,180,90,.55),rgba(30,120,60,.6))';
        b.onclick = function(){
          CP.linkSwitchToLamp(sw, lamp);
          UI.closeModal();
          UI.toast('✓ '+sw.userData.id+' → '+lamp.id, 'ok');
        };
        wrap.appendChild(b);
      });
      if(sw.userData.linkedLampId){
        var ub = document.createElement('button');
        ub.className = 'toolbtn danger';
        ub.style.cssText = 'width:100%;flex-direction:row;justify-content:center;padding:14px';
        ub.innerHTML = '<span>🔓 فصل</span>';
        ub.onclick = function(){ CP.linkSwitchToLamp(sw, null); UI.closeModal(); };
        wrap.appendChild(ub);
      }
    }
    UI.openModal('ربط', wrap);
  },

  toast: function(msg, kind){
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = kind || '';
    t.style.display = 'block';
    clearTimeout(UI._tT);
    UI._tT = setTimeout(function(){ t.style.display = 'none'; }, 1800);
  },

  confirm: function(msg, onYes){
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:10px;text-align:center;font-size:14px;line-height:1.6';
    wrap.textContent = msg;
    var yes = document.createElement('button');
    yes.className = 'toolbtn danger';
    yes.style.cssText = 'width:100%;margin-top:14px;flex-direction:row;justify-content:center;padding:14px';
    yes.textContent = 'نعم، احذف';
    yes.onclick = function(){ UI.closeModal(); onYes(); };
    wrap.appendChild(yes);
    UI.openModal('تأكيد', wrap);
  }
};
