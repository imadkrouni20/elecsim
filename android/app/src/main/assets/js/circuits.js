window.Circuits = { list:[], nextId:1, U:220 };

Circuits.init = function(){
  if(Circuits.list.length === 0) Circuits.add('Éclairage');
};

Circuits.add = function(name){
  var id = 'C'+(Circuits.nextId++);
  var c = { id:id, name:name||('Circuit '+id), breaker:10, on:true };
  Circuits.list.push(c);
  History.push('add circuit');
  Storage.autosave();
  return c;
};

Circuits.find = function(id){
  for(var i=0;i<Circuits.list.length;i++) if(Circuits.list[i].id === id) return Circuits.list[i];
  return null;
};

Circuits.setState = function(c, on){
  c.on = on;
  for(var i=0;i<CP.lights.length;i++){
    var L = CP.lights[i];
    if(L.circuitId !== c.id) continue;
    if(!on){ L.on = false; L.targetIntensity = 0; L.targetEmissive = 0; L.targetHalo = 0; }
  }
  Storage.autosave();
};

// ====== Analysis ======
Circuits.AMP = { '1.5':16, '2.5':20, '4':25, '6':32, '10':40, '16':57, '25':75 };
Circuits.RHO = 0.0172;
Circuits.MAX_DROP = 3.0;

Circuits.load = function(cid){
  var watts = 0, lamps = 0;
  for(var i=0;i<CP.lights.length;i++) if(CP.lights[i].circuitId === cid){ watts += 15; lamps++; }
  return { watts:watts, current: watts/Circuits.U, lamps:lamps };
};

Circuits.wireLength = function(cid){
  var total = 0;
  var cLamps = CP.lights.filter(function(l){return l.circuitId === cid;});
  if(!cLamps.length) return 0;
  for(var i=0;i<W.wires.length;i++){
    var w = W.wires[i];
    if(!w.userData.a || !w.userData.b) continue;
    for(var j=0;j<cLamps.length;j++){
      var lp = cLamps[j].mesh.position;
      if(w.userData.a.distanceTo(lp) < 0.6 || w.userData.b.distanceTo(lp) < 0.6){
        total += w.userData.a.distanceTo(w.userData.b);
        break;
      }
    }
  }
  return total;
};

Circuits.smallestSection = function(cid){
  var order = ['1.5','2.5','4','6','10','16','25'];
  var found = null;
  var cLamps = CP.lights.filter(function(l){return l.circuitId === cid;});
  if(!cLamps.length) return '1.5';
  for(var i=0;i<W.wires.length;i++){
    var w = W.wires[i];
    if(!w.userData.a || !w.userData.b) continue;
    for(var j=0;j<cLamps.length;j++){
      var lp = cLamps[j].mesh.position;
      if(w.userData.a.distanceTo(lp) < 0.6 || w.userData.b.distanceTo(lp) < 0.6){
        if(!found || order.indexOf(w.userData.section) < order.indexOf(found)) found = w.userData.section;
        break;
      }
    }
  }
  return found || '1.5';
};

Circuits.analyze = function(c){
  var load = Circuits.load(c.id);
  var len = Circuits.wireLength(c.id);
  var sec = Circuits.smallestSection(c.id);
  var maxA = Circuits.AMP[sec] || 16;
  var drop = (2 * Circuits.RHO * len * load.current / parseFloat(sec)) / Circuits.U * 100;
  var issues = [];
  if(load.current > c.breaker) issues.push({l:'danger', t:'الحمل '+load.current.toFixed(2)+'A > القاطع '+c.breaker+'A'});
  if(load.current > maxA) issues.push({l:'danger', t:'السلك '+sec+'مم² لا يتحمل '+load.current.toFixed(2)+'A'});
  if(drop > Circuits.MAX_DROP) issues.push({l:'danger', t:'انخفاض الجهد '+drop.toFixed(2)+'%'});
  else if(drop > 2.0) issues.push({l:'warn', t:'انخفاض الجهد '+drop.toFixed(2)+'%'});
  if(c.breaker > maxA) issues.push({l:'warn', t:'القاطع ('+c.breaker+'A) > قدرة السلك ('+maxA+'A)'});
  return {
    circuitId:c.id, watts:load.watts, current:load.current, length:len, section:sec,
    maxAmpacity:maxA, breaker:c.breaker, dropPercent:drop, lamps:load.lamps,
    issues:issues,
    status: issues.some(function(i){return i.l==='danger';}) ? 'danger' : (issues.length ? 'warn' : 'ok')
  };
};

Circuits.analyzeAll = function(){ return Circuits.list.map(Circuits.analyze); };

// ====== Wire coloring by load ======
Circuits._pulse = 0;
Circuits.updateWires = function(dt){
  Circuits._pulse += dt * 4;
  var v = Math.sin(Circuits._pulse) * 0.5 + 0.5;

  // reset
  for(var i=0;i<W.wires.length;i++){
    var w = W.wires[i];
    var baseColor = M.wireColors[w.userData.wireType] || 0x888888;
    w.material.color.setHex(baseColor);
    if(w.material.emissive) w.material.emissive.setHex(0x000000);
    w.material.emissiveIntensity = 0;
  }

  // highlight by status
  var reports = Circuits.analyzeAll();
  for(var r=0;r<reports.length;r++){
    var rep = reports[r];
    if(rep.status === 'ok') continue;
    var lamps = CP.lights.filter(function(l){return l.circuitId === rep.circuitId;});
    for(var k=0;k<W.wires.length;k++){
      var w2 = W.wires[k];
      if(!w2.userData.a) continue;
      for(var li=0; li<lamps.length; li++){
        var lp = lamps[li].mesh.position;
        if(w2.userData.a.distanceTo(lp) < 0.6 || w2.userData.b.distanceTo(lp) < 0.6){
          if(rep.status === 'danger'){
            w2.material.color.setHex(0xff2200);
            w2.material.emissive = w2.material.emissive || new THREE.Color(0);
            w2.material.emissive.setHex(0xff0000);
            w2.material.emissiveIntensity = 0.35 + v * 0.65;
          } else {
            w2.material.color.setHex(0xffaa00);
          }
          break;
        }
      }
    }
  }
};

Circuits.stats = function(){
  var wireBySection = {};
  var totalLen = 0;
  for(var i=0;i<W.wires.length;i++){
    var w = W.wires[i];
    if(!w.userData.a) continue;
    var L = w.userData.a.distanceTo(w.userData.b);
    totalLen += L;
    var s = w.userData.section || '1.5';
    wireBySection[s] = (wireBySection[s] || 0) + L;
  }
  return {
    lamps: CP.lights.length,
    switches: CP.switches.length,
    sockets: CP.sockets.length,
    walls: W.walls.length,
    totalWireLength: totalLen,
    wireBySection: wireBySection,
    circuits: Circuits.list.length
  };
};
