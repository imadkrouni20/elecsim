window.Storage = {
  KEY: 'elecsim_v2',
  _t: null,

  autosave: function(){
    if(Storage._t) clearTimeout(Storage._t);
    Storage._t = setTimeout(function(){ Storage.save(true); }, 900);
  },

  save: function(silent){
    try {
      var data = {
        version: 2,
        walls: W.walls.map(function(w){
          return { x:w.position.x, y:w.position.y, z:w.position.z,
                   w:w.geometry.parameters.width, h:w.geometry.parameters.height,
                   d:w.geometry.parameters.depth, rotY:w.rotation.y };
        }),
        lamps: CP.lights.map(function(l){
          return { id:l.id, x:l.mesh.position.x, y:l.mesh.position.y, z:l.mesh.position.z,
                   on:l.on, circuitId:l.circuitId };
        }),
        switches: CP.switches.map(function(s){
          return { id:s.userData.id, x:s.position.x, y:s.position.y, z:s.position.z,
                   rotY:s.rotation.y, linkedLampId:s.userData.linkedLampId };
        }),
        sockets: CP.sockets.map(function(s){
          return { id:s.userData.id, x:s.position.x, y:s.position.y, z:s.position.z, rotY:s.rotation.y };
        }),
        wires: W.wires.map(function(w){
          var a = w.userData.a, b = w.userData.b;
          if(!a||!b) return null;
          return { type:w.userData.wireType, section:w.userData.section||'1.5',
                   ax:a.x, ay:a.y, az:a.z, bx:b.x, by:b.y, bz:b.z };
        }).filter(Boolean),
        circuits: Circuits.list.map(function(c){
          return { id:c.id, name:c.name, breaker:c.breaker, on:c.on };
        }),
        nextL: CP.nextL, nextS: CP.nextS, nextP: CP.nextP, nextC: Circuits.nextId
      };
      localStorage.setItem(Storage.KEY, JSON.stringify(data));
      if(!silent) UI.toast(I18N.t('save')+' ✓', 'ok');
      return true;
    } catch(e){ UI.toast('save failed'); return false; }
  },

  load: function(){
    try {
      var raw = localStorage.getItem(Storage.KEY);
      if(!raw) return false;
      Storage.apply(JSON.parse(raw));
      return true;
    } catch(e){ return false; }
  },

  apply: function(data){
    Storage.clear();
    (data.walls||[]).forEach(function(w){
      var m = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), M.wall);
      m.position.set(w.x, w.y, w.z);
      m.rotation.y = w.rotY;
      m.castShadow = true; m.receiveShadow = true;
      m.userData.type = 'wall';
      W.scene.add(m); W.walls.push(m);
    });
    Circuits.nextId = data.nextC || 1;
    (data.circuits||[]).forEach(function(c){
      Circuits.list.push({ id:c.id, name:c.name, breaker:c.breaker, on:c.on !== false });
    });
    if(Circuits.list.length === 0) Circuits.add('Éclairage');
    CP.nextL = 1;
    (data.lamps||[]).forEach(function(l){
      var lamp = CP.addLamp(new THREE.Vector3(l.x, l.y, l.z));
      if(!lamp) return;
      lamp.id = l.id;
      CP.nextL = Math.max(CP.nextL, parseInt(l.id.replace('L',''))+1);
      CP.setLampCircuit(lamp, l.circuitId || Circuits.list[0].id);
      if(l.on){
        var c = Circuits.find(lamp.circuitId);
        if(c && c.on){ lamp.on = true; lamp.targetIntensity = lamp.intensityOn; lamp.targetEmissive = 1.6; lamp.targetHalo = 0.85; }
      }
    });
    CP.nextS = 1;
    (data.switches||[]).forEach(function(s){
      var sw = CP.addSwitch(new THREE.Vector3(s.x, s.y, s.z), s.rotY);
      if(!sw) return;
      sw.userData.id = s.id;
      CP.nextS = Math.max(CP.nextS, parseInt(s.id.replace('S',''))+1);
      if(s.linkedLampId){
        var lamp = CP.findLamp(s.linkedLampId);
        CP.linkSwitchToLamp(sw, lamp);
      } else {
        CP.setLabel(sw, sw.userData.id+'=>?', '#ff5555');
      }
    });
    CP.nextP = 1;
    (data.sockets||[]).forEach(function(s){
      var sk = CP.addSocket(new THREE.Vector3(s.x, s.y, s.z), s.rotY);
      if(sk){
        sk.userData.id = s.id;
        CP.nextP = Math.max(CP.nextP, parseInt(s.id.replace('P',''))+1);
      }
    });
    (data.wires||[]).forEach(function(w){
      CP.addWire(new THREE.Vector3(w.ax,w.ay,w.az), new THREE.Vector3(w.bx,w.by,w.bz), w.type, w.section);
    });
    History.clear();
  },

  clear: function(){
    W.walls.slice().forEach(function(m){ W.scene.remove(m); });
    W.walls.length = 0;
    W.wires.slice().forEach(function(m){ W.scene.remove(m); });
    W.wires.length = 0;
    CP.lights.slice().forEach(function(l){ W.scene.remove(l.light); W.scene.remove(l.mesh); });
    CP.lights.length = 0;
    CP.switches.slice().forEach(function(m){ W.scene.remove(m); });
    CP.switches.length = 0;
    CP.sockets.slice().forEach(function(m){ W.scene.remove(m); });
    CP.sockets.length = 0;
    Circuits.list.length = 0;
  },

  exportJSON: function(){
    Storage.save(true);
    var raw = localStorage.getItem(Storage.KEY);
    var blob = new Blob([raw], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'elecsim_project.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    UI.toast(I18N.t('exportJ')+' ✓', 'ok');
  },

  importJSON: function(){
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = function(){
      var f = inp.files[0]; if(!f) return;
      var r = new FileReader();
      r.onload = function(){
        try {
          var d = JSON.parse(r.result);
          Storage.apply(d); Storage.save(true);
          UI.toast(I18N.t('importJ')+' ✓', 'ok');
        } catch(e){ UI.toast('bad file'); }
      };
      r.readAsText(f);
    };
    inp.click();
  },

  resetAll: function(){
    UI.confirm(I18N.t('areUSure'), function(){
      localStorage.removeItem(Storage.KEY);
      location.reload();
    });
  }
};
