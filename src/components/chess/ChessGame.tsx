import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useToast } from '@/hooks/use-toast';

/**
 * ChessGame Component
 * Renders a 3D chess board and handles game initialization
 */
export const ChessGame: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const { toast } = useToast();

  /**
   * Initializes the 3D scene, camera, and renderer
   */
  const initThreeJS = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    createChessboard();
  };

  /**
   * Creates the 3D chessboard with materials
   */
  const createChessboard = () => {
    if (!sceneRef.current) return;

    const boardGeometry = new THREE.BoxGeometry(8, 0.2, 8);
    const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.receiveShadow = true;
    sceneRef.current.add(board);

    // Create squares
    const squareGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    for (let x = -3.5; x <= 3.5; x++) {
      for (let z = -3.5; z <= 3.5; z++) {
        const isWhite = (Math.floor(x + 4) + Math.floor(z + 4)) % 2 === 0;
        const squareMaterial = new THREE.MeshPhongMaterial({
          color: isWhite ? 0xe6e6e6 : 0x4d4d4d,
        });
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.set(x, 0.15, z);
        square.receiveShadow = true;
        sceneRef.current.add(square);
      }
    }
  };

  /**
   * Animation loop for continuous rendering
   */
  const animate = () => {
    if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    requestAnimationFrame(animate);
    controlsRef.current.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  /**
   * Handles window resize events
   */
  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;

    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  // Initialize Three.js scene
  useEffect(() => {
    try {
      initThreeJS();
      animate();

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(rendererRef.current?.domElement!);
      };
    } catch (error) {
      console.error('Error initializing chess game:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chess game. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-screen"
      style={{ touchAction: 'none' }}
    />
  );
};