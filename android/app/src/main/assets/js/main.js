window.addEventListener('load', function(){
  W.init();
  E.init();
  C.init();
  C.onTap = function(x, y){
    if(B.tool !== "select"){ B.onTap(x, y); return; }
    var ray = new THREE.Raycaster();
    var ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, W.camera);
    var hits = ray.intersectObjects(W.switches, false);
    if(hits.length){ E.toggleSwitch(hits[0].object); }
  };
  document.getElementById('btnMode').addEventListener('click', function(){
    C.setMode(C.mode === "walk" ? "fly" : "walk");
  });
  document.getElementById('btnLang').addEventListener('click', function(){
    var order = ["ar","fr","en"];
    I18N.lang = order[(order.indexOf(I18N.lang)+1) % 3];
    document.getElementById('btnLang').textContent = I18N.lang.toUpperCase();
    I18N.apply();
  });
  document.querySelectorAll('#tools button').forEach(function(b){
    b.addEventListener('click', function(){ B.setTool(b.dataset.tool); });
  });
  I18N.apply();
  setTimeout(function(){ var h=document.getElementById('hint'); if(h) h.classList.add('fade'); }, 5000);
  var last = performance.now();
  function loop(){
    var now = performance.now();
    var dt = Math.min(.05, (now-last)/1000);
    last = now;
    C.update(dt);
    var cp = W.camera.position;
    W.sun.position.set(cp.x + 25, 40, cp.z + 15);
    W.sun.target.position.set(cp.x, 0, cp.z);
    W.sun.target.updateMatrixWorld();
    W.renderer.render(W.scene, W.camera);
    requestAnimationFrame(loop);
  }
  loop();
  window.addEventListener('resize', function(){
    W.camera.aspect = innerWidth/innerHeight;
    W.camera.updateProjectionMatrix();
    W.renderer.setSize(innerWidth, innerHeight);
  });
  document.body.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});
});
