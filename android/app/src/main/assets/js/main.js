window.addEventListener('load', function(){
  try {
    M.init();
    W.init();
    if(!Storage.load()){
      Circuits.init();
      // demo lamp + switch
      var demoLamp = CP.addLamp(new THREE.Vector3(0, 2.85, 0));
      var demoSw = CP.addSwitch(new THREE.Vector3(2.5, 1.3, -4.9), 0);
      if(demoLamp) CP.setLampCircuit(demoLamp, Circuits.list[0].id);
      if(demoLamp && demoSw) CP.linkSwitchToLamp(demoSw, demoLamp);
      CP.addWire(new THREE.Vector3(5.7, 2.9, 4.7), new THREE.Vector3(0, 2.85, 0), 'neutral', '1.5');
      CP.addWire(new THREE.Vector3(5.7, 2.85, 4.7), new THREE.Vector3(0, 2.8, 0.2), 'earth', '1.5');
      History.push();
    }
    Controls.init();
    UI.init();
    Controls.setMode('fly');

    // Smart tap
    Controls.onTap = function(x, y){
      if(Build.tool !== 'select'){ Build.onTap(x, y); return; }
      // select mode: context-aware
      var sw = Build.pick(x, y, CP.switches, 110);
      if(sw){
        if(sw.userData.linkedLampId){ CP.toggleBySwitch(sw); }
        else { UI.openLinkMenu(sw); }
        return;
      }
      var lampMesh = CP.lights.map(function(l){return l.mesh;});
      var lm = Build.pick(x, y, lampMesh, 110);
      if(lm){
        for(var i=0;i<CP.lights.length;i++){
          if(CP.lights[i].mesh === lm){ CP.toggleLamp(CP.lights[i]); UI.toast(CP.lights[i].id + (CP.lights[i].on ? ' ON' : ' OFF'), CP.lights[i].on ? 'ok' : ''); return; }
        }
      }
      var sk = Build.pick(x, y, CP.sockets, 110);
      if(sk){ UI.toast('مقبس '+sk.userData.id, 'info'); return; }
    };

    Controls.onLongPress = function(x, y){
      var sw = Build.pick(x, y, CP.switches, 110);
      if(sw){ UI.openLinkMenu(sw); return; }
    };

    // hint fade
    setTimeout(function(){
      var h = document.getElementById('hint');
      if(h) h.style.opacity = '0';
    }, 6000);

    // loop
    var last = performance.now();
    var wireUpdateAcc = 0;
    function loop(){
      var now = performance.now();
      var dt = Math.min(.05, (now - last) / 1000);
      last = now;

      Controls.update(dt);
      CP.update(dt);

      wireUpdateAcc += dt;
      if(wireUpdateAcc > 0.15){ wireUpdateAcc = 0; Circuits.updateWires(dt); }
      Circuits._pulse += dt * 4;

      var cp = W.camera.position;
      W.sun.position.set(cp.x + 25, 40, cp.z + 15);
      W.sun.target.position.set(cp.x, 0, cp.z);
      W.sun.target.updateMatrixWorld();

      W.renderer.render(W.scene, W.camera);
      requestAnimationFrame(loop);
    }
    loop();

    addEventListener('resize', function(){
      W.camera.aspect = innerWidth/innerHeight;
      W.camera.updateProjectionMatrix();
      W.renderer.setSize(innerWidth, innerHeight);
    });

    document.body.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});
    document.body.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  } catch(err){
    var e = document.getElementById('err');
    e.style.display = 'block';
    e.textContent = 'FATAL: ' + err.message + '\n' + (err.stack || '');
  }
});

window.addEventListener('error', function(ev){
  var e = document.getElementById('err');
  e.style.display = 'block';
  e.textContent += 'ERR: ' + (ev.message||ev.type) + '\n  at ' + (ev.filename||'') + ':' + (ev.lineno||'') + '\n';
});
