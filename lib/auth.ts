/**
 * Authentication Utilities
 */

import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { UserRole } from './constants';

export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not set. Please set it in your environment variables.');
  }
  const secret: Secret = config.jwt.secret as unknown as Secret;
  const options: SignOptions = { expiresIn: config.jwt.expiresIn as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload as object, secret, options);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  if (!config.jwt.refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not set. Please set it in your environment variables.');
  }
  const secret: Secret = config.jwt.refreshSecret as unknown as Secret;
  const options: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload as object, secret, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not set. Please set it in your environment variables.');
  }
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error: any) {
    // Provide more specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  if (!config.jwt.refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not set. Please set it in your environment variables.');
  }
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
  } catch (error: any) {
    // Provide more specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

