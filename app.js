// Role: UI制御、Three.jsによる3Dマップ描画、およびダミーアラート受信のシミュレーション

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initThreeJS();
    simulateIncomingData();
});

function initClock() {
    const timeDisplay = document.getElementById('currentTime');
    setInterval(() => {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('ja-JP', { hour12: false });
    }, 1000);
}

function initThreeJS() {
    const container = document.getElementById('three-canvas-container');
    const loading = document.getElementById('map-loading');
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 8);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Grid / Floor (部屋のベースのモック)
    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x222222);
    scene.add(gridHelper);

    // 危険エリア（ハザードマップのヒートマップ表現モック）
    const hazardGeometry = new THREE.BoxGeometry(2, 0.1, 2);
    const hazardMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4a4a, 
        transparent: true, 
        opacity: 0.4 
    });
    const hazardZone = new THREE.Mesh(hazardGeometry, hazardMaterial);
    hazardZone.position.set(-2, 0.05, -2);
    scene.add(hazardZone);

    // 子供の現在位置（モック）
    const childGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16);
    const childMaterial = new THREE.MeshStandardMaterial({ color: 0x00bceb });
    const childMesh = new THREE.Mesh(childGeometry, childMaterial);
    childMesh.position.set(1, 0.6, 1);
    scene.add(childMesh);

    // Hide loading
    setTimeout(() => {
        loading.style.display = 'none';
    }, 500);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        
        // 子供のモック移動アニメーション
        const time = Date.now() * 0.001;
        childMesh.position.x = Math.sin(time * 0.5) * 2;
        childMesh.position.z = Math.cos(time * 0.5) * 2;

        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// MQTT over WebSocket受信をシミュレートする関数
function simulateIncomingData() {
    const alertsList = document.getElementById('alerts-list');
    const tempValue = document.getElementById('temp-value');
    const doorValue = document.getElementById('door-value');

    const dummyAlerts = [
        { type: 'danger', title: '転倒検知 (MediaPipe)', desc: 'リビングで転倒の可能性があります。' },
        { type: 'danger', title: '危険エリア接近 (YOLO)', desc: 'キッチン付近の危険エリアに侵入しました。' },
        { type: 'info', title: 'ドア開閉検知 (MT20)', desc: '玄関のドアが開きました。' }
    ];

    // 10秒ごとにランダムなアラートをUIに追加
    setInterval(() => {
        const emptyState = alertsList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const alert = dummyAlerts[Math.floor(Math.random() * dummyAlerts.length)];
        const timeStr = new Date().toLocaleTimeString('ja-JP', { hour12: false });
        
        const alertEl = document.createElement('div');
        alertEl.className = `alert-item ${alert.type}`;
        alertEl.innerHTML = `
            <div class="alert-header">
                <span class="alert-title"><i class="fa-solid ${alert.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-info-circle'}"></i> ${alert.title}</span>
                <span class="alert-time">${timeStr}</span>
            </div>
            <div class="alert-desc">${alert.desc}</div>
        `;
        
        alertsList.insertBefore(alertEl, alertsList.firstChild);

        // リストが長くなりすぎたら古いものを削除
        if (alertsList.children.length > 5) {
            alertsList.removeChild(alertsList.lastChild);
        }
    }, 10000);

    // センサー値の変動シミュレーション
    setInterval(() => {
        const currentTemp = parseFloat(tempValue.textContent);
        const newTemp = currentTemp + (Math.random() * 0.4 - 0.2);
        tempValue.textContent = newTemp.toFixed(1) + '°C';

        if (Math.random() > 0.8) {
            const isClosed = doorValue.textContent === 'Closed';
            doorValue.textContent = isClosed ? 'Open' : 'Closed';
            doorValue.className = `sensor-value ${isClosed ? 'danger' : 'safe'}`;
        }
    }, 5000);
}