import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 48,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '6px solid #10b981',
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
      width: 192,
      height: 192,
    }
  );
}
