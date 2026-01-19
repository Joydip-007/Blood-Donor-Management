import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { cn } from '../../lib/utils';

// ============== BLOOD PARTICLE ANIMATION ==============
interface FluidParticlesProps {
  particleDensity?: number;
  particleSize?: number;
  particleColor?: string;
  activeColor?: string;
  maxBlastRadius?: number;
  hoverDelay?: number;
  interactionDistance?: number;
}

class Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  color: string;
  vx: number;
  vy: number;
  friction: number;
  particleSize: number;
  particleColor: string;
  activeColor: string;
  interactionDistance: number;
  mouseRef: React.MutableRefObject<{ x: number; y: number; prevX: number; prevY: number }>;
  blastRef: React.MutableRefObject<{ active: boolean; x: number; y: number; radius: number; maxRadius: number }>;

  constructor(
    x: number,
    y: number,
    particleSize: number,
    particleColor: string,
    activeColor: string,
    interactionDistance: number,
    mouseRef: React.MutableRefObject<{ x: number; y: number; prevX: number; prevY: number }>,
    blastRef: React.MutableRefObject<{ active: boolean; x: number; y: number; radius: number; maxRadius: number }>
  ) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.size = Math.random() * particleSize + 0.5;
    this.density = Math.random() * 3 + 1;
    this.color = particleColor;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.9 - 0.01 * this.density;
    this.particleSize = particleSize;
    this.particleColor = particleColor;
    this.activeColor = activeColor;
    this.interactionDistance = interactionDistance;
    this.mouseRef = mouseRef;
    this.blastRef = blastRef;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;

    const dx = this.mouseRef.current.x - this.x;
    const dy = this.mouseRef.current.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.interactionDistance) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (this.interactionDistance - distance) / this.interactionDistance;

      this.x -= forceDirectionX * force * this.density * 0.6;
      this.y -= forceDirectionY * force * this.density * 0.6;
      this.color = this.activeColor;
    } else {
      if (this.x !== this.baseX) {
        const dx = this.x - this.baseX;
        this.x -= dx / 20;
      }
      if (this.y !== this.baseY) {
        const dy = this.y - this.baseY;
        this.y -= dy / 20;
      }
      this.color = this.particleColor;
    }

    if (this.blastRef.current.active) {
      const blastDx = this.x - this.blastRef.current.x;
      const blastDy = this.y - this.blastRef.current.y;
      const blastDistance = Math.sqrt(blastDx * blastDx + blastDy * blastDy);

      if (blastDistance < this.blastRef.current.radius) {
        const blastForceX = blastDx / (blastDistance || 1);
        const blastForceY = blastDy / (blastDistance || 1);
        const blastForce = (this.blastRef.current.radius - blastDistance) / this.blastRef.current.radius;

        this.vx += blastForceX * blastForce * 15;
        this.vy += blastForceY * blastForce * 15;

        const intensity = Math.min(255, Math.floor(255 - blastDistance));
        this.color = `rgba(${intensity}, 0, 0, 0.8)`;
      }
    }
  }
}

function FluidParticles({
  particleDensity = 80,
  particleSize = 1.5,
  particleColor = "#8B0000",
  activeColor = "#FF0000",
  maxBlastRadius = 350,
  interactionDistance = 120,
}: FluidParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  const blastRef = useRef({ active: false, x: 0, y: 0, radius: 0, maxRadius: maxBlastRadius });
  const animationRef = useRef<number>(0);

  const initParticles = useCallback(() => {
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / particleDensity);

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      particlesRef.current.push(
        new Particle(x, y, particleSize, particleColor, activeColor, interactionDistance, mouseRef, blastRef)
      );
    }
  }, [particleDensity, particleSize, particleColor, activeColor, interactionDistance]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particlesRef.current.forEach((particle) => {
      particle.update();
      particle.draw(ctx);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    contextRef.current = canvas.getContext("2d", { alpha: true });

    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = "lighter";
    }

    const handleResize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      if (contextRef.current) {
        contextRef.current.scale(pixelRatio, pixelRatio);
      }

      initParticles();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let lastMoveTime = 0;
    const moveThrottle = 10;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < moveThrottle) return;
      lastMoveTime = now;

      const prevX = mouseRef.current.x;
      const prevY = mouseRef.current.y;
      mouseRef.current = { x: e.x, y: e.y, prevX, prevY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initParticles]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

// ============== MORPHING TEXT ANIMATION ==============
const morphTime = 1.5;
const cooldownTime = 0.5;

const useMorphingText = (texts: string[]) => {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2 || !texts || texts.length === 0) return;

      current2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction = 1 - fraction;
      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts]
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter = "none";
      current2.style.opacity = "100%";
      current1.style.filter = "none";
      current1.style.opacity = "0%";
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

interface MorphingTextProps {
  className?: string;
  texts: string[];
}

const SvgFilters: React.FC = () => (
  <svg id="filters" className="hidden" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

const MorphingText: React.FC<MorphingTextProps> = ({ texts, className }) => {
  const { text1Ref, text2Ref } = useMorphingText(texts);

  return (
    <div
      className={cn(
        "relative mx-auto h-16 w-full max-w-4xl text-center font-sans text-4xl font-bold leading-none md:h-20 md:text-5xl lg:text-6xl",
        "[filter:url(#threshold)_blur(0.6px)]",
        className
      )}
    >
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text1Ref} />
      <span className="absolute inset-x-0 top-0 m-auto inline-block w-full" ref={text2Ref} />
      <SvgFilters />
    </div>
  );
};

// ============== MAIN LOGIN COMPONENT ==============
export function LoginSignup() {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  
  const { login } = useAuth();

  const morphingTexts = [
    "Save Lives",
    "Donate Blood",
    "Be a Hero",
    "Give Hope",
    "Share Life"
  ];

  const requestOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            type: 'login',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send OTP');
      }

      const data = await response.json();
      setDemoOtp(data.otp);
      setSuccess('OTP sent successfully! Check your email');
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await login(email, '', otp);
      
      const userStr = localStorage.getItem('authUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        if (userData.isAdmin) {
          console.log('Admin login detected, redirecting to admin dashboard');
          window.location.href = '/';
        } else if (userData.isRegistered) {
          console.log('Existing donor login, redirecting to dashboard');
          window.location.href = '/';
        } else {
          console.log('New user, registration required');
          window.location.href = '/';
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Blood Particle Background */}
      <div className="absolute inset-0 z-0">
        <FluidParticles
          particleDensity={80}
          particleSize={1.5}
          particleColor="#8B0000"
          activeColor="#FF0000"
          maxBlastRadius={350}
          interactionDistance={120}
        />
      </div>

      {/* Morphing Text Overlay */}
      <div className="absolute top-16 left-0 right-0 z-10 px-4">
        <MorphingText texts={morphingTexts} className="text-red-600" />
      </div>

      {/* Login Dialog */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-red-600/20">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-full mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
              Blood Donor Portal
            </h1>
            <p className="text-gray-700 mt-2 font-medium">Secure OTP-based authentication</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-2 text-green-800">
              <CheckCircle size={20} />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          {demoOtp && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">🔒 Demo OTP: {demoOtp}</p>
              <p className="text-xs text-blue-700 mt-1">Use this code to verify (demo only)</p>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={requestOTP}
                disabled={loading || !validateEmail(email)}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Enter OTP
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-2xl tracking-wider font-bold"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  OTP sent to {email}
                </p>
              </div>

              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setDemoOtp('');
                }}
                className="w-full text-red-700 py-2 text-sm font-semibold hover:text-red-900 hover:underline"
              >
                Change email
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-600">
            <p className="font-semibold">🔒 Secure OTP-based authentication</p>
            <p className="mt-1">Prevents fake and duplicate registrations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
