window.CP = { lights:[], switches:[], sockets:[], nextL:1, nextS:1, nextP:1 };
CP.MIN_LAMP_DIST = 1.0;

CP._glowTex = null;
CP.glow = function(){
  if(CP._glowTex) return CP._glowTex;
  var c = document.createElement('canvas'); c.width = 128; c.height = 128;
  var ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0, 'rgba(255,244,210,1)');
  g.addColorStop(0.35, 'rgba(255,224,150,0.7)');
  g.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  CP._glowTex = new THREE.CanvasTexture(c);
  return CP._glowTex;
};

CP.makeLabel = function(text, color){
  var c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  var ctx = c.getContext('2d');
  var r = 40;
  ctx.beginPath();
  ctx.moveTo(r, 20); ctx.lineTo(512-r, 20);
  ctx.quadraticCurveTo(492, 20, 492, 60); ctx.lineTo(492, 196);
  ctx.quadraticCurveTo(492, 236, 452, 236); ctx.lineTo(r, 236);
  ctx.quadraticCurveTo(20, 236, 20, 196); ctx.lineTo(20, 60);
  ctx.quadraticCurveTo(20, 20, r, 20); ctx.closePath();
  var grd = ctx.createLinearGradient(0, 20, 0, 236);
  grd.addColorStop(0, 'rgba(22,28,44,0.92)');
  grd.addColorStop(1, 'rgba(10,14,24,0.92)');
  ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = color || '#fff'; ctx.lineWidth = 8; ctx.stroke();
  ctx.fillStyle = color || '#fff';
  ctx.font = 'bold 110px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 138);
  var tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false, depthWrite:false, transparent:true, sizeAttenuation:true}));
  sp.scale.set(0.42, 0.21, 1);
  sp.renderOrder = 999;
  return sp;
};

CP.setLabel = function(mesh, text, color){
  if(mesh.userData.labelSprite) mesh.remove(mesh.userData.labelSprite);
  var sp = CP.makeLabel(text, color);
  sp.position.set(0, 0.5, 0);
  mesh.add(sp);
  mesh.userData.labelSprite = sp;
};

// ====== Lamp ======
CP.addLamp = function(pos){
  for(var i=0;i<CP.lights.length;i++){
    if(CP.lights[i].mesh.position.distanceTo(pos) < CP.MIN_LAMP_DIST){
      UI.toast(I18N.t('lamp')+' ≥ 1m'); return null;
    }
  }
  var id = 'L'+(CP.nextL++);
  var group = new THREE.Group();
  group.position.copy(pos);
  group.userData.type='lamp'; group.userData.id=id;

  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.03,20), M.lampBase);
  base.position.y = 0.22; group.add(base);
  var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.22,8), M.lampCord);
  cord.position.y = 0.11; group.add(cord);
  var shade = new THREE.Mesh(new THREE.ConeGeometry(0.16,0.14,24,1,true), M.lampShade);
  shade.position.y = 0.05; shade.rotation.x = Math.PI; group.add(shade);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055,20,14), M.bulb.clone());
  bulb.position.y = 0.02; group.add(bulb);
  var haloMat = new THREE.SpriteMaterial({map:CP.glow(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  var halo = new THREE.Sprite(haloMat);
  halo.scale.set(0.95,0.95,1); halo.position.y = 0.02; group.add(halo);

  W.scene.add(group);

  var light = new THREE.PointLight(0xfff0cc, 0, 14, 1.4);
  light.position.copy(pos); light.position.y -= 0.05;
  light.castShadow = true;
  light.shadow.mapSize.set(512,512);
  light.shadow.bias = -0.001;
  W.scene.add(light);

  var lamp = {
    id:id, mesh:group, light:light, halo:halo, bulb:bulb,
    on:false, intensityOn:1.6,
    intensity:0, targetIntensity:0,
    emissive:0, targetEmissive:0,
    haloOpacity:0, targetHalo:0,
    circuitId:null
  };
  CP.lights.push(lamp);
  CP.setLabel(group, id, '#ffe066');
  History.push('add lamp');
  Storage.autosave();
  return lamp;
};

CP.findLamp = function(id){
  for(var i=0;i<CP.lights.length;i++) if(CP.lights[i].id === id) return CP.lights[i];
  return null;
};

CP.setLampCircuit = function(lamp, cid){
  lamp.circuitId = cid;
  CP.setLabel(lamp.mesh, lamp.id+'·'+cid, '#ffe066');
};

// ====== Switch ======
CP.addSwitch = function(pos, rotY){
  var id = 'S'+(CP.nextS++);
  var g = new THREE.Group();
  g.position.copy(pos);
  if(rotY !== undefined) g.rotation.y = rotY;
  g.userData.type='switch'; g.userData.id=id;
  g.userData.linkedLampId = null;

  var plate = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.012), M.switchPlate);
  g.add(plate);
  var btn = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.025), M.switchBtn);
  btn.position.z = 0.02; g.add(btn);
  g.userData.button = btn;

  W.scene.add(g);
  CP.switches.push(g);
  CP.setLabel(g, id+'=>?', '#ff5555');
  History.push('add switch');
  Storage.autosave();
  return g;
};

CP.linkSwitchToLamp = function(sw, lamp){
  sw.userData.linkedLampId = lamp ? lamp.id : null;
  CP.setLabel(sw, sw.userData.id+'=>'+(lamp?lamp.id:'?'), lamp?'#00ff88':'#ff5555');
  History.push('link');
  Storage.autosave();
};

CP.pressSwitch = function(sw){
  if(!sw.userData.button) return;
  sw.userData.button.position.z = 0.008;
  if(sw.userData._t) clearTimeout(sw.userData._t);
  sw.userData._t = setTimeout(function(){
    if(sw.userData.button) sw.userData.button.position.z = 0.02;
  }, 130);
};

CP.toggleLamp = function(lamp){
  lamp.on = !lamp.on;
  lamp.targetIntensity = lamp.on ? lamp.intensityOn : 0;
  lamp.targetEmissive = lamp.on ? 1.6 : 0;
  lamp.targetHalo = lamp.on ? 0.85 : 0;
};

CP.toggleBySwitch = function(sw){
  CP.pressSwitch(sw);
  var lid = sw.userData.linkedLampId;
  if(!lid){ UI.toast(I18N.t('unlinked')); return; }
  var lamp = CP.findLamp(lid);
  if(!lamp) return;
  var c = Circuits.find(lamp.circuitId);
  if(c && !c.on){ UI.toast(c.id+' OFF'); return; }
  CP.toggleLamp(lamp);
};

// ====== Socket ======
CP.addSocket = function(pos, rotY){
  var id = 'P'+(CP.nextP++);
  var g = new THREE.Group();
  g.position.copy(pos);
  if(rotY !== undefined) g.rotation.y = rotY;
  g.userData.type='socket'; g.userData.id=id;

  var plate = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.012), M.socketPlate);
  g.add(plate);
  var h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.006,12), M.hole);
  h1.rotation.x = Math.PI/2; h1.position.set(-0.03, 0.015, 0.008); g.add(h1);
  var h2 = h1.clone(); h2.position.x = 0.03; g.add(h2);
  var h3 = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.006,12), M.hole);
  h3.rotation.x = Math.PI/2; h3.position.set(0, -0.045, 0.008); g.add(h3);

  W.scene.add(g);
  CP.sockets.push(g);
  History.push('add socket');
  Storage.autosave();
  return g;
};

// ====== Wire ======
CP.addWire = function(a, b, type, section){
  section = section || '1.5';
  var r = M.sectionRadius[section] || 0.012;
  var mid = a.clone().add(b).multiplyScalar(.5); mid.y += 0.08;
  var curve = new THREE.CatmullRomCurve3([a, mid, b]);
  var geo = new THREE.TubeGeometry(curve, 24, r, 8, false);
  var mat = new THREE.MeshStandardMaterial({
    color: M.wireColors[type] || 0x888888,
    roughness:.6, metalness:.05,
    emissive: 0x000000, emissiveIntensity: 0
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.userData.type='wire';
  mesh.userData.wireType = type;
  mesh.userData.a = a.clone();
  mesh.userData.b = b.clone();
  mesh.userData.section = section;
  W.scene.add(mesh); W.wires.push(mesh);
  History.push('add wire');
  Storage.autosave();
  return mesh;
};

CP.removeWire = function(m){
  var i = W.wires.indexOf(m);
  if(i >= 0){ W.scene.remove(m); W.wires.splice(i,1); return true; }
  return false;
};

CP.redrawLinkWire = function(sw){
  if(sw.userData.wireMesh) CP.removeWire(sw.userData.wireMesh);
  sw.userData.wireMesh = null;
  if(!sw.userData.linkedLampId) return;
  var lamp = CP.findLamp(sw.userData.linkedLampId);
  if(!lamp) return;
  sw.userData.wireMesh = CP.addWire(sw.position.clone(), lamp.mesh.position.clone(), 'phase', '1.5');
};

// ====== Remove ======
CP.remove = function(obj){
  var t = obj.userData.type;
  if(t === 'lamp'){
    for(var i=0;i<CP.lights.length;i++) if(CP.lights[i].mesh === obj){
      W.scene.remove(CP.lights[i].light); W.scene.remove(obj);
      CP.lights.splice(i,1); History.push('delete lamp'); Storage.autosave(); return true;
    }
  }
  if(t === 'switch'){
    for(var i=0;i<CP.switches.length;i++) if(CP.switches[i] === obj){
      if(obj.userData.wireMesh) CP.removeWire(obj.userData.wireMesh);
      W.scene.remove(obj); CP.switches.splice(i,1);
      History.push('delete switch'); Storage.autosave(); return true;
    }
  }
  if(t === 'socket'){
    for(var i=0;i<CP.sockets.length;i++) if(CP.sockets[i] === obj){
      W.scene.remove(obj); CP.sockets.splice(i,1);
      History.push('delete socket'); Storage.autosave(); return true;
    }
  }
  if(t === 'wall'){ if(W.removeWall(obj)){ History.push('delete wall'); Storage.autosave(); return true; } }
  if(t === 'wire'){ if(CP.removeWire(obj)){ History.push('delete wire'); Storage.autosave(); return true; } }
  return false;
};

// ====== Move ======
CP.moveLamp = function(lamp, newPos){
  for(var i=0;i<CP.lights.length;i++){
    if(CP.lights[i] === lamp) continue;
    if(CP.lights[i].mesh.position.distanceTo(newPos) < CP.MIN_LAMP_DIST){
      UI.toast(I18N.t('lamp')+' ≥ 1m'); return false;
    }
  }
  lamp.mesh.position.copy(newPos);
  lamp.light.position.copy(newPos); lamp.light.position.y -= 0.05;
  for(var j=0;j<CP.switches.length;j++){
    if(CP.switches[j].userData.linkedLampId === lamp.id) CP.redrawLinkWire(CP.switches[j]);
  }
  History.push('move lamp');
  Storage.autosave();
  return true;
};

CP.moveMesh = function(mesh, newPos, rotY){
  mesh.position.copy(newPos);
  if(rotY !== undefined) mesh.rotation.y = rotY;
  if(mesh.userData.type === 'switch') CP.redrawLinkWire(mesh);
  History.push('move '+mesh.userData.type);
  Storage.autosave();
};

// ====== Update (smooth transitions) ======
CP.update = function(dt){
  var k = Math.min(1, dt * 8);
  for(var i=0;i<CP.lights.length;i++){
    var L = CP.lights[i];
    L.intensity += (L.targetIntensity - L.intensity) * k;
    L.emissive += (L.targetEmissive - L.emissive) * k;
    L.haloOpacity += (L.targetHalo - L.haloOpacity) * k;
    L.light.intensity = L.intensity;
    L.bulb.material.emissiveIntensity = L.emissive;
    L.halo.material.opacity = L.haloOpacity;
  }
};
