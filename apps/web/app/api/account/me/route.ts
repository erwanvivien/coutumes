import { getSessionUserFromRequest } from '@/lib/server/session';
import { NextResponse, type NextRequest } from 'next/server';

// Bearer-aware (unlike most routes, which are cookie-only): the mobile app calls this right after
// storing its token, both to confirm sign-in worked and to get the profile to display.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const sessionUser = await getSessionUserFromRequest(request);
  if (sessionUser === undefined) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    imageUrl: sessionUser.image,
  });
};
