window.Controls = { mode:'fly', yaw:0, pitch:-0.15, mv:{x:0,y:0}, onTap:null, onLongPress:null, _hint:null };

Controls.init = function(){
  var canvas = W.renderer.domElement;
  var moveId = null, lookId = null;
  var moveStart = {x:0,y:0}, lookLast = {x:0,y:0};
  var touches = {};
  var longPressTimer = null;

  function start(e){
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      var role = null;
      if(t.clientX < innerWidth * 0.42 && moveId === null){
        moveId = t.identifier; moveStart.x = t.clientX; moveStart.y = t.clientY; role='move';
      } else if(t.clientX >= innerWidth * 0.42 && lookId === null){
        lookId = t.identifier; lookLast.x = t.clientX; lookLast.y = t.clientY; role='look';
      }
      if(role) touches[t.identifier] = { sx:t.clientX, sy:t.clientY, st:performance.now(), role:role };
    }
    // long press timer
    if(Object.keys(touches).length === 1){
      if(longPressTimer) clearTimeout(longPressTimer);
      var t0 = touches[Object.keys(touches)[0]];
      longPressTimer = setTimeout(function(){
        longPressTimer = null;
        if(Controls.onLongPress && t0) Controls.onLongPress(t0.sx, t0.sy);
      }, 600);
    }
    e.preventDefault();
  }

  function move(e){
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      var info = touches[t.identifier];
      if(!info) continue;
      var dx0 = t.clientX - info.sx, dy0 = t.clientY - info.sy;
      if(Math.hypot(dx0, dy0) > 12 && longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
      if(t.identifier === moveId){
        var dx = t.clientX - moveStart.x, dy = t.clientY - moveStart.y;
        var max = 90, d = Math.hypot(dx,dy);
        if(d > max){ dx *= max/d; dy *= max/d; }
        Controls.mv.x = dx/max; Controls.mv.y = dy/max;
      } else if(t.identifier === lookId){
        var lx = t.clientX - lookLast.x, ly = t.clientY - lookLast.y;
        Controls.yaw -= lx * 0.005;
        Controls.pitch -= ly * 0.005;
        Controls.pitch = Math.max(-1.4, Math.min(1.4, Controls.pitch));
        lookLast.x = t.clientX; lookLast.y = t.clientY;
      }
    }
    e.preventDefault();
  }

  function end(e){
    if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      var info = touches[t.identifier];
      if(info){
        var dur = performance.now() - info.st;
        var dist = Math.hypot(t.clientX - info.sx, t.clientY - info.sy);
        if(dur < 320 && dist < 14 && Controls.onTap){
          Controls.onTap(t.clientX, t.clientY);
        }
        delete touches[t.identifier];
      }
      if(t.identifier === moveId){ moveId = null; Controls.mv.x = 0; Controls.mv.y = 0; }
      else if(t.identifier === lookId){ lookId = null; }
    }
    e.preventDefault();
  }

  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', move, {passive:false});
  canvas.addEventListener('touchend', end, {passive:false});
  canvas.addEventListener('touchcancel', end, {passive:false});

  // Desktop fallback
  var keys = {};
  addEventListener('keydown', function(e){ keys[e.key.toLowerCase()] = true; });
  addEventListener('keyup', function(e){ keys[e.key.toLowerCase()] = false; });
  Controls._keys = keys;
};

Controls.update = function(dt){
  var cam = W.camera;
  cam.rotation.order = 'YXZ';
  cam.rotation.y = Controls.yaw;
  cam.rotation.x = Controls.pitch;

  var speed = (Controls.mode === 'fly') ? 8 : 4;
  var mv = Controls.mv;
  var k = Controls._keys || {};

  // keyboard to move
  var kx = 0, ky = 0;
  if(k['w'] || k['arrowup']) ky -= 1;
  if(k['s'] || k['arrowdown']) ky += 1;
  if(k['a'] || k['arrowleft']) kx -= 1;
  if(k['d'] || k['arrowright']) kx += 1;
  if(kx || ky){ mv = {x:kx, y:ky}; }

  if(Controls.mode === 'fly'){
    var fwd = new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion);
    var rgt = new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion);
    var vel = new THREE.Vector3();
    vel.addScaledVector(fwd, -mv.y * speed * dt);
    vel.addScaledVector(rgt, mv.x * speed * dt);
    cam.position.add(vel);
  } else {
    var f = new THREE.Vector3(-Math.sin(Controls.yaw), 0, -Math.cos(Controls.yaw));
    var r = new THREE.Vector3(Math.cos(Controls.yaw), 0, -Math.sin(Controls.yaw));
    var v = new THREE.Vector3();
    v.addScaledVector(f, -mv.y);
    v.addScaledVector(r, mv.x);
    if(v.lengthSq() > 0){
      v.normalize().multiplyScalar(speed * dt);
      cam.position.add(v);
    }
    cam.position.y = 1.65;
    if(cam.position.x < -5.7) cam.position.x = -5.7;
    if(cam.position.x > 5.7) cam.position.x = 5.7;
    if(cam.position.z < -4.7) cam.position.z = -4.7;
    if(cam.position.z > 4.7) cam.position.z = 4.7;
  }
};

Controls.setMode = function(m){
  Controls.mode = m;
  var p = document.getElementById('pillMode');
  if(p) p.textContent = (m === 'fly' ? '✈️ ' : '🚶 ') + I18N.t(m);
};
