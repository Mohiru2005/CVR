import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

// Image generation for Browser Favicon & Mobile Tab Icon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 16,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '2px solid #10b981',
          position: 'relative',
        }}
      >
        <span style={{ letterSpacing: '1px' }}>CVR</span>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            width: 6,
            height: 6,
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
