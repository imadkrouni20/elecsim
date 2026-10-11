window.Build = {
  tool:'select',
  pending:null, ghost:null, moving:null, linkSwitch:null,
  MIN_SNAP: 0.35
};

Build.setTool = function(t){
  Build.tool = t;
  Build.pending = null; Build.moving = null; Build.linkSwitch = null;
  Build.clearGhost();
  UI.refreshSheet();
  UI.updateToolPill();
};

Build.clearGhost = function(){
  if(Build.ghost){ W.scene.remove(Build.ghost); Build.ghost = null; }
};

Build.showGhost = function(p, color){
  Build.clearGhost();
  var g = new THREE.Mesh(new THREE.SphereGeometry(.14,14,12),
    new THREE.MeshBasicMaterial({color:color||0xffaa00, transparent:true, opacity:.85}));
  g.position.copy(p);
  W.scene.add(g); Build.ghost = g;
};

// ===== Raycast =====
Build.ray = function(x, y, objects){
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2((x/innerWidth)*2-1, -(y/innerHeight)*2+1);
  ray.setFromCamera(ndc, W.camera);
  return ray.intersectObjects(objects, false);
};

// Smart pick: uses screen-space distance for good taps
Build.pick = function(x, y, objects, radiusPx){
  radiusPx = radiusPx || 100;
  var closest = null, cd = radiusPx;
  var v = new THREE.Vector3();
  for(var i=0;i<objects.length;i++){
    var o = objects[i];
    if(!o || !o.getWorldPosition) continue;
    v.setFromMatrixPosition(o.matrixWorld);
    v.project(W.camera);
    if(v.z > 1) continue;
    var sx = (v.x*.5+.5) * innerWidth;
    var sy = (-v.y*.5+.5) * innerHeight;
    var d = Math.hypot(sx - x, sy - y);
    if(d < cd){ cd = d; closest = o; }
  }
  return closest;
};

// Pick on a wall surface + return orientation
Build.pickSurface = function(x, y){
  var hw = Build.ray(x, y, W.walls);
  if(hw.length){
    var p = hw[0].point.clone();
    var n = hw[0].face ? hw[0].face.normal.clone() : new THREE.Vector3(0,0,1);
    n.applyQuaternion(hw[0].object.quaternion).normalize();
    p.add(n.clone().multiplyScalar(0.04));
    if(p.y < 0.15) p.y = 0.15;
    return { pos:p, rot: Math.atan2(n.x, n.z), surface:'wall' };
  }
  var hc = Build.ray(x, y, [W.ceiling]);
  if(hc.length){
    var p2 = hc[0].point.clone();
    p2.y = W.H - 0.15;
    return { pos:p2, rot:0, surface:'ceiling' };
  }
  var hf = Build.ray(x, y, [W.floor]);
  if(hf.length){
    var p3 = hf[0].point.clone();
    return { pos:p3, rot:0, surface:'floor' };
  }
  return null;
};

// ====== Smart tap ======
Build.onTap = function(x, y){
  switch(Build.tool){
    case 'wall':   return Build.tapWall(x,y);
    case 'opening': return Build.tapOpening(x,y);
    case 'lamp':   return Build.tapLamp(x,y);
    case 'switch': return Build.tapSwitch(x,y);
    case 'socket': return Build.tapSocket(x,y);
    case 'wire':   return Build.tapWire(x,y);
    case 'move':   return Build.tapMove(x,y);
    case 'link':   return Build.tapLink(x,y);
    case 'delete': return Build.tapDelete(x,y);
  }
};

// ====== Wall ======
Build.tapWall = function(x,y){
  var hf = Build.ray(x,y,[W.floor]);
  if(!hf.length) return;
  var p = hf[0].point.clone(); p.y = W.H/2;
  if(!Build.pending){
    Build.pending = p;
    Build.showGhost(p, 0xffaa00);
    UI.toast('انقر النقطة الثانية', 'info');
    return;
  }
  W.addWall(Build.pending, p);
  Build.pending = null; Build.clearGhost();
  History.push('add wall'); Storage.autosave();
};

// ====== Opening (door/window) =====
Build.tapOpening = function(x,y){
  var r = Build.pickSurface(x,y);
  if(!r || r.surface !== 'wall'){ UI.toast('انقر على جدار', 'warn'); return; }
  // create a dark frame box on wall
  var frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.05),
    new THREE.MeshStandardMaterial({color:0x4a3a2a, roughness:.8}));
  frame.position.copy(r.pos);
  frame.rotation.y = r.rot;
  frame.castShadow = true;
  frame.userData.type = 'opening';
  W.scene.add(frame);
  W.walls.push(frame);
  History.push('opening'); Storage.autosave();
};

// ====== Lamp ======
Build.tapLamp = function(x,y){
  var r = Build.pickSurface(x,y);
  var p;
  if(r) p = r.pos.clone();
  else { UI.toast('انقر داخل المشهد', 'warn'); return; }
  p.y = W.H - 0.15;
  // smart: if target on floor, raise to ceiling above it
  var lamp = CP.addLamp(p);
  if(lamp) UI.toast(lamp.id+' ✓', 'ok');
};

// ====== Switch ======
Build.tapSwitch = function(x,y){
  var r = Build.pickSurface(x,y);
  if(!r){ UI.toast('انقر على جدار أو أرض', 'warn'); return; }
  var pos = r.pos.clone(), rot = r.rot;
  if(r.surface === 'wall'){
    // smart: height clamp
    if(pos.y > 1.6) pos.y = 1.3;
    if(pos.y < 0.9) pos.y = 1.3;
  } else {
    // floor: place at 1.3m on nearest wall
    pos.y = 1.3;
  }
  var sw = CP.addSwitch(pos, rot);
  if(sw) UI.toast(sw.userData.id+' ✓', 'ok');
};

// ====== Socket ======
Build.tapSocket = function(x,y){
  var r = Build.pickSurface(x,y);
  if(!r){ UI.toast('انقر على جدار', 'warn'); return; }
  var pos = r.pos.clone(), rot = r.rot;
  if(r.surface === 'wall') pos.y = 0.3;
  else pos.y = 0.3;
  var sk = CP.addSocket(pos, rot);
  if(sk) UI.toast(sk.userData.id+' ✓', 'ok');
};

// ====== Wire ======
Build.tapWire = function(x,y){
  var targets = [].concat(CP.lights.map(function(l){return l.mesh;}), CP.switches, CP.sockets);
  var hit = Build.pick(x,y,targets,110);
  var p;
  if(hit){
    p = hit.position.clone();
    if(hit.userData.type === 'lamp') p.y -= 0.05;
  } else {
    var r = Build.pickSurface(x,y);
    if(!r) return;
    p = r.pos.clone();
    p.y = Math.min(p.y, W.H - 0.2);
  }
  if(!Build.pending){
    Build.pending = p;
    Build.showGhost(p, 0x0088ff);
    UI.toast('انقر الهدف الثاني', 'info');
    return;
  }
  CP.addWire(Build.pending, p, 'phase', '1.5');
  Build.pending = null; Build.clearGhost();
};

// ====== Move ======
Build.tapMove = function(x,y){
  var all = [].concat(CP.lights.map(function(l){return l.mesh;}), CP.switches, CP.sockets);
  if(!Build.moving){
    var hit = Build.pick(x,y,all,120);
    if(!hit){ UI.toast('انقر عنصرًا', 'warn'); return; }
    Build.moving = hit;
    Build.showGhost(hit.position.clone(), 0x00ddff);
    UI.toast('انقر الموقع الجديد', 'info');
    return;
  }
  var type = Build.moving.userData.type;
  if(type === 'lamp'){
    var r = Build.pickSurface(x,y);
    var np;
    if(r){ np = r.pos.clone(); np.y = W.H - 0.15; }
    else { return; }
    var lamp = null;
    for(var i=0;i<CP.lights.length;i++) if(CP.lights[i].mesh === Build.moving) lamp = CP.lights[i];
    if(lamp) CP.moveLamp(lamp, np);
  } else {
    var r2 = Build.pickSurface(x,y);
    if(!r2) return;
    var pos = r2.pos.clone();
    if(type === 'switch') pos.y = Math.min(1.6, Math.max(0.9, pos.y));
    if(type === 'socket') pos.y = 0.3;
    CP.moveMesh(Build.moving, pos, r2.rot);
  }
  Build.moving = null; Build.clearGhost();
};

// ====== Link ======
Build.tapLink = function(x,y){
  var sw = Build.pick(x,y,CP.switches,120);
  if(!sw){ UI.toast('انقر مفتاحًا', 'warn'); return; }
  UI.openLinkMenu(sw);
};

// ====== Delete ======
Build.tapDelete = function(x,y){
  var all = [].concat(
    CP.switches, CP.sockets,
    CP.lights.map(function(l){return l.mesh;}),
    W.wires, W.walls
  );
  var hit = Build.pick(x,y,all,90);
  if(hit){ CP.remove(hit); UI.toast('✓', 'ok'); return; }
  var hits = Build.ray(x,y,all);
  if(hits.length){ CP.remove(hits[0].object); UI.toast('✓', 'ok'); }
};
