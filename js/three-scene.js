/* =============================================
   THREE-SCENE — 3D Background with Three.js
   Animated geometric shapes, floating particles,
   and interactive depth effects
   ============================================= */

(function () {
    'use strict';

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Wait for Three.js to load
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded');
        return;
    }

    const container = document.getElementById('three-bg');
    if (!container) return;

    // ===== SCENE SETUP =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ===== MATERIALS =====
    const accentColor = 0x60a5fa;
    const secondaryColor = 0xa78bfa;
    const emeraldColor = 0x6ee7b7;

    const wireMaterial = new THREE.MeshBasicMaterial({
        color: accentColor,
        wireframe: true,
        transparent: true,
        opacity: 0.06
    });

    const wireMaterial2 = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.04
    });

    const wireMaterial3 = new THREE.MeshBasicMaterial({
        color: emeraldColor,
        wireframe: true,
        transparent: true,
        opacity: 0.04
    });

    // ===== GEOMETRIC OBJECTS =====
    const geometries = [];

    // Large icosahedron
    const ico = new THREE.Mesh(
        new THREE.IcosahedronGeometry(6, 1),
        wireMaterial
    );
    ico.position.set(-15, 5, -10);
    scene.add(ico);
    geometries.push({ mesh: ico, rotSpeed: { x: 0.002, y: 0.003, z: 0.001 }, floatSpeed: 0.0008, floatAmp: 2, phase: 0 });

    // Torus
    const torus = new THREE.Mesh(
        new THREE.TorusGeometry(4, 1.2, 16, 32),
        wireMaterial2
    );
    torus.position.set(18, -8, -15);
    scene.add(torus);
    geometries.push({ mesh: torus, rotSpeed: { x: 0.003, y: 0.002, z: 0.001 }, floatSpeed: 0.001, floatAmp: 3, phase: Math.PI / 3 });

    // Octahedron
    const octa = new THREE.Mesh(
        new THREE.OctahedronGeometry(3.5, 0),
        wireMaterial3
    );
    octa.position.set(12, 10, -8);
    scene.add(octa);
    geometries.push({ mesh: octa, rotSpeed: { x: 0.001, y: 0.004, z: 0.002 }, floatSpeed: 0.0012, floatAmp: 1.5, phase: Math.PI / 2 });

    // Dodecahedron
    const dodeca = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.5, 0),
        wireMaterial.clone()
    );
    dodeca.material.opacity = 0.04;
    dodeca.position.set(-18, -10, -20);
    scene.add(dodeca);
    geometries.push({ mesh: dodeca, rotSpeed: { x: 0.002, y: 0.001, z: 0.003 }, floatSpeed: 0.0009, floatAmp: 2.5, phase: Math.PI });

    // Torus Knot
    const torusKnot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(2, 0.6, 64, 8),
        wireMaterial2.clone()
    );
    torusKnot.material.opacity = 0.03;
    torusKnot.position.set(-8, -15, -12);
    scene.add(torusKnot);
    geometries.push({ mesh: torusKnot, rotSpeed: { x: 0.001, y: 0.002, z: 0.001 }, floatSpeed: 0.0007, floatAmp: 1.8, phase: Math.PI * 1.5 });

    // Small sphere cluster
    for (let i = 0; i < 8; i++) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({
                color: [accentColor, secondaryColor, emeraldColor][i % 3],
                transparent: true,
                opacity: 0.15
            })
        );
        sphere.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20 - 10
        );
        scene.add(sphere);
        geometries.push({
            mesh: sphere,
            rotSpeed: { x: 0, y: 0, z: 0 },
            floatSpeed: 0.0005 + Math.random() * 0.001,
            floatAmp: 1 + Math.random() * 3,
            phase: Math.random() * Math.PI * 2
        });
    }

    // ===== FLOATING PARTICLE GRID (3D dots) =====
    const particleCount = window.innerWidth <= 768 ? 100 : 250;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
        scales[i] = Math.random() * 0.5 + 0.1;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const particlesMat = new THREE.PointsMaterial({
        color: accentColor,
        size: 0.08,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true
    });

    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleMesh);

    // ===== CONNECTING LINES (neural network effect) =====
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    function createConnections() {
        // Clear old lines
        while (lineGroup.children.length > 0) {
            lineGroup.remove(lineGroup.children[0]);
        }

        const posArr = particlesGeo.attributes.position.array;
        const maxDist = 8;
        const maxLines = 60;
        let lineCount = 0;

        for (let i = 0; i < particleCount && lineCount < maxLines; i++) {
            for (let j = i + 1; j < particleCount && lineCount < maxLines; j++) {
                const dx = posArr[i * 3] - posArr[j * 3];
                const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
                const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.06;
                    const lineGeo = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]),
                        new THREE.Vector3(posArr[j * 3], posArr[j * 3 + 1], posArr[j * 3 + 2])
                    ]);
                    const lineMat = new THREE.LineBasicMaterial({
                        color: accentColor,
                        transparent: true,
                        opacity: opacity
                    });
                    lineGroup.add(new THREE.Line(lineGeo, lineMat));
                    lineCount++;
                }
            }
        }
    }
    createConnections();

    // ===== MOUSE INTERACTION =====
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ===== SCROLL-BASED DEPTH =====
    let scrollProgress = 0;
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = window.scrollY / docHeight;
    }, { passive: true });

    // ===== ANIMATION LOOP =====
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Camera subtle movement based on mouse
        camera.position.x = mouse.x * 3;
        camera.position.y = mouse.y * 2;
        camera.lookAt(0, 0, -10);

        // Rotate and float geometries
        geometries.forEach(g => {
            g.mesh.rotation.x += g.rotSpeed.x;
            g.mesh.rotation.y += g.rotSpeed.y;
            g.mesh.rotation.z += g.rotSpeed.z;
            g.mesh.position.y += Math.sin(elapsed * g.floatSpeed * 100 + g.phase) * 0.01 * g.floatAmp;
        });

        // Particle animation
        const posArr = particlesGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArr[i * 3 + 1] += Math.sin(elapsed * 0.5 + i * 0.1) * 0.003;
            posArr[i * 3] += Math.cos(elapsed * 0.3 + i * 0.15) * 0.002;
        }
        particlesGeo.attributes.position.needsUpdate = true;

        // Scroll-based scene rotation
        scene.rotation.y = scrollProgress * 0.5;
        scene.rotation.x = scrollProgress * 0.15;

        renderer.render(scene, camera);
    }

    animate();

    // ===== RESIZE HANDLER =====
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }, 100);
    });

    // ===== VISIBILITY OPTIMIZATION =====
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            renderer.setAnimationLoop(null);
        } else {
            renderer.setAnimationLoop(null);
            animate();
        }
    });

})();
