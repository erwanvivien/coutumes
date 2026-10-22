import { getSessionUser } from '@/lib/session';
import { NextResponse } from 'next/server';

export const GET = async (): Promise<NextResponse> => {
  const sessionUser = await getSessionUser();
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
