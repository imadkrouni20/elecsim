window.E = { circuits:[], lights:[], switches:[], groups:{} };

E.COLORS = {
  phase:0xcc2222, neutral:0x3388ee, earth:0xaacc00,
  navette:0xff8800, retour:0x8822cc, commande:0x666666
};

E.SECTIONS = {
  '1.5':{real:1.5, radius:.012},
  '2.5':{real:2.5, radius:.015},
  '4'  :{real:4,   radius:.020},
  '6'  :{real:6,   radius:.026},
  '10' :{real:10,  radius:.034},
  '16' :{real:16,  radius:.045},
  '25' :{real:25,  radius:.060}
};

E.addWire = function(cid, pts, type, section){
  var sd = E.SECTIONS[section] || E.SECTIONS['2.5'];
  var curve = new THREE.CatmullRomCurve3(pts);
  var geo = new THREE.TubeGeometry(curve, Math.max(16, pts.length*10), sd.radius, 8, false);
  var mat = new THREE.MeshStandardMaterial({
    color: E.COLORS[type] || 0x888888,
    roughness:.6, metalness:.05
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.userData.type = 'wire';
  mesh.userData.circuit = cid;
  mesh.userData.wireType = type;
  mesh.userData.section = section;
  W.scene.add(mesh); W.wires.push(mesh);
  return mesh;
};

E.init = function(){
  // ===== Dara C1: Idha'a =====
  E.circuits.push({ id:'C1', name:'Éclairage', breaker:10, section:'1.5' });

  // Mysbah fi al-saqf
  var lampGeo = new THREE.SphereGeometry(.15, 16, 12);
  var lampMat = new THREE.MeshStandardMaterial({
    color:0xffffff, emissive:0xfff0cc, emissiveIntensity:0, roughness:.3
  });
  var lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(0, 2.85, 0);
  W.scene.add(lamp);

  var point = new THREE.PointLight(0xfff0cc, 0, 14, 1);
  point.position.copy(lamp.position);
  point.castShadow = true;
  point.shadow.mapSize.set(1024,1024);
  point.shadow.bias = -0.001;
  W.scene.add(point);

  E.lights.push({
    id:'L1', circuit:'C1',
    mesh:lamp, light:point,
    on:false, intensityOn:1.6, color:0xfff0cc
  });

  // Meftah 3la al-jidar 3nd al-bab
  var swMat = new THREE.MeshStandardMaterial({color:0xf8f8f8, roughness:.4});
  var sw = new THREE.Mesh(new THREE.BoxGeometry(.15,.15,.03), swMat);
  sw.position.set(2.5, 1.3, -4.9);
  sw.userData.type = 'switch';
  sw.userData.lampId = 'L1';
  W.scene.add(sw); W.switches.push(sw);

  var ind = new THREE.Mesh(
    new THREE.BoxGeometry(.06,.02,.005),
    new THREE.MeshStandardMaterial({color:0xff2200, emissive:0x000000})
  );
  ind.position.set(2.5, 1.34, -4.884);
  W.scene.add(ind);
  sw.userData.indicator = ind;

  // Aslak: Phase (meftah -> saqf -> mysbah)
  E.addWire('C1', [
    new THREE.Vector3(2.5,1.3,-4.9),
    new THREE.Vector3(2.5,2.95,-4.9),
    new THREE.Vector3(1,2.95,-3),
    new THREE.Vector3(0,2.85,0)
  ], 'phase', '1.5');

  // Aslak: Neutre (men al-lawha - mubassat)
  E.addWire('C1', [
    new THREE.Vector3(5.7,2.9,4.7),
    new THREE.Vector3(3,2.9,3),
    new THREE.Vector3(0,2.85,0)
  ], 'neutral', '1.5');

  // Aslak: Terre
  E.addWire('C1', [
    new THREE.Vector3(5.7,2.85,4.7),
    new THREE.Vector3(2.5,2.85,3),
    new THREE.Vector3(0,2.8,0.2)
  ], 'earth', '1.5');
};

E.toggleSwitch = function(sw){
  var lampId = sw.userData.lampId;
  var lamp = null;
  for(var i=0;i<E.lights.length;i++) if(E.lights[i].id===lampId) lamp=E.lights[i];
  if(!lamp) return;
  lamp.on = !lamp.on;
  lamp.light.intensity = lamp.on ? lamp.intensityOn : 0;
  lamp.mesh.material.emissiveIntensity = lamp.on ? 1.4 : 0;
  if(sw.userData.indicator){
    sw.userData.indicator.material.emissive.setHex(lamp.on ? 0x00ff44 : 0x000000);
    sw.userData.indicator.material.color.setHex(lamp.on ? 0x00ff44 : 0xff2200);
  }
};
