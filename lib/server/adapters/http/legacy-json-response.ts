import { NextResponse } from 'next/server'
import { isApplicationError } from '@/lib/server/domain/errors'

function statusForLegacyApplicationError(code: string) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'NOT_FOUND':
      return 404
    default:
      return 500
  }
}

export function createLegacyJsonErrorResponse(error: unknown) {
  if (isApplicationError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: statusForLegacyApplicationError(error.code) }
    )
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export function createLegacyUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
