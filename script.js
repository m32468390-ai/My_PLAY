// Desert Battle — final prototype (sunset sky)
// Controls: WASD or arrow keys to move; left-click to shoot; touch to shoot
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

let scene, camera, player, enemies = [], bullets = [], level = 1;
let playerHealth = 100, enemyHealth = 0, score = 0;
const hudPlayer = document.getElementById('playerHealth');
const hudEnemy = document.getElementById('enemyHealth');
const hudLevel = document.getElementById('levelDisplay');
const hudScore = document.getElementById('score');

function updateHud(){
  hudPlayer.textContent = Math.max(0, Math.floor(playerHealth));
  hudEnemy.textContent = Math.max(0, Math.floor(enemyHealth));
  hudLevel.textContent = level;
  hudScore.textContent = score;
}

function createScene(){
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.98, 0.89, 0.78);

  camera = new BABYLON.ArcRotateCamera('cam', Math.PI, 0.9, 12, new BABYLON.Vector3(0,1.4,0), scene);
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = Math.PI/2 - 0.1;
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 30;
  camera.attachControl(canvas, true);
  camera.wheelDeltaPercentage = 0.01;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0,1,0), scene);
  hemi.intensity = 0.7;
  hemi.diffuse = new BABYLON.Color3(1,0.9,0.8);
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.3,-1,0.2), scene);
  sun.position = new BABYLON.Vector3(50,80,-40);
  sun.intensity = 1.1;

  const ground = BABYLON.MeshBuilder.CreateGround('ground', {width:500, height:500, subdivisions: 4}, scene);
  const gmat = new BABYLON.StandardMaterial('gmat', scene);
  gmat.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/1k1w0d6.jpg', scene);
  gmat.diffuseTexture.uScale = 60;
  gmat.diffuseTexture.vScale = 60;
  gmat.specularColor = new BABYLON.Color3(0.2,0.15,0.1);
  ground.material = gmat;

  const sky = new BABYLON.Layer('sky', 'https://i.imgur.com/4QfKuz1.png', scene, true);
  sky.intensity = 0.9;

  for(let i=0;i<90;i++){
    const size = 3 + Math.random()*10;
    const mesh = BABYLON.MeshBuilder.CreateSphere('d'+i, {diameter: size, segments: 6}, scene);
    mesh.position = new BABYLON.Vector3((Math.random()-0.5)*400, -0.2 + Math.random()*1.2, (Math.random()-0.5)*400);
    mesh.scaling.y = 0.2 + Math.random()*0.8;
    mesh.material = new BABYLON.StandardMaterial('dm'+i, scene);
    mesh.material.diffuseColor = new BABYLON.Color3(0.86,0.76,0.55);
  }

  for(let i=0;i<18;i++){
    const b = BABYLON.MeshBuilder.CreateBox('b'+i, {size: 6 + Math.random()*8}, scene);
    b.position = new BABYLON.Vector3((Math.random()-0.5)*220, 3, (Math.random()-0.5)*220);
    b.rotation.y = Math.random()*Math.PI;
    b.material = new BABYLON.StandardMaterial('bm'+i, scene);
    b.material.diffuseColor = new BABYLON.Color3(0.45,0.36,0.24);
  }

  player = BABYLON.MeshBuilder.CreateBox('player', {height:2, width:1.1, depth:0.8}, scene);
  player.position = new BABYLON.Vector3(0,1,0);
  const pm = new BABYLON.StandardMaterial('pm', scene);
  pm.diffuseColor = new BABYLON.Color3(0.15,0.16,0.12);
  pm.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
  player.material = pm;

  const head = BABYLON.MeshBuilder.CreateSphere('head', {diameter:0.56, segments:8}, scene);
  head.parent = player; head.position = new BABYLON.Vector3(0,0.92,0);
  const pack = BABYLON.MeshBuilder.CreateBox('pack',{height:0.6, width:0.9, depth:0.2}, scene);
  pack.parent = player; pack.position = new BABYLON.Vector3(0,-0.1,-0.45);

  const camTarget = new BABYLON.TransformNode('target', scene);
  camTarget.parent = player; camTarget.position = new BABYLON.Vector3(0,1.2,0);
  camera.lockedTarget = camTarget;

  spawnEnemiesForLevel(level);

  return scene;
}

function spawnEnemiesForLevel(lvl){
  enemies.forEach(e=>{ try{ e.dispose(); }catch(e){} });
  enemies = [];
  const count = 3;
  enemyHealth = 0;
  for(let i=0;i<count;i++){
    const e = BABYLON.MeshBuilder.CreateBox('enemy'+i,{height:1.8, width:1, depth:0.8}, scene);
    e.position = new BABYLON.Vector3((Math.random()-0.5)*120 + 50*(i-1), 0.9, (Math.random()-0.5)*120 + 50);
    const em = new BABYLON.StandardMaterial('em'+i, scene);
    em.diffuseColor = new BABYLON.Color3(0.55,0.12 + i*0.04,0.12);
    e.material = em;
    e.metadata = {health: 80 + lvl*10, speed: 0.03 + lvl*0.005, alive:true, fall:0, cooldown: 0};
    enemies.push(e);
    enemyHealth += e.metadata.health;
  }
  updateHud();
}

let input = {w:false,a:false,s:false,d:false};
window.addEventListener('keydown',(e)=>{ const k=e.key.toLowerCase(); if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k)) { if(k==='arrowup') input.w=true; else if(k==='arrowdown') input.s=true; else if(k==='arrowleft') input.a=true; else if(k==='arrowright') input.d=true; else input[k]=true; } });
window.addEventListener('keyup',(e)=>{ const k=e.key.toLowerCase(); if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k)) { if(k==='arrowup') input.w=false; else if(k==='arrowdown') input.s=false; else if(k==='arrowleft') input.a=false; else if(k==='arrowright') input.d=false; else input[k]=false; } });

canvas.addEventListener('pointerdown',(e)=>{ if(e.button===0) firePlayerBullet(); });
canvas.addEventListener('touchstart',(ev)=>{ firePlayerBullet(); });

function firePlayerBullet(){
  const b = BABYLON.MeshBuilder.CreateSphere('pb',{diameter:0.12}, scene);
  const forward = new BABYLON.Vector3(0,0,1);
  const m = player.getWorldMatrix();
  const dir = BABYLON.Vector3.TransformNormal(forward, m).normalize();
  b.position = player.position.clone().add(new BABYLON.Vector3(0,0.9,0)).add(dir.scale(1.4));
  const bullet = {mesh: b, dir: dir, speed: 1.8, life: 140, owner:'player'};
  bullets.push(bullet);
}

function updateBullets(){
  for(let i=bullets.length-1;i>=0;i--){
    const bt = bullets[i];
    try{ bt.mesh.position.addInPlace(bt.dir.scale(bt.speed)); }catch(e){ bullets.splice(i,1); continue; }
    bt.life--;
    if(bt.owner === 'player'){
      for(let j=0;j<enemies.length;j++){
        const e = enemies[j];
        if(e.metadata.alive && e.intersectsMesh(bt.mesh, false)){
          e.metadata.health -= 35;
          enemyHealth -= 35;
          try{ bt.mesh.dispose(); }catch(e){};
          bullets.splice(i,1);
          if(e.metadata.health <= 0){
            e.metadata.alive = false;
            e.metadata.fall = 1;
          }
          updateHud();
          break;
        }
      }
    } else {
      if(bt.mesh.intersectsMesh(player, false)){
        playerHealth -= 12;
        try{ bt.mesh.dispose(); }catch(e){};
        bullets.splice(i,1);
        updateHud();
        if(playerHealth <= 0){
          showDefeat();
          return;
        }
      }
    }
    if(bt && bt.life <= 0){ try{ bt.mesh.dispose(); }catch(e){}; bullets.splice(i,1); }
  }
}

function updateEnemies(){
  enemies.forEach(e=>{
    if(!e.metadata.alive){
      if(e.metadata.fall > 0){
        e.rotation.z += 0.03;
        e.position.y -= 0.02;
        e.metadata.fall++;
        if(e.metadata.fall > 100){ try{ e.dispose(); }catch(er){} }
      }
      return;
    }
    const toPlayer = player.position.subtract(e.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const dir = toPlayer.normalize();
    const offset = new BABYLON.Vector3(Math.sin(performance.now()*0.0005 + e.position.x)*0.5,0,Math.cos(performance.now()*0.0004 + e.position.z)*0.5);
    const target = player.position.add(offset);
    const toTarget = target.subtract(e.position); toTarget.y = 0;
    const tdir = toTarget.normalize();
    if(dist > 4.5){
      e.moveWithCollisions(tdir.scale(e.metadata.speed * 3));
      e.lookAt(new BABYLON.Vector3(player.position.x, e.position.y, player.position.z));
    } else {
      if(e.metadata.cooldown <= 0){
        const b = BABYLON.MeshBuilder.CreateSphere('eb',{diameter:0.12}, scene);
        b.position = e.position.clone().add(new BABYLON.Vector3(0,0.9,0));
        const dirE = player.position.subtract(e.position).normalize();
        bullets.push({mesh: b, dir: dirE, speed: 0.9 + Math.random()*0.6, life: 180, owner:'enemy'});
        e.metadata.cooldown = 60 + Math.random()*60;
      } else {
        e.metadata.cooldown = Math.max(0, e.metadata.cooldown - 1);
      }
    }
  });
}

function showDefeat(){
  alert('هزيمة! سيتم إعادة التشغيل.');
  window.location.reload();
}

function showVictory(){
  alert('انتصار! مبروك — سيتم إعادة التشغيل.');
  window.location.reload();
}

function checkWinLose(){
  const aliveCount = enemies.filter(e=>e.metadata && e.metadata.alive).length;
  if(aliveCount === 0){
    showVictory();
  }
}

createScene();
engine.runRenderLoop(()=>{
  scene.render();
  const move = new BABYLON.Vector3(0,0,0);
  if(input.w) move.z += 1;
  if(input.s) move.z -= 1;
  if(input.a) move.x -= 1;
  if(input.d) move.x += 1;
  if(move.lengthSquared() > 0){
    move.normalize();
    player.moveWithCollisions(move.scale(0.6));
    const targetPos = player.position.add(move);
    player.lookAt(new BABYLON.Vector3(targetPos.x, player.position.y, targetPos.z));
  }
  updateEnemies();
  updateBullets();
  checkWinLose();
});
window.addEventListener('resize', ()=>{ engine.resize(); });

let dragging=false, lastX=0;
canvas.addEventListener('touchstart',(e)=>{ if(e.touches.length===1){ dragging=true; lastX=e.touches[0].clientX; } });
canvas.addEventListener('touchmove',(e)=>{ if(dragging && e.touches.length===1){ const dx = e.touches[0].clientX - lastX; lastX = e.touches[0].clientX; camera.alpha += dx * 0.002; } });
canvas.addEventListener('touchend',()=>{ dragging=false; });

setInterval(()=>{ updateHud(); }, 200);
