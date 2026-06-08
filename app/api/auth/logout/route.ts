import { NextResponse } from 'next/server'
import { createLogoutUseCase } from '@/lib/server/composition/auth'

export async function POST(request: Request) {
  try {
    return NextResponse.json(await (await createLogoutUseCase())())
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
