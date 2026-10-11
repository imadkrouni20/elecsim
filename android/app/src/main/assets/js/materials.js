window.M = {};
M.init = function(){
  M.wall = new THREE.MeshStandardMaterial({color:0xf0ebd8, roughness:.92, metalness:0.02});
  M.wallSide = new THREE.MeshStandardMaterial({color:0xe0d8c4, roughness:.92, metalness:0.02});
  M.floor = new THREE.MeshStandardMaterial({color:0xb8a690, roughness:.85, metalness:0.02});
  M.ceiling = new THREE.MeshStandardMaterial({color:0xf5f5f2, roughness:.95, metalness:0.0});
  M.ground = new THREE.MeshStandardMaterial({color:0x5a7a4a, roughness:1});
  M.lampBase = new THREE.MeshStandardMaterial({color:0xf8f8f8, roughness:.35, metalness:.15});
  M.lampCord = new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:.9});
  M.lampShade = new THREE.MeshStandardMaterial({color:0xfaf6e8, roughness:.6, metalness:0.03, side:THREE.DoubleSide});
  M.bulb = new THREE.MeshStandardMaterial({color:0xfffae0, emissive:0xfff0cc, emissiveIntensity:0, roughness:.25});
  M.switchPlate = new THREE.MeshStandardMaterial({color:0xf2f2f2, roughness:.32, metalness:.08});
  M.switchBtn = new THREE.MeshStandardMaterial({color:0xeaeaea, roughness:.28, metalness:.12});
  M.socketPlate = new THREE.MeshStandardMaterial({color:0xf2f2f2, roughness:.30, metalness:.08});
  M.hole = new THREE.MeshStandardMaterial({color:0x14181f, roughness:.9});
  M.wireColors = {
    phase: 0xcc2222,
    neutral: 0x2f7fff,
    earth: 0xa6c40a,
    navette: 0xff8800,
    retour: 0x8822cc,
    commande: 0x666666
  };
  M.sectionRadius = { '1.5':.012, '2.5':.015, '4':.020, '6':.026, '10':.034, '16':.045, '25':.060 };
};
