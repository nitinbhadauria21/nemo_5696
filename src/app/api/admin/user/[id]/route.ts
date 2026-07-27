import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, deleted: id });
}
