import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 160,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 120,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '14px solid #10b981',
          position: 'relative',
        }}
      >
        <span style={{ letterSpacing: '4px' }}>CVR</span>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#10b981',
          }}
        />
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
