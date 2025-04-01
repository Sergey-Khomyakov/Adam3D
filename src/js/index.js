import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import modelUrl from '/model/scene.gltf?url';

class CanvasTride {
    constructor(mainEl) {
        this.mainEl = mainEl;
        this.canvasWidth = this.mainEl.clientWidth;
        this.canvasHeight = this.mainEl.clientHeight;

        // Инициализация сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xeeeeee); // Фон для видимости
        
        // Камера
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.canvasWidth / this.canvasHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true // Прозрачный фон
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Освещение
        this.addLights();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Плавность
        this.controls.dampingFactor = 0.05;

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.zoomSpeed = 0.1;
        this.rotationSpeed = 0.01;
        this.scale = 1;

        // Инициализация событий
        this.initEvents();

    }
    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    init() {
        this.renderer.setSize(this.canvasWidth, this.canvasHeight);
        this.mainEl.appendChild(this.renderer.domElement);
        
        // Создаем 3D индикатор загрузки
        this.create3DLoadingIndicator();

        
        const gltfLoader = new GLTFLoader();

        gltfLoader.load(
            modelUrl,
            (gltf) => {
                this.model = gltf.scene;
                this.normalizeModelSize();
                console.log(this.dumpObject(this.model).join('\n'));
                this.scene.add(this.model);

                this.remove3DLoadingIndicator();
                this.animate();
            },
            (xhr) => {
                debugger
                const progress = xhr.loaded / xhr.total;
                this.update3DLoadingProgress(progress);
                this.animate();
            },
            (error) => {
                console.error("Ошибка загрузки модели:", error);
                
                this.remove3DLoadingIndicator();
                
                this.showTestCube();
                this.animate();
            }
        );
    }
    normalizeModelSize() {
        if (!this.model) return;
        
        const bbox = new THREE.Box3().expandByObject(this.model);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        
        // Масштабируем модель
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        // Создаем группу для модели и центрируем её
        this.modelGroup = new THREE.Group();
        this.scene.add(this.modelGroup);
        
        // Помещаем модель в группу и смещаем так, чтобы центр был в (0,0,0)
        this.model.position.sub(center.multiplyScalar(scale));
        this.modelGroup.add(this.model);
        
        // Сохраняем оригинальный центр для вращения
        this.modelCenter = center.clone().multiplyScalar(scale);
    }
    showTestCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
    }
    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    initEvents() {
        // Вращение модели при drag'n'drop
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.modelGroup) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                const deltaY = e.clientY - this.previousMousePosition.y;
                
                this.modelGroup.rotation.y += deltaX * this.rotationSpeed;
                this.modelGroup.rotation.x += deltaY * this.rotationSpeed;
                
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Приближение/отдаление колесиком мыши
        this.renderer.domElement.addEventListener('wheel', (e) => {
            if (this.modelGroup) {
                e.preventDefault();
                
                // Определяем направление скролла (1 - вниз, -1 - вверх)
                const direction = Math.sign(e.deltaY);
                
                // Изменяем масштаб с учетом направления
                this.scale *= direction > 0 ? 0.9 : 1.1; // Уменьшаем или увеличиваем масштаб
                
                // Ограничиваем масштаб минимальным и максимальным значениями
                this.scale = Math.min(Math.max(0.1, this.scale), 10);
                
                // Применяем масштаб
                this.modelGroup.scale.set(this.scale, this.scale, this.scale);
            }
        });

        // Сенсорные события для мобильных устройств
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) { // Только для одного пальца (вращение)
                this.isDragging = true;
                this.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (this.isDragging && this.modelGroup && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
                const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
                
                this.modelGroup.rotation.y += deltaX * this.rotationSpeed;
                this.modelGroup.rotation.x += deltaY * this.rotationSpeed;
                
                this.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }
    // Сброс положения модели
    resetModelPosition() {
        if (this.model) {
            this.model.rotation.set(0, 0, 0);
            this.scale = 1;
            this.model.scale.set(1, 1, 1);
            this.normalizeModelSize();
        }
    }
	dumpObject( obj, lines = [], isLast = true, prefix = '' ) {

		const localPrefix = isLast ? '└─' : '├─';
		lines.push( `${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]` );
		const newPrefix = prefix + ( isLast ? '  ' : '│ ' );
		const lastNdx = obj.children.length - 1;
		obj.children.forEach( ( child, ndx ) => {

			const isLast = ndx === lastNdx;
			this.dumpObject( child, lines, isLast, newPrefix );

		} );
		return lines;

	}

    create3DLoadingIndicator() {
        const bgGeometry = new THREE.PlaneGeometry(2, 0.2); // Ширина 2, высота 0.2
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            name: 'bgMaterial',
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide // Рисуем с двух сторон
        });
        this.loadingBg = new THREE.Mesh(bgGeometry, bgMaterial);
    
        const barGeometry = new THREE.PlaneGeometry(1.9, 0.15);
        const barMaterial = new THREE.MeshBasicMaterial({
            name: 'barMaterial',
            color: 0x00ff00, // Зеленый для наглядности
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        this.loadingBar = new THREE.Mesh(barGeometry, barMaterial);
        this.loadingBar.scale.x = 0; // Начинаем с 0
    
        this.loadingBg.position.set(0, 0, -3); // z = -3 (перед камерой)
        this.loadingBar.position.set(0, 0, -2.9); // Чуть ближе к камере
    
        this.scene.add(this.loadingBg);
        this.scene.add(this.loadingBar);
    }

    update3DLoadingProgress(progress) {
        if (this.loadingBar) {
            this.loadingBar.scale.x = progress;
        }
    }
    
    remove3DLoadingIndicator() {
        if (!this.loadingBg || !this.loadingBar) return;
        
        // Анимация fade-out
        const fadeOut = () => {
            this.loadingBg.material.opacity -= 0.05;
            this.loadingBar.material.opacity -= 0.05;
            
            if (this.loadingBg.material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(this.loadingBg);
                this.scene.remove(this.loadingBar);
                this.loadingBg = null;
                this.loadingBar = null;
            }
        };
        fadeOut();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!isMobileDevice()) {
        const canvasContainer = document.querySelector('[canvas]');
        if (canvasContainer) {
            const canvas = new CanvasTride(canvasContainer);
            canvas.init();
        } else {
            console.error("Элемент с атрибутом 'canvas' не найден");
        }
    }
});

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || 
           (navigator.userAgent.indexOf('IEMobile') !== -1);
}