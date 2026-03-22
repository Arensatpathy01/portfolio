/* =============================================
   MODEL-LOADER — Section-specific 3D models
   Loads GLB/GLTF models using Three.js GLTFLoader
   Each section gets its own 3D canvas with a 
   floating, interactive model
   ============================================= */

(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Don't load 3D models on small mobile devices
    if (window.innerWidth <= 768) return;

    function waitForThree(callback, maxAttempts) {
        let attempts = 0;
        const max = maxAttempts || 50;
        function check() {
            if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
                callback();
            } else if (attempts < max) {
                attempts++;
                setTimeout(check, 100);
            } else {
                console.warn('ModelLoader: THREE.GLTFLoader not available after waiting');
            }
        }
        check();
    }

    const modelSections = [
        {
            containerId: 'model-hero',
            modelPath: 'models/robot.glb',
            scale: 2.5,
            position: { x: 0, y: -1.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            autoRotateSpeed: 0.005,
            floatAmp: 0.3,
            floatSpeed: 1.5,
            cameraZ: 6,
            lightIntensity: 3
        },
        {
            containerId: 'model-experience',
            modelPath: 'models/damaged_helmet.glb',
            scale: 2.2,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0.2, y: 0, z: 0 },
            autoRotateSpeed: 0.008,
            floatAmp: 0.2,
            floatSpeed: 1.2,
            cameraZ: 5,
            lightIntensity: 3
        },
        {
            containerId: 'model-projects',
            modelPath: 'models/brain_stem.glb',
            scale: 0.08,
            position: { x: 0, y: -0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            autoRotateSpeed: 0.006,
            floatAmp: 0.25,
            floatSpeed: 1,
            cameraZ: 8,
            lightIntensity: 4
        },
        {
            containerId: 'model-skills',
            modelPath: 'models/astronaut.glb',
            scale: 1.8,
            position: { x: 0, y: -2, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            autoRotateSpeed: 0.004,
            floatAmp: 0.15,
            floatSpeed: 0.8,
            cameraZ: 6,
            lightIntensity: 3
        }
    ];

    class ModelViewer {
        constructor(config) {
            this.config = config;
            this.container = document.getElementById(config.containerId);
            if (!this.container) return;

            this.scene = new THREE.Scene();
            this.clock = new THREE.Clock();
            this.mouse = { x: 0, y: 0 };
            this.model = null;
            this.mixer = null;
            this.isVisible = false;
            this.animationId = null;

            this.setupRenderer();
            this.setupCamera();
            this.setupLighting();
            this.setupObserver();
            this.setupMouseTracking();
            this.loadModel();
        }

        setupRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
            this.renderer.setClearColor(0x000000, 0);

            const rect = this.container.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
            this.container.appendChild(this.renderer.domElement);
        }

        setupCamera() {
            const rect = this.container.getBoundingClientRect();
            this.camera = new THREE.PerspectiveCamera(
                45,
                rect.width / rect.height,
                0.1,
                100
            );
            this.camera.position.z = this.config.cameraZ;
        }

        setupLighting() {
            // Ambient light for base illumination
            const ambient = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambient);

            // Key light - main directional (blue tinted)
            const keyLight = new THREE.DirectionalLight(0x60a5fa, this.config.lightIntensity * 0.6);
            keyLight.position.set(5, 5, 5);
            this.scene.add(keyLight);

            // Fill light (purple tinted)
            const fillLight = new THREE.DirectionalLight(0xa78bfa, this.config.lightIntensity * 0.3);
            fillLight.position.set(-5, 3, -3);
            this.scene.add(fillLight);

            // Rim light (emerald)
            const rimLight = new THREE.DirectionalLight(0x6ee7b7, this.config.lightIntensity * 0.2);
            rimLight.position.set(0, -3, -5);
            this.scene.add(rimLight);

            // Top point light for highlights
            const topLight = new THREE.PointLight(0xffffff, this.config.lightIntensity * 0.3, 20);
            topLight.position.set(0, 5, 3);
            this.scene.add(topLight);
        }

        loadModel() {
            const loader = new THREE.GLTFLoader();
            loader.load(
                this.config.modelPath,
                (gltf) => {
                    this.model = gltf.scene;

                    // Apply scale
                    this.model.scale.setScalar(this.config.scale);

                    // Apply position
                    this.model.position.set(
                        this.config.position.x,
                        this.config.position.y,
                        this.config.position.z
                    );

                    // Apply rotation
                    this.model.rotation.set(
                        this.config.rotation.x,
                        this.config.rotation.y,
                        this.config.rotation.z
                    );

                    // Enable shadows and enhance materials
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                child.material.envMapIntensity = 1.5;
                            }
                        }
                    });

                    this.scene.add(this.model);

                    // Setup animations if model has them
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                        gltf.animations.forEach(clip => {
                            const action = this.mixer.clipAction(clip);
                            action.play();
                        });
                    }

                    // Fade in container
                    this.container.style.opacity = '1';
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load model: ${this.config.modelPath}`, error);
                }
            );
        }

        setupObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.isIntersecting;
                    if (this.isVisible && !this.animationId) {
                        this.animate();
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(this.container);
        }

        setupMouseTracking() {
            this.container.addEventListener('mousemove', (e) => {
                const rect = this.container.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            });

            this.container.addEventListener('mouseleave', () => {
                this.mouse.x = 0;
                this.mouse.y = 0;
            });
        }

        animate() {
            if (!this.isVisible) {
                this.animationId = null;
                return;
            }

            this.animationId = requestAnimationFrame(() => this.animate());

            const elapsed = this.clock.getElapsedTime();
            const delta = this.clock.getDelta();

            if (this.model) {
                // Auto rotation
                this.model.rotation.y += this.config.autoRotateSpeed;

                // Floating animation
                this.model.position.y = this.config.position.y +
                    Math.sin(elapsed * this.config.floatSpeed) * this.config.floatAmp;

                // Mouse interaction - subtle rotation following cursor
                const targetRotX = this.config.rotation.x + this.mouse.y * 0.3;
                const targetRotZ = this.mouse.x * 0.1;
                this.model.rotation.x += (targetRotX - this.model.rotation.x) * 0.05;
                this.model.rotation.z += (targetRotZ - this.model.rotation.z) * 0.05;
            }

            // Update animations
            if (this.mixer) {
                this.mixer.update(delta);
            }

            this.renderer.render(this.scene, this.camera);
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            this.camera.aspect = rect.width / rect.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(rect.width, rect.height);
        }
    }

    // ===== INITIALIZE ALL MODEL VIEWERS =====
    const viewers = [];

    // Wait a bit for DOM to be ready
    function initViewers() {
        modelSections.forEach(config => {
            const container = document.getElementById(config.containerId);
            if (container) {
                const viewer = new ModelViewer(config);
                viewers.push(viewer);
            }
        });
    }

    // ===== RESIZE HANDLER =====
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            viewers.forEach(v => v.resize());
        }, 150);
    });

    // Initialize after a small delay to ensure DOM is ready and THREE is available
    function startInit() {
        waitForThree(function() {
            setTimeout(initViewers, 100);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInit);
    } else {
        startInit();
    }

})();
