window.C = { mode:"walk", yaw:0, pitch:0, moveVec:{x:0,y:0} };
C.init = function(){
  var canvas = W.renderer.domElement;
  var moveId = null, lookId = null;
  var moveStart = {x:0,y:0};
  var lookLast = {x:0,y:0};
  var tapTime = 0, tapX = 0, tapY = 0;
  function start(e){
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      if(t.clientX < innerWidth/2 && moveId === null){
        moveId = t.identifier;
        moveStart.x = t.clientX; moveStart.y = t.clientY;
        tapTime = performance.now(); tapX = t.clientX; tapY = t.clientY;
      } else if(t.clientX >= innerWidth/2 && lookId === null){
        lookId = t.identifier;
        lookLast.x = t.clientX; lookLast.y = t.clientY;
      }
    }
    e.preventDefault();
  }
  function move(e){
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      if(t.identifier === moveId){
        var dx = t.clientX - moveStart.x;
        var dy = t.clientY - moveStart.y;
        var max = 90, d = Math.hypot(dx,dy);
        if(d > max){ dx *= max/d; dy *= max/d; }
        C.moveVec.x = dx/max;
        C.moveVec.y = dy/max;
      } else if(t.identifier === lookId){
        var lx = t.clientX - lookLast.x;
        var ly = t.clientY - lookLast.y;
        C.yaw -= lx * 0.005;
        C.pitch -= ly * 0.005;
        C.pitch = Math.max(-1.4, Math.min(1.4, C.pitch));
        lookLast.x = t.clientX; lookLast.y = t.clientY;
      }
    }
    e.preventDefault();
  }
  function end(e){
    for(var i=0;i<e.changedTouches.length;i++){
      var t = e.changedTouches[i];
      if(t.identifier === moveId){
        var dur = performance.now() - tapTime;
        var dist = Math.hypot(t.clientX - tapX, t.clientY - tapY);
        if(dur < 260 && dist < 12 && C.onTap){ C.onTap(t.clientX, t.clientY); }
        moveId = null;
        C.moveVec.x = 0; C.moveVec.y = 0;
      } else if(t.identifier === lookId){ lookId = null; }
    }
    e.preventDefault();
  }
  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', move, {passive:false});
  canvas.addEventListener('touchend', end, {passive:false});
  canvas.addEventListener('touchcancel', end, {passive:false});
};
C.update = function(dt){
  var cam = W.camera;
  cam.rotation.order = 'YXZ';
  cam.rotation.y = C.yaw;
  cam.rotation.x = C.pitch;
  var speed = (C.mode === "fly") ? 8 : 4;
  var mv = C.moveVec;
  if(C.mode === "fly"){
    var fwd = new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion);
    var rgt = new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion);
    var vel = new THREE.Vector3();
    vel.addScaledVector(fwd, -mv.y * speed * dt);
    vel.addScaledVector(rgt, mv.x * speed * dt);
    cam.position.add(vel);
  } else {
    var f = new THREE.Vector3(-Math.sin(C.yaw), 0, -Math.cos(C.yaw));
    var r = new THREE.Vector3(Math.cos(C.yaw), 0, -Math.sin(C.yaw));
    var v = new THREE.Vector3();
    v.addScaledVector(f, -mv.y);
    v.addScaledVector(r, mv.x);
    if(v.lengthSq() > 0){
      v.normalize().multiplyScalar(speed * dt);
      cam.position.add(v);
    }
    cam.position.y = 1.65;
    if(cam.position.x < -5.7) cam.position.x = -5.7;
    if(cam.position.x >  5.7) cam.position.x =  5.7;
    if(cam.position.z < -4.7) cam.position.z = -4.7;
    if(cam.position.z >  4.7) cam.position.z =  4.7;
  }
};
C.setMode = function(m){
  C.mode = m;
  var b = document.getElementById('btnMode');
  if(b) b.textContent = I18N.t(m);
};
