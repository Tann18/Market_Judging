import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password && password === expectedPassword) {
      // In production, an encrypted session token or cookie is used.
      const sessionToken = Buffer.from(`admin_auth_${Date.now()}_${Math.random()}`).toString('base64');
      
      const response = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully',
        token: sessionToken,
      });

      // Set cookie for persistence
      response.cookies.set('market_admin_session', sessionToken, {
        httpOnly: false, // Accessible for client-side state checks
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12, // 12 hours
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  }
}
