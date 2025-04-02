import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import modelUrl from '/model/cartoon_kitchen_interior.glb?url';

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

        // Для хранения информации о модели
        this.model = null;
        this.modelGroup = null;
        this.modelCenter = null;
        this.currentHighlightedObject = null;
        this.modelObjects = [];

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

        const manager = new THREE.LoadingManager(
            () => {
                this.remove3DLoadingIndicator();
                this.animate();
                this.populateSelectWithObjects();
                this.highlightFirstObject();
            },
            (url, itemsLoaded, itemsTotal) => {
                const progress = itemsLoaded / itemsTotal;
                this.update3DLoadingProgress(progress);
                this.animate();
            },
            (url) => {
                console.error("Ошибка загрузки ресурса:", url);
                if (this.loadingBar) {
                    this.loadingBar.material.color.setHex(0xff0000);
                }
                this.remove3DLoadingIndicator();
                this.showTestCube();
                this.animate();
            }
        );

        this.create3DLoadingIndicator();
        this.loadModel(manager, modelUrl);
    }
    loadModel(manager, url) {
        const gltfLoader = new GLTFLoader(manager);
        gltfLoader.load(
            url,
            (gltf) => {
                // Удаляем предыдущую модель, если есть
                if (this.model && this.model.parent) {
                    this.model.parent.remove(this.model);
                }

                this.model = gltf.scene;
                this.normalizeModelSize();
                console.log(this.dumpObject(this.model).join('\n'));
                // Собираем все Object3D с именами
                this.modelObjects = [];
                this.model.traverse((child) => {
                    if (child instanceof THREE.Object3D && child.name && child.type === "Object3D") {
                        this.modelObjects.push({
                            name: child.name,
                            object: child
                        });
                    }
                });

                this.scene.add(this.model);
            },
            undefined,
            (error) => {
                console.error("Ошибка загрузки модели:", error);
            }
        );
    }
    populateSelectWithObjects() {
        const select = document.getElementById('modelObjectsSelect');
        if (!select) return;

        // Очищаем select
        select.innerHTML = '<option value="">-- Select object --</option>';
        
        // Добавляем только Object3D с именами в select
        this.modelObjects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.name;
            option.textContent = obj.name;
            select.appendChild(option);
        });

        // Добавляем обработчик изменения выбора
        select.addEventListener('change', (e) => {
            const selectedObjectName = e.target.value;
            this.highlightObjectByName(selectedObjectName);
        });
    }

    highlightFirstObject() {
        if (this.modelObjects.length > 0) {
            this.highlightObjectByName(this.modelObjects[0].name);
        }
    }

    highlightObjectByName(objectName) {
        // Убираем подсветку с предыдущего объекта
        if (this.currentHighlightedObject) {
            this.resetObjectHighlight(this.currentHighlightedObject);
            this.currentHighlightedObject = null;
        }
    
        if (!objectName) return;
    
        // Находим точное соответствие имени объекта в иерархии
        const selectedObject = this.findExactObjectByName(objectName);
        if (!selectedObject) return;
    
        // Если это меш - подсвечиваем его
        if (selectedObject.isMesh) {
            this.highlightMesh(selectedObject);
            this.currentHighlightedObject = selectedObject;
        }
        // Если это Object3D - ищем первый дочерний Mesh (рекурсивно)
        else if (selectedObject instanceof THREE.Object3D) {
            const mesh = this.findFirstMeshChildRecursive(selectedObject);
            if (mesh) {
                this.highlightMesh(mesh);
                this.currentHighlightedObject = mesh;
            }
        }
    }

    highlightMesh(mesh) {
        // // Сохраняем оригинальные параметры материала
        // if (!mesh.userData.originalEmissive) {
        //     mesh.userData.originalEmissive = mesh.material.emissive?.getHex() || 0x000000;
        //     mesh.userData.originalEmissiveIntensity = mesh.material.emissiveIntensity || 0;
        // }
        // mesh.material = new THREE.MeshPhongMaterial({
        //     color: mesh.material.color,
        //     specular: 0xffffff, // Цвет бликов
        //     shininess: 100, // Интенсивность бликов
        // });
        // mesh.material.needsUpdate = true;
            // Сохраняем оригинальный материал, если еще не сохранили
        if (!mesh.userData.originalMaterial) {
            mesh.userData.originalMaterial = mesh.material;
        }
        
        // Создаем новый материал для подсветки на основе оригинального
        const highlightMaterial = new THREE.MeshPhongMaterial({
            color: mesh.userData.originalMaterial.color,
            specular: 0xffffff,
            shininess: 100,
            // Копируем другие важные свойства из оригинального материала
            map: mesh.userData.originalMaterial.map,
            transparent: mesh.userData.originalMaterial.transparent,
            opacity: mesh.userData.originalMaterial.opacity,
            // Добавляем emissive для эффекта подсветки
            emissive: 0xFFA500, // Оранжевый цвет подсветки
            emissiveIntensity: 0.5
        });

        // Применяем новый материал
        mesh.material = highlightMaterial;
        mesh.material.needsUpdate = true;
    }
    resetObjectHighlight(object) {
        if (object.isMesh && object.userData.originalMaterial) {
            // Восстанавливаем оригинальный материал
            object.material = object.userData.originalMaterial;
            object.material.needsUpdate = true;
            
            // Очищаем сохраненный материал (опционально)
            delete object.userData.originalMaterial;
        }
    }
    // Находит точное соответствие имени объекта в иерархии
    findExactObjectByName(name) {
        let foundObject = null;
        this.model.traverse((child) => {
            if (child.name === name) {
                foundObject = child;
            }
        });
        return foundObject;
    }
    findFirstMeshChildRecursive(object) {
        if (object.isMesh) return object;
        
        for (let i = 0; i < object.children.length; i++) {
            const child = object.children[i];
            const mesh = this.findFirstMeshChildRecursive(child);
            if (mesh) return mesh;
        }
        
        return null;
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
            side: THREE.DoubleSide, // Рисуем с двух сторон
            depthWrite: false
        });
        this.loadingBg = new THREE.Mesh(bgGeometry, bgMaterial);
    
        const barGeometry = new THREE.PlaneGeometry(1.9, 0.15);
        const barMaterial = new THREE.MeshBasicMaterial({
            name: 'barMaterial',
            color: 0x00ff00, // Зеленый для наглядности
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.loadingBar = new THREE.Mesh(barGeometry, barMaterial);
        this.loadingBar.scale.x = 0; // Начинаем с 0
    
        this.loadingBg.position.set(0, 0, -1); // z = -3 (перед камерой)
        this.loadingBar.position.set(0, 0, -0.9); // Чуть ближе к камере
    
        this.scene.add(this.loadingBg);
        this.scene.add(this.loadingBar);
    }

    update3DLoadingProgress(progress) {
        if (this.loadingBar) {
            this.loadingBar.scale.x = Math.min(1, Math.max(0, progress));
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
    // if (!isMobileDevice()) {
    // }
    const canvasContainer = document.querySelector('[canvas]');
    if (canvasContainer) {
        const canvas = new CanvasTride(canvasContainer);
        canvas.init();
    } else {
        console.error("Элемент с атрибутом 'canvas' не найден");
    }
});

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || 
           (navigator.userAgent.indexOf('IEMobile') !== -1);
}