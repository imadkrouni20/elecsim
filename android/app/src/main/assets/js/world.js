window.W = { H: 3, walls:[], walls2:[], wires:[], scene:null, camera:null, renderer:null, sun:null, hemi:null, floor:null, ceiling:null, ground:null };

W.init = function(){
  var canvas = document.getElementById('c');
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9c8e4);
  scene.fog = new THREE.Fog(0xa9c8e4, 60, 180);
  W.scene = scene;

  var camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.05, 400);
  camera.position.set(0, 3.2, 14);
  W.camera = camera;

  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, powerPreference:'high-performance'});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  W.renderer = renderer;

  var hemi = new THREE.HemisphereLight(0xc8dcff, 0x4a5540, 0.55);
  scene.add(hemi);
  W.hemi = hemi;

  var sun = new THREE.DirectionalLight(0xfff2d8, 0.85);
  sun.position.set(25, 40, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0005;
  scene.add(sun); scene.add(sun.target);
  W.sun = sun;

  var ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.ground);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);
  W.ground = ground;

  // أرضية الغرفة الافتراضية
  var floor = new THREE.Mesh(new THREE.BoxGeometry(12, .1, 10), M.floor);
  floor.position.set(0, .05, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  W.floor = floor;

  var ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, .1, 10), M.ceiling);
  ceiling.position.set(0, W.H + .05, 0);
  ceiling.receiveShadow = true;
  scene.add(ceiling);
  W.ceiling = ceiling;

  // 4 جدران مع باب في الجدار الشمالي
  var T = .15, H = W.H;
  W.addBox(-3.75, H/2, -5, 4.5, H, T, M.wall);
  W.addBox( 3.75, H/2, -5, 4.5, H, T, M.wall);
  W.addBox( 0, H-.3, -5, 3, .6, T, M.wall);
  W.addBox( 0, H/2, 5, 12, H, T, M.wall);
  W.addBox(-6, H/2, 0, T, H, 10, M.wall);
  W.addBox( 6, H/2, 0, T, H, 10, M.wall);
};

W.addBox = function(x,y,z,w,h,d,mat){
  var m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.type = 'wall';
  W.scene.add(m); W.walls.push(m);
  return m;
};

W.addWall = function(a, b){
  var dx = b.x - a.x, dz = b.z - a.z;
  var len = Math.hypot(dx, dz);
  if(len < 0.2) return null;
  var angle = Math.atan2(dz, dx);
  var m = new THREE.Mesh(new THREE.BoxGeometry(len, W.H, .15), M.wall);
  m.position.set((a.x+b.x)/2, W.H/2, (a.z+b.z)/2);
  m.rotation.y = -angle;
  m.castShadow = true; m.receiveShadow = true;
  m.userData.type = 'wall';
  W.scene.add(m); W.walls.push(m);
  return m;
};

W.removeWall = function(m){
  var i = W.walls.indexOf(m);
  if(i >= 0){ W.scene.remove(m); W.walls.splice(i,1); return true; }
  return false;
};

W.allSurfaces = function(){
  var arr = [W.floor, W.ceiling, W.ground];
  for(var i=0;i<W.walls.length;i++) arr.push(W.walls[i]);
  return arr;
};
