import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Apple icon component
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
          borderRadius: '22.5%',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* DNA helix icon */}
          <path d="M2 15c6.667-6 13.333 0 20-6" />
          <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
          <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
          <path d="m17 6-2.5-2.5" />
          <path d="m14 8-1-1" />
          <path d="m7 18 2.5 2.5" />
          <path d="m3.5 14.5.5.5" />
          <path d="m20 9 .5.5" />
          <path d="m6.5 12.5 1 1" />
          <path d="m16.5 10.5 1 1" />
          <path d="m10 16 1.5 1.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
