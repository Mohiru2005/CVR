import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple Touch Icon generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 36,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '4px solid #10b981',
          position: 'relative',
        }}
      >
        <span style={{ letterSpacing: '2px' }}>CVR</span>
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#10b981',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
