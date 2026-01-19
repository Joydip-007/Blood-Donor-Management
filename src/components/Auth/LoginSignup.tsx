import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';

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
    <div 
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-black"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Blood Particle Background */}
      <div className="absolute inset-0 z-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <FluidParticles
          particleDensity={80}
          particleSize={1.5}
          particleColor="#8B0000"
          activeColor="#FF0000"
          maxBlastRadius={350}
          interactionDistance={120}
        />
      </div>

      {/* Login Dialog */}
      <div className="relative z-20 w-full max-w-md mx-4" style={{ position: 'relative', zIndex: 20 }}>
        <div 
          className="rounded-2xl shadow-2xl p-8 border-2"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.85)', 
            borderColor: '#8B0000',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="text-center mb-8">
            {/* Blood Drop Logo */}
            <div 
              className="inline-block p-4 rounded-full mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)',
                boxShadow: '0 0 30px rgba(220, 20, 60, 0.5)'
              }}
            >
              <svg 
                className="w-12 h-12" 
                fill="#FF0000" 
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' }}
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <h1 
              className="text-3xl font-bold"
              style={{ 
                color: '#FF0000',
                textShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
              }}
            >
              Blood Donor Portal
            </h1>
            <p className="mt-2 font-medium" style={{ color: '#DC143C' }}>Secure OTP-based authentication</p>
          </div>

          {error && (
            <div 
              className="mb-4 p-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(139, 0, 0, 0.3)', border: '1px solid #FF0000' }}
            >
              <AlertCircle size={20} style={{ color: '#FF0000' }} />
              <span className="text-sm font-medium" style={{ color: '#FF6B6B' }}>{error}</span>
            </div>
          )}

          {success && (
            <div 
              className="mb-4 p-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(0, 100, 0, 0.3)', border: '1px solid #00FF00' }}
            >
              <CheckCircle size={20} style={{ color: '#00FF00' }} />
              <span className="text-sm font-medium" style={{ color: '#90EE90' }}>{success}</span>
            </div>
          )}

          {demoOtp && (
            <div 
              className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: 'rgba(139, 0, 0, 0.2)', border: '1px solid #DC143C' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#FF6B6B' }}>Demo OTP: {demoOtp}</p>
              <p className="text-xs mt-1" style={{ color: '#DC143C' }}>Use this code to verify (demo only)</p>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#DC143C' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                    size={20} 
                    style={{ color: '#FF0000' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg font-medium"
                    style={{ 
                      backgroundColor: 'rgba(139, 0, 0, 0.2)',
                      border: '2px solid #8B0000',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={requestOTP}
                disabled={loading || !validateEmail(email)}
                className="w-full py-3 rounded-lg font-semibold transition-all shadow-lg disabled:cursor-not-allowed"
                style={{ 
                  background: loading || !validateEmail(email) 
                    ? 'rgba(100, 100, 100, 0.5)' 
                    : 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)',
                  color: '#FFFFFF',
                  boxShadow: loading || !validateEmail(email) 
                    ? 'none' 
                    : '0 0 20px rgba(220, 20, 60, 0.5)'
                }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#DC143C' }}
                >
                  Enter OTP
                </label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                    size={20} 
                    style={{ color: '#FF0000' }}
                  />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-center text-2xl tracking-wider font-bold"
                    style={{ 
                      backgroundColor: 'rgba(139, 0, 0, 0.2)',
                      border: '2px solid #8B0000',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                    maxLength={6}
                  />
                </div>
                <p 
                  className="text-xs mt-2 font-medium"
                  style={{ color: '#DC143C' }}
                >
                  OTP sent to {email}
                </p>
              </div>

              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-lg font-semibold transition-all shadow-lg disabled:cursor-not-allowed"
                style={{ 
                  background: loading || otp.length !== 6 
                    ? 'rgba(100, 100, 100, 0.5)' 
                    : 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)',
                  color: '#FFFFFF',
                  boxShadow: loading || otp.length !== 6 
                    ? 'none' 
                    : '0 0 20px rgba(220, 20, 60, 0.5)'
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setDemoOtp('');
                }}
                className="w-full py-2 text-sm font-semibold hover:underline"
                style={{ color: '#FF6B6B' }}
              >
                Change email
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs">
            <p className="font-semibold" style={{ color: '#DC143C' }}>Secure OTP-based authentication</p>
            <p className="mt-1" style={{ color: '#8B0000' }}>Prevents fake and duplicate registrations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
