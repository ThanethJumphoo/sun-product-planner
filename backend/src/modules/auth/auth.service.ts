import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import prisma from '../../lib/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.status === 'ACTIVE' && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Fetch permissions during login to embed in JWT and avoid DB lookups on every request
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
      }
    });
    
    const permissions = Array.from(new Set(
      userData?.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.permissionCode)) || []
    ));

    const payload = { username: user.username, sub: user.id, permissions };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }), // In prod, consider separate secret/store for refresh tokens
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET || 'super-secret' });
      // Here you would check if the refresh token is revoked in DB/Redis
      const newPayload = { username: payload.username, sub: payload.sub, permissions: payload.permissions || [] };
      return {
        accessToken: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}

