window.B = { tool:'select', start:null, ghost:null };

B.setTool = function(t){
  B.tool = t;
  B.clearGhost();
  B.start = null;
  document.querySelectorAll('#tools button').forEach(function(b){
    b.classList.toggle('active', b.dataset.tool === t);
  });
};

B.onTap = function(x, y){
  if(B.tool !== 'wall') return;
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2(
    (x / innerWidth) * 2 - 1,
    -(y / innerHeight) * 2 + 1
  );
  ray.setFromCamera(ndc, W.camera);
  var hits = ray.intersectObject(W.floor, false);
  if(!hits.length) return;
  var p = hits[0].point.clone();
  p.y = W.H / 2;
  if(!B.start){
    B.start = p;
    B.showGhost(p);
  } else {
    B.buildWall(B.start, p);
    B.start = null;
    B.clearGhost();
  }
};

B.showGhost = function(p){
  B.clearGhost();
  var g = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshBasicMaterial({color:0xffaa00})
  );
  g.position.copy(p);
  W.scene.add(g);
  B.ghost = g;
};

B.clearGhost = function(){
  if(B.ghost){ W.scene.remove(B.ghost); B.ghost = null; }
};

B.buildWall = function(a, b){
  var dx = b.x - a.x, dz = b.z - a.z;
  var len = Math.hypot(dx, dz);
  if(len < 0.25) return;
  var angle = Math.atan2(dz, dx);
  var mat = new THREE.MeshStandardMaterial({color:0xf2ead8, roughness:.95});
  var wall = new THREE.Mesh(new THREE.BoxGeometry(len, W.H, .15), mat);
  wall.position.set((a.x+b.x)/2, W.H/2, (a.z+b.z)/2);
  wall.rotation.y = -angle;
  wall.castShadow = true; wall.receiveShadow = true;
  wall.userData.type = 'wall';
  W.scene.add(wall);
  W.walls.push(wall);
};
