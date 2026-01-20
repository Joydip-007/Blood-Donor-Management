import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../utils/api";

// ============== BLOOD CELLS ANIMATION ==============
type CellType = 'rbc' | 'wbc' | 'platelet';

interface BloodCell {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  type: CellType;
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  density: number;
  friction: number;
}

function BloodCellsAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<BloodCell[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const interactionDistance = 150;

  const createCell = useCallback((x: number, y: number): BloodCell => {
    const rand = Math.random();
    let type: CellType;
    let size: number;
    
    if (rand < 0.65) {
      type = 'rbc';
      size = 25 + Math.random() * 15;
    } else if (rand < 0.85) {
      type = 'wbc';
      size = 20 + Math.random() * 12;
    } else {
      type = 'platelet';
      size = 8 + Math.random() * 6;
    }

    return {
      x,
      y,
      baseX: x,
      baseY: y,
      size,
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      vx: 0,
      vy: 0,
      density: Math.random() * 2 + 1,
      friction: 0.92
    };
  }, []);

  const drawRedBloodCell = (ctx: CanvasRenderingContext2D, cell: BloodCell) => {
    ctx.save();
    ctx.translate(cell.x, cell.y);
    ctx.rotate(cell.rotation);
    
    // Outer red cell - Glossy Gradient without expensive shadowBlur
    const gradient = ctx.createRadialGradient(
      -cell.size * 0.3, -cell.size * 0.3, cell.size * 0.1, 
      0, 0, cell.size
    );
    gradient.addColorStop(0, '#FF4444'); // Bright highlight
    gradient.addColorStop(0.4, '#CC0000');
    gradient.addColorStop(0.8, '#8B0000');
    gradient.addColorStop(1, '#550000');
    
    ctx.beginPath();
    ctx.ellipse(0, 0, cell.size, cell.size * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Inner dimple (biconcave shape)
    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cell.size * 0.5);
    innerGradient.addColorStop(0, '#660000');
    innerGradient.addColorStop(0.5, '#880000');
    innerGradient.addColorStop(1, '#AA0000');
    
    ctx.beginPath();
    ctx.ellipse(0, 0, cell.size * 0.45, cell.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    ctx.restore();
  };

  const drawWhiteBloodCell = (ctx: CanvasRenderingContext2D, cell: BloodCell) => {
    ctx.save();
    ctx.translate(cell.x, cell.y);
    ctx.rotate(cell.rotation);
    
    // Outer membrane - Glassy look
    const gradient = ctx.createRadialGradient(
        -cell.size * 0.2, -cell.size * 0.2, 0, 
        0, 0, cell.size
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, '#E8E0F0');
    gradient.addColorStop(1, '#C0B8D8');
    
    ctx.beginPath();
    ctx.arc(0, 0, cell.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#9088B0';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Multi-lobed nucleus
    ctx.fillStyle = '#6B5B8D';
    const lobes = 3;
    for (let i = 0; i < lobes; i++) {
      const angle = (i / lobes) * Math.PI * 2 + cell.rotation;
      const lobeCenterX = Math.cos(angle) * cell.size * 0.25;
      const lobeCenterY = Math.sin(angle) * cell.size * 0.25;
      ctx.beginPath();
      ctx.ellipse(lobeCenterX, lobeCenterY, cell.size * 0.28, cell.size * 0.22, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawPlatelet = (ctx: CanvasRenderingContext2D, cell: BloodCell) => {
    ctx.save();
    ctx.translate(cell.x, cell.y);
    ctx.rotate(cell.rotation);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cell.size);
    gradient.addColorStop(0, '#FFF8E1');
    gradient.addColorStop(0.6, '#E8D4A8');
    gradient.addColorStop(1, '#D4C090');
    
    ctx.beginPath();
    ctx.ellipse(0, 0, cell.size, cell.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Texture
    ctx.fillStyle = 'rgba(180, 160, 120, 0.6)';
    for (let i = 0; i < 3; i++) {
        const gx = (Math.random() - 0.5) * cell.size * 0.8;
        const gy = (Math.random() - 0.5) * cell.size * 0.4;
        ctx.beginPath();
        ctx.arc(gx, gy, cell.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  };

  const initCells = useCallback(() => {
    cellsRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cellCount = Math.floor((window.innerWidth * window.innerHeight) / 4000);

    for (let i = 0; i < cellCount; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      cellsRef.current.push(createCell(x, y));
    }
  }, [createCell]);

  const updateCell = (cell: BloodCell) => {
    cell.x += cell.vx;
    cell.y += cell.vy;
    cell.vx *= cell.friction;
    cell.vy *= cell.friction;
    cell.rotation += cell.rotationSpeed;

    // Gentle floating
    if (cell.x !== cell.baseX) cell.x -= (cell.x - cell.baseX) * 0.005;
    if (cell.y !== cell.baseY) cell.y -= (cell.y - cell.baseY) * 0.005;

    const dx = mouseRef.current.x - cell.x;
    const dy = mouseRef.current.y - cell.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < interactionDistance) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (interactionDistance - distance) / interactionDistance;

      cell.x -= forceDirectionX * force * cell.density * 3;
      cell.y -= forceDirectionY * force * cell.density * 3;
      cell.rotationSpeed += (Math.random() - 0.5) * 0.1;
    } 
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#F5C9A6';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const sortedCells = [...cellsRef.current].sort((a, b) => a.size - b.size);

    sortedCells.forEach((cell) => {
      updateCell(cell);
      switch (cell.type) {
        case 'rbc': drawRedBloodCell(ctx, cell); break;
        case 'wbc': drawWhiteBloodCell(ctx, cell); break;
        case 'platelet': drawPlatelet(ctx, cell); break;
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    contextRef.current = canvas.getContext("2d", { alpha: false });

    const handleResize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      if (contextRef.current) contextRef.current.scale(pixelRatio, pixelRatio);
      initCells();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let lastMoveTime = 0;
    const moveThrottle = 10;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < moveThrottle) return;
      lastMoveTime = now;
      mouseRef.current = { x: e.x, y: e.y };
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initCells]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

// ============== MAIN LOGIN COMPONENT ==============
export function LoginSignup() {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  const { login } = useAuth();

  const handleStepChange = (newStep: "input" | "otp") => {
    setIsExiting(true);
    setTimeout(() => {
      setStep(newStep);
      setIsExiting(false);
    }, 300); // Wait for exit animation
  };

  const requestOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, type: "login" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send OTP");
      }

      const data = await response.json();
      setDemoOtp(data.otp);
      setSuccess("OTP sent successfully! Check your email");
      handleStepChange("otp");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, "", otp);
      const userStr = localStorage.getItem("authUser");
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.isAdmin || userData.isRegistered) window.location.href = "/";
        else window.location.href = "/";
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Animation Styles
  const animationStyles = `
    @keyframes fadeInSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOutSlideDown {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
    @keyframes pulseSoft {
      0% { box-shadow: 0 0 0 0 rgba(220, 20, 60, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(220, 20, 60, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 20, 60, 0); }
    }
    .animate-enter { animation: fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-form-enter { animation: fadeInSlideUp 0.3s ease-out forwards; }
    .animate-form-exit { animation: fadeOutSlideDown 0.3s ease-in forwards; }
    .btn-pulse:hover { animation: pulseSoft 1.5s infinite; }
  `;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-black"
      style={{ backgroundColor: "#000000" }}
    >
      <style>{animationStyles}</style>

      {/* Blood Cells Background */}
      <div className="absolute inset-0 z-0">
        <BloodCellsAnimation />
      </div>

      {/* Login Dialog */}
      <div className="relative z-20 w-full max-w-md mx-4 animate-enter">
        <div
          className="rounded-2xl shadow-2xl p-8 border-2"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#8B0000",
            backdropFilter: "blur(12px)",
            boxShadow: "0 12px 40px rgba(139, 0, 0, 0.25), 0 0 0 1px rgba(139, 0, 0, 0.1)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-block p-4 rounded-full mb-4 transition-transform hover:scale-110 duration-300"
              style={{
                background: "linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)",
                boxShadow: "0 4px 20px rgba(220, 20, 60, 0.4)",
              }}
            >
              <svg
                className="w-12 h-12"
                fill="#FFFFFF"
                viewBox="0 0 24 24"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }}
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#8B0000" }}>
              Blood Donor Portal
            </h1>
            <p className="mt-2 font-medium" style={{ color: "#A52A2A" }}>
              Secure OTP-based authentication
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg flex items-center gap-2 animate-form-enter"
              style={{ backgroundColor: "rgba(220, 20, 60, 0.1)", border: "1px solid #DC143C" }}
            >
              <AlertCircle size={20} style={{ color: "#DC143C" }} />
              <span className="text-sm font-medium" style={{ color: "#8B0000" }}>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="mb-4 p-3 rounded-lg flex items-center gap-2 animate-form-enter"
              style={{ backgroundColor: "rgba(34, 139, 34, 0.1)", border: "1px solid #228B22" }}
            >
              <CheckCircle size={20} style={{ color: "#228B22" }} />
              <span className="text-sm font-medium" style={{ color: "#006400" }}>{success}</span>
            </div>
          )}

          {demoOtp && (
            <div
              className="mb-4 p-3 rounded-lg animate-form-enter"
              style={{ backgroundColor: "rgba(139, 0, 0, 0.05)", border: "1px solid #8B0000" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#8B0000" }}>Demo OTP: {demoOtp}</p>
              <p className="text-xs mt-1" style={{ color: "#A52A2A" }}>Use this code to verify (demo only)</p>
            </div>
          )}

          <div className={isExiting ? "animate-form-exit" : "animate-form-enter"}>
            {step === "input" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#8B0000" }}>
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                      size={20}
                      style={{ color: "#8B0000" }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-red-200"
                      aria-label="Email Address"
                      style={{
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        border: "2px solid #D4A5A5",
                        color: "#4A0000",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={requestOTP}
                  disabled={loading || !validateEmail(email)}
                  className="w-full py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:opacity-50 btn-pulse"
                  style={{
                    background: loading || !validateEmail(email)
                      ? "rgba(180, 180, 180, 0.5)"
                      : "linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)",
                    color: "#FFFFFF",
                    boxShadow: loading || !validateEmail(email) ? "none" : "0 4px 15px rgba(220, 20, 60, 0.4)",
                  }}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#8B0000" }}>
                    Enter OTP
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2"
                      size={20}
                      style={{ color: "#8B0000" }}
                    />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-center text-2xl tracking-wider font-bold transition-all duration-200 focus:ring-2 focus:ring-red-200"
                      maxLength={6}
                      aria-label="One Time Password"
                      style={{
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        border: "2px solid #D4A5A5",
                        color: "#4A0000",
                        outline: "none",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2 font-medium" style={{ color: "#A52A2A" }}>
                    OTP sent to {email}
                  </p>
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:opacity-50 btn-pulse"
                  style={{
                    background: loading || otp.length !== 6
                      ? "rgba(180, 180, 180, 0.5)"
                      : "linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF0000 100%)",
                    color: "#FFFFFF",
                    boxShadow: loading || otp.length !== 6 ? "none" : "0 4px 15px rgba(220, 20, 60, 0.4)",
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>

                <button
                  onClick={() => handleStepChange("input")}
                  className="w-full py-2 text-sm font-semibold hover:underline transition-colors"
                  style={{ color: "#8B0000" }}
                >
                  Change email
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-xs opacity-80">
            <p className="font-semibold" style={{ color: "#A52A2A" }}>Secure OTP-based authentication</p>
            <p className="mt-1" style={{ color: "#B57070" }}>Prevents fake and duplicate registrations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
