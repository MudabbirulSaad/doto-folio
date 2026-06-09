"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef, useEffect } from "react"
import * as THREE from "three"

// Vertex Shader: Screen Quad (Renders directly to clip space)
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Fragment Shader: Living Nebula Glass (v3)
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;
  
  varying vec2 vUv;

  // --- NOISE FUNCTIONS ---
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
               mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // Fractal Brownian Motion
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    
    // Aspect Ratio Correction
    float aspect = uResolution.x / uResolution.y;
    vec2 uvAspect = uv;
    uvAspect.x *= aspect;
    vec2 mouseAspect = uMouse;
    mouseAspect.x *= aspect;

    // --- 1. NEBULA BACKGROUND (Domain Warping) ---
    vec2 q = vec2(0.0);
    q.x = fbm(uvAspect + 0.05 * uTime);
    q.y = fbm(uvAspect + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(uvAspect + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
    r.y = fbm(uvAspect + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

    float f = fbm(uvAspect + r);

    // Color mixing based on noise
    // "Interstellar" tuning: Darker base, higher contrast mixing
    vec3 deepSpace = vec3(0.0, 0.0, 0.02); // Almost pitch black blue
    
    // Use pow() to crush the noise values (higher contrast)
    float noiseContrast = 2.0;
    float f_c = pow(clamp(f, 0.0, 1.0), noiseContrast);
    
    vec3 color = mix(deepSpace, uColorPrimary, clamp(f_c * 2.0, 0.0, 0.6)); // Limit max brightness of primary
    color = mix(color, uColorSecondary, clamp(length(q) * 0.5, 0.0, 0.4)); // Subtle secondary accents
    
    // Darken the background significantly for "pitch black" feel
    color *= 0.3; 

    // --- 2. GLASS RIDGES (Sharp & Diagonal) ---
    float angle = -0.785398; // -45 degrees
    float c = cos(angle);
    float s = sin(angle);
    mat2 rot = mat2(c, -s, s, c);
    mat2 rotInv = mat2(c, s, -s, c);

    vec2 p = rot * uvAspect * 4.0 + vec2(100.0);
    float strip = fract(p.x);
    float ridge = abs(strip - 0.5) * 2.0;
    float height = pow(ridge, 5.0); // Sharper glass profile
    
    // Normal Calculation
    float eps = 0.001;
    float dH = (pow(abs(fract(p.x + eps) - 0.5) * 2.0, 5.0) - height) / eps;
    vec3 normalP = normalize(vec3(-dH * 0.3, 0.0, 1.0)); // Flatter normal
    vec3 normal = normalP;
    normal.xy = rotInv * normalP.xy;

    // --- 3. LIGHTING & REFLECTION ---
    vec3 lightPos = vec3(mouseAspect, 0.5);
    vec3 lightDir = normalize(lightPos - vec3(uvAspect, 0.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    
    float dist = distance(uvAspect, mouseAspect);
    float lightIntensity = 1.0 / (1.0 + dist * dist * 1.5);

    // Specular (The "Glass" Shine)
    float NdotH = max(dot(normal, halfDir), 0.0);
    float specular = pow(NdotH, 80.0); // Very sharp

    // Anisotropic Ridge Shine (Always visible, moving with time)
    vec3 ridgeDir = vec3(rotInv * vec2(0.0, 1.0), 0.0);
    float ridgeShine = pow(max(dot(normal, normalize(vec3(0.0, 1.0, 1.0))), 0.0), 20.0);
    
    // Chromatic Aberration on Highlights
    vec3 specColor;
    specColor.r = pow(max(dot(normal + vec3(0.005), halfDir), 0.0), 80.0);
    specColor.g = specular;
    specColor.b = pow(max(dot(normal - vec3(0.005), halfDir), 0.0), 80.0);

    // --- 4. COMPOSITION ---
    vec3 finalColor = color; // Start with dark nebula
    
    // Add glass reflections (keep these bright for contrast)
    finalColor += specColor * 2.0 * lightIntensity; // Mouse interaction
    finalColor += ridgeShine * uColorSecondary * 0.05; // Reduced ambient shine for darkness
    
    // Vignette (stronger for space feel)
    float vignette = 1.0 - smoothstep(0.2, 1.5, length(vUv - 0.5));
    finalColor *= vignette;

    // Dither
    finalColor += (random(uv + uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function NebulaGlass() {
    const mesh = useRef<THREE.Mesh>(null)
    const { size } = useThree()

    // Initialize with default colors, will update from CSS
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uColorPrimary: { value: new THREE.Color("#ff3366") },
            uColorSecondary: { value: new THREE.Color("#ffffff") },
        }),
        []
    )

    // Handle mouse movement
    const targetMouse = useRef(new THREE.Vector2(0.5, 0.5))

    useEffect(() => {
        // Get computed colors from CSS variables
        const updateColors = () => {
            // Note: OKLCH parsing might not be supported by THREE.Color directly in all versions.
            // We'll try to grab the hex or fallback to known values if needed.
            // For now, let's assume we can get a valid color string or use the defaults.
            // Since we know the OKLCH values, we can try to use them if the browser supports it, 
            // but Three.js might need conversion.

            // Hardcoded approximation for safety if CSS var parsing fails in Three.js
            // Primary: oklch(0.4341 0.0392 41.9938) -> ~#7c5c4f (Brownish Red)
            // Secondary: oklch(0.9200 0.0651 74.3695) -> ~#fce7cf (Cream/Peach)

            // Let's try to use the variable first, if it fails, fallback.
            // Actually, let's just use the hex approximations for stability in WebGL
            uniforms.uColorPrimary.value.set("#8B5E3C") // Deep warm brown/red
            uniforms.uColorSecondary.value.set("#FFD1DC") // Light pink/peach
        }

        updateColors()

        const handleMove = (e: MouseEvent | TouchEvent) => {
            let x, y
            if ('touches' in e) {
                x = e.touches[0].clientX
                y = e.touches[0].clientY
            } else {
                x = (e as MouseEvent).clientX
                y = (e as MouseEvent).clientY
            }

            const nX = x / window.innerWidth
            const nY = 1.0 - (y / window.innerHeight)
            targetMouse.current.set(nX, nY)
        }

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('touchmove', handleMove)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('touchmove', handleMove)
        }
    }, [uniforms])

    useFrame((state) => {
        if (mesh.current) {
            const material = mesh.current.material as THREE.ShaderMaterial
            material.uniforms.uTime.value = state.clock.elapsedTime
            material.uniforms.uMouse.value.lerp(targetMouse.current, 0.05) // Slower, smoother follow
            material.uniforms.uResolution.value.set(size.width, size.height)
        }
    })

    return (
        <mesh ref={mesh}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    )
}

export function HeroAnimation() {
    return (
        <div className="absolute inset-0 -z-10">
            <Canvas
                camera={{ position: [0, 0, 1], fov: 75 }}
                dpr={[1, 2]} // Optimization: Cap DPR at 2 for performance
                gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    alpha: true
                }}
            >
                <NebulaGlass />
            </Canvas>
        </div>
    )
}
