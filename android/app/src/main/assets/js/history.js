window.History = {
  stack: [], max: 30,
  push: function(){
    // snapshot
    try {
      var snap = JSON.stringify({
        walls: W.walls.map(function(w){return {x:w.position.x,y:w.position.y,z:w.position.z,w:w.geometry.parameters.width,h:w.geometry.parameters.height,d:w.geometry.parameters.depth,r:w.rotation.y};}),
        lamps: CP.lights.map(function(l){return {id:l.id,x:l.mesh.position.x,y:l.mesh.position.y,z:l.mesh.position.z,on:l.on,cid:l.circuitId};}),
        switches: CP.switches.map(function(s){return {id:s.userData.id,x:s.position.x,y:s.position.y,z:s.position.z,r:s.rotation.y,lid:s.userData.linkedLampId};}),
        sockets: CP.sockets.map(function(s){return {id:s.userData.id,x:s.position.x,y:s.position.y,z:s.position.z,r:s.rotation.y};}),
        wires: W.wires.map(function(w){var a=w.userData.a,b=w.userData.b; if(!a||!b)return null; return {t:w.userData.wireType,s:w.userData.section,ax:a.x,ay:a.y,az:a.z,bx:b.x,by:b.y,bz:b.z};}).filter(Boolean),
        circuits: Circuits.list.map(function(c){return {id:c.id,name:c.name,breaker:c.breaker,on:c.on};}),
        nextL: CP.nextL, nextS: CP.nextS, nextP: CP.nextP, nextC: Circuits.nextId
      });
      History.stack.push(snap);
      if(History.stack.length > History.max) History.stack.shift();
      UI.refreshHistoryButtons();
    } catch(e){}
  },
  undo: function(){
    if(History.stack.length < 2) return;
    History.stack.pop(); // current
    var prev = History.stack[History.stack.length-1];
    History._applySnap(JSON.parse(prev));
    History.stack.pop();
    History.push();
    UI.toast(I18N.t('undo'), 'info');
  },
  _applySnap: function(snap){
    W.walls.slice().forEach(function(m){ W.scene.remove(m); }); W.walls.length = 0;
    W.wires.slice().forEach(function(m){ W.scene.remove(m); }); W.wires.length = 0;
    CP.lights.slice().forEach(function(l){ W.scene.remove(l.light); W.scene.remove(l.mesh); }); CP.lights.length = 0;
    CP.switches.slice().forEach(function(m){ W.scene.remove(m); }); CP.switches.length = 0;
    CP.sockets.slice().forEach(function(m){ W.scene.remove(m); }); CP.sockets.length = 0;
    Circuits.list.length = 0;

    snap.walls.forEach(function(w){
      var m = new THREE.Mesh(new THREE.BoxGeometry(w.w,w.h,w.d), M.wall);
      m.position.set(w.x,w.y,w.z); m.rotation.y = w.r;
      m.castShadow = true; m.receiveShadow = true;
      m.userData.type = 'wall';
      W.scene.add(m); W.walls.push(m);
    });
    (snap.circuits||[]).forEach(function(c){ Circuits.list.push({id:c.id,name:c.name,breaker:c.breaker,on:c.on}); });
    CP.nextL = snap.nextL || 1; CP.nextS = snap.nextS || 1;
    CP.nextP = snap.nextP || 1; Circuits.nextId = snap.nextC || 1;

    snap.lamps.forEach(function(l){
      var lamp = CP.addLamp(new THREE.Vector3(l.x,l.y,l.z)); if(!lamp) return;
      lamp.id = l.id;
      if(l.cid) CP.setLampCircuit(lamp, l.cid);
      if(l.on){ lamp.on=true; lamp.targetIntensity=lamp.intensityOn; lamp.targetEmissive=1.6; lamp.targetHalo=0.85; }
    });
    snap.switches.forEach(function(s){
      var sw = CP.addSwitch(new THREE.Vector3(s.x,s.y,s.z), s.r); if(!sw) return;
      sw.userData.id = s.id;
      if(s.lid){
        var lamp = CP.findLamp(s.lid);
        CP.linkSwitchToLamp(sw, lamp);
      }
    });
    snap.sockets.forEach(function(s){
      var sk = CP.addSocket(new THREE.Vector3(s.x,s.y,s.z), s.r); if(!sk) return;
      sk.userData.id = s.id;
    });
    snap.wires.forEach(function(w){
      CP.addWire(new THREE.Vector3(w.ax,w.ay,w.az), new THREE.Vector3(w.bx,w.by,w.bz), w.t, w.s);
    });
  },
  clear: function(){ History.stack.length = 0; History.push(); }
};
