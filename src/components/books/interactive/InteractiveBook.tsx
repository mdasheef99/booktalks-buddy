
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';

// Book cover and page textures
const BOOK_TEXTURES = {
  cover: '/textures/book-cover.jpg',
  page: '/textures/book-page.jpg',
  spine: '/textures/book-spine.jpg',
  edgeTexture: '/textures/book-edge.jpg',
};

// Available genres with colors and descriptions
const GENRES = [
  { id: 'fiction', name: 'Fiction', color: '#9c6644', description: 'Explore worlds of imagination and creativity' },
  { id: 'mystery', name: 'Mystery', color: '#2c3e50', description: 'Solve puzzles and unravel secrets' },
  { id: 'romance', name: 'Romance', color: '#d64161', description: 'Experience love stories and relationships' },
  { id: 'scifi', name: 'Science Fiction', color: '#3498db', description: 'Discover futuristic worlds and technology' },
  { id: 'fantasy', name: 'Fantasy', color: '#8e44ad', description: 'Journey through magical realms and adventures' },
  { id: 'nonfiction', name: 'Non-Fiction', color: '#2ecc71', description: 'Learn from true stories and facts' },
];

// The main component that renders the 3D book scene
const InteractiveBook: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="w-full h-[600px] bg-bookconnect-cream relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        <fog attach="fog" args={['#f0e6d6', 10, 30]} />
        
        <Book position={[0, 0, 0]} />
        
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={7}
        />
        
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -1.5, 0]} 
          receiveShadow
        >
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial 
            color="#5c4033" 
            roughness={1} 
            metalness={0} 
          />
        </mesh>
      </Canvas>
      
      {/* Mobile fallback instructions */}
      {isMobile && (
        <div className="absolute bottom-4 left-0 right-0 bg-bookconnect-brown/80 text-white p-4 text-center">
          <p>For best experience, use gestures to rotate and zoom the book</p>
        </div>
      )}

      {/* Accessibility alternative */}
      <div className="absolute bottom-4 right-4">
        <Button 
          variant="outline" 
          onClick={() => document.getElementById('accessible-genres')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-bookconnect-terracotta/90 hover:bg-bookconnect-terracotta text-white"
        >
          Skip 3D Experience
        </Button>
      </div>
    </div>
  );
};

// The Book model component
const Book = (props: JSX.IntrinsicElements['group']) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoverGenre, setHoverGenre] = useState<string | null>(null);
  const bookRef = useRef<THREE.Group>(null);
  const coverRef = useRef<THREE.Mesh>(null);
  const pageRefs = useRef<THREE.Mesh[]>([]);
  const navigate = useNavigate();
  
  // Load textures
  const textures = {
    cover: useTexture(BOOK_TEXTURES.cover),
    page: useTexture(BOOK_TEXTURES.page),
    spine: useTexture(BOOK_TEXTURES.spine),
    edge: useTexture(BOOK_TEXTURES.edgeTexture)
  };

  // Set texture properties
  Object.values(textures).forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });
  
  // Animation for opening book
  useFrame((state) => {
    if (!bookRef.current) return;
    
    // Gentle idle animation
    bookRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.03;
    
    // Opening animation
    if (coverRef.current) {
      const targetRotation = isOpen ? -Math.PI / 1.5 : 0;
      coverRef.current.rotation.y += (targetRotation - coverRef.current.rotation.y) * 0.1;
    }
    
    // Page turning animations
    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      
      const isPageTurned = index < currentPage;
      const targetRotation = isPageTurned && isOpen ? -Math.PI / 1.5 : 0;
      page.rotation.y += (targetRotation - page.rotation.y) * 0.1;
    });
  });
  
  const handleGenreSelect = (genre: string) => {
    console.log(`Selected genre: ${genre}`);
    
    // Animate page turn
    const genreIndex = GENRES.findIndex(g => g.id === genre);
    if (genreIndex >= 0) {
      setCurrentPage(genreIndex + 1);
      
      // Navigate to chat selection with genre after animation
      setTimeout(() => {
        localStorage.setItem("selected_genre", GENRES[genreIndex].name);
        navigate(`/chat-selection?genre=${genre}`);
      }, 1500);
    }
  };
  
  return (
    <group ref={bookRef} {...props} position={[0, -0.5, 0]} castShadow>
      {/* Book base/spine */}
      <mesh castShadow receiveShadow position={[-0.9, 0, 0]}>
        <boxGeometry args={[0.2, 3, 4]} />
        <meshStandardMaterial map={textures.spine} roughness={0.7} />
      </mesh>
      
      {/* Book cover */}
      <mesh 
        ref={coverRef}
        position={[0, 0, 0]} 
        castShadow
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <boxGeometry args={[0.1, 3, 4]} />
        <meshStandardMaterial map={textures.cover} roughness={0.7} />
      </mesh>
      
      {/* Book pages */}
      {GENRES.map((genre, index) => (
        <mesh
          key={genre.id}
          ref={el => { if (el) pageRefs.current[index] = el }}
          position={[-0.6 + index * 0.02, 0, 0]}
          castShadow
          onClick={() => isOpen && handleGenreSelect(genre.id)}
          onPointerOver={() => setHoverGenre(genre.id)}
          onPointerOut={() => setHoverGenre(null)}
        >
          <boxGeometry args={[0.01, 2.9, 3.9]} />
          <meshStandardMaterial 
            map={textures.page} 
            roughness={0.9}
            color={hoverGenre === genre.id ? new THREE.Color(genre.color).multiplyScalar(1.2) : '#f4efe1'}
          />
          
          {/* Genre content on page */}
          {isOpen && (
            <Html
              position={[0.1, 0, 0]}
              rotation={[0, 0, 0]}
              transform
              occlude
              distanceFactor={10}
            >
              <div 
                className={`w-64 h-48 p-4 flex flex-col justify-center items-center
                  transition-all duration-300 ${hoverGenre === genre.id ? 'scale-110' : 'scale-100'}`}
                style={{
                  opacity: hoverGenre === genre.id ? 1 : 0.9,
                  pointerEvents: 'none'
                }}
              >
                <h3 className="text-2xl font-serif font-bold mb-2" style={{ color: genre.color }}>
                  {genre.name}
                </h3>
                <p className="text-bookconnect-brown text-center mb-4">{genre.description}</p>
                <div 
                  className="rounded-full px-3 py-1 text-sm"
                  style={{ backgroundColor: genre.color, color: 'white' }}
                >
                  Click to Join
                </div>
              </div>
            </Html>
          )}
        </mesh>
      ))}
      
      {/* Book back cover */}
      <mesh position={[-0.6 + GENRES.length * 0.02, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 3, 4]} />
        <meshStandardMaterial map={textures.cover} roughness={0.7} />
      </mesh>
      
      {/* Book instructions */}
      {!isOpen && (
        <Html position={[1, 0, 0]} transform>
          <div className="w-48 bg-bookconnect-cream/90 p-4 rounded-md shadow-md">
            <h3 className="text-bookconnect-brown font-serif font-bold">Join the Conversation</h3>
            <p className="text-bookconnect-brown/80 text-sm mt-2">Click the book to open it and select a genre</p>
          </div>
        </Html>
      )}
    </group>
  );
};

// Accessible alternative for genre selection
export const AccessibleGenreSelector: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGenreSelect = (genre: string) => {
    const genreObj = GENRES.find(g => g.id === genre);
    if (genreObj) {
      localStorage.setItem("selected_genre", genreObj.name);
      navigate(`/chat-selection?genre=${genre}`);
    }
  };
  
  return (
    <div id="accessible-genres" className="py-12 bg-bookconnect-parchment">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-serif font-bold text-bookconnect-brown mb-6 text-center">Choose a Genre to Start Chatting</h2>
        <p className="text-center text-bookconnect-brown/80 mb-8">Select the type of books you want to discuss anonymously</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {GENRES.map(genre => (
            <div 
              key={genre.id}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 hover:shadow-lg transition-all cursor-pointer"
              style={{ borderLeftColor: genre.color }}
              onClick={() => handleGenreSelect(genre.id)}
            >
              <h3 className="text-xl font-serif font-semibold mb-2" style={{ color: genre.color }}>
                {genre.name}
              </h3>
              <p className="text-bookconnect-brown/80 text-sm mb-4">{genre.description}</p>
              <div className="flex justify-end">
                <Button 
                  className="text-white flex items-center"
                  style={{ backgroundColor: genre.color }}
                >
                  Join <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveBook;
