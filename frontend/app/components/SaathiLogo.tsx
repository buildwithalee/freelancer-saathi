"use client";

import { motion } from "motion/react";
import { useId } from "react";

type SaathiLogoProps = {
  size?: number;
  animated?: boolean;
  showGlow?: boolean;
};

export default function SaathiLogo({
  size = 52,
  animated = true,
  showGlow = true,
}: SaathiLogoProps) {
  const id = useId().replace(/:/g, "");

  const cyanGradient = `cyan-${id}`;
  const purpleGradient = `purple-${id}`;
  const shadow = `shadow-${id}`;

  return (
    <motion.div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {showGlow && (
        <motion.div
          className="absolute inset-[8%] rounded-full bg-cyan-300/20 blur-xl"
          animate={
            animated
              ? {
                  opacity: [0.25, 0.55, 0.25],
                  scale: [0.9, 1.08, 0.9],
                }
              : undefined
          }
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 overflow-visible"
      >
        <defs>
          <linearGradient
            id={cyanGradient}
            x1="15"
            y1="10"
            x2="65"
            y2="75"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#68FFE9" />
            <stop offset="0.38" stopColor="#31E5D0" />
            <stop offset="0.72" stopColor="#18BFD7" />
            <stop offset="1" stopColor="#1689E8" />
          </linearGradient>

          <linearGradient
            id={purpleGradient}
            x1="35"
            y1="43"
            x2="83"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#26E2D0" />
            <stop offset="0.45" stopColor="#239DDC" />
            <stop offset="0.75" stopColor="#536FE8" />
            <stop offset="1" stopColor="#A55DE7" />
          </linearGradient>

          <filter
            id={shadow}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="2.2"
              result="blur"
            />

            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                0 0 0 0 0.05
                0 0 0 0 0.90
                0 0 0 0 0.82
                0 0 0 0.30 0
              "
            />

            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* =====================================================
            SHARP F
        ====================================================== */}

        <motion.path
          d="
            M20 27
            C20 17 28 10 38 10
            H72
            L62 24
            H41
            C36 24 33 27 33 32
            V37
            H58
            L48 50
            H33
            V67
            L20 82
            Z
          "
          fill={`url(#${cyanGradient})`}
          filter={`url(#${shadow})`}
          initial={animated ? { opacity: 0, x: -7 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        />

        {/* folded lower F edge */}
        <path
          d="
            M20 67
            L33 53
            V67
            L20 82
            Z
          "
          fill="#1599CF"
          opacity="0.78"
        />

        {/* =====================================================
            INTERLOCKED S
        ====================================================== */}

        <motion.path
          d="
            M72 31
            H51
            C41 31 35 36 35 44
            C35 51 40 55 48 57

            L62 61

            C65 62 67 64 67 67
            C67 70 64 72 60 72

            H37

            L27 85

            H61

            C74 85 82 78 82 67
            C82 58 76 52 66 49

            L52 45

            C49 44 48 43 48 41
            C48 39 50 38 53 38

            H66

            Z
          "
          fill={`url(#${purpleGradient})`}
          filter={`url(#${shadow})`}
          initial={animated ? { opacity: 0, x: 8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.75,
            delay: 0.12,
          }}
        />

        {/* dark cut creates FS overlap */}
        <path
          d="
            M33 50
            H49
            L43 58
            H33
            Z
          "
          fill="#06131C"
          opacity="0.92"
        />

        {/* subtle cyan highlight */}
        <path
          d="
            M23 29
            C23 20 29 14 38 14
            H61
          "
          stroke="#A5FFF2"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.38"
        />

        {/* =====================================================
            GOLD AI SPARK
        ====================================================== */}

        <motion.g
          style={{
            transformOrigin: "78px 18px",
          }}
          animate={
            animated
              ? {
                  scale: [0.9, 1.12, 0.9],
                  rotate: [0, 7, 0],
                  opacity: [0.75, 1, 0.75],
                }
              : undefined
          }
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="
              M78 7
              L80.5 15.5
              L89 18
              L80.5 20.5
              L78 29
              L75.5 20.5
              L67 18
              L75.5 15.5
              Z
            "
            fill="#FFD96A"
          />

          <circle
            cx="78"
            cy="18"
            r="2"
            fill="#FFF5C7"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}