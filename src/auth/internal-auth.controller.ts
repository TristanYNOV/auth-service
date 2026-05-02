import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtGuard } from './guards/jwt.guard';
import { AuthenticatedRequest } from './types/authenticated-request.type';

const AUTH_USER_ID_HEADER = 'x-auth-user-id';
const AUTH_ROLES_HEADER = 'x-auth-roles';
const AUTH_CLUB_IDS_HEADER = 'x-auth-club-ids';

function getCurrentUserId(req: AuthenticatedRequest): string {
  return req.user.sub;
}

function getCurrentUserRoles(req: AuthenticatedRequest): string[] {
  return req.user.roles ?? [];
}

@Controller('internal/auth')
@UseGuards(JwtGuard)
export class InternalAuthController {
  @Get('context')
  getAuthContext(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): { ok: true } {
    const userId = getCurrentUserId(req);
    const roles = getCurrentUserRoles(req);

    res.setHeader(AUTH_USER_ID_HEADER, userId);
    res.setHeader(AUTH_ROLES_HEADER, roles.join(','));

    // NOTE: club ids are not available in the current JWT payload model.
    res.removeHeader(AUTH_CLUB_IDS_HEADER);

    return { ok: true };
  }
}
