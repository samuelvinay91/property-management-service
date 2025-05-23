import crypto from 'crypto';
import { promisify } from 'util';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const ITERATIONS = 100000; // PBKDF2 iterations

// Generate a secure random key
export const generateKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

// Generate a secure random salt
export const generateSalt = (): string => {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
};

// Derive a key from password using PBKDF2
export const deriveKey = async (password: string, salt: string): Promise<Buffer> => {
  const pbkdf2 = promisify(crypto.pbkdf2);
  return pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

// Encrypt data with AES-256-GCM
export const encrypt = (data: string, key: string | Buffer): EncryptedData => {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, keyBuffer);
    cipher.setAAD(Buffer.from('PropFlow', 'utf8')); // Additional authenticated data
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: ALGORITHM,
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

// Decrypt data with AES-256-GCM
export const decrypt = (encryptedData: EncryptedData, key: string | Buffer): string => {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const decipher = crypto.createDecipher(encryptedData.algorithm, keyBuffer);
    
    decipher.setAAD(Buffer.from('PropFlow', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

// Encrypt data with password
export const encryptWithPassword = async (data: string, password: string): Promise<PasswordEncryptedData> => {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const encrypted = encrypt(data, key);
  
  return {
    ...encrypted,
    salt,
    iterations: ITERATIONS,
  };
};

// Decrypt data with password
export const decryptWithPassword = async (
  encryptedData: PasswordEncryptedData,
  password: string
): Promise<string> => {
  const key = await deriveKey(password, encryptedData.salt);
  return decrypt(encryptedData, key);
};

// Hash data with SHA-256
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Hash data with SHA-512
export const hashSHA512 = (data: string): string => {
  return crypto.createHash('sha512').update(data).digest('hex');
};

// Generate HMAC
export const generateHMAC = (data: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Verify HMAC
export const verifyHMAC = (data: string, secret: string, providedHMAC: string): boolean => {
  const calculatedHMAC = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHMAC, 'hex'),
    Buffer.from(providedHMAC, 'hex')
  );
};

// Generate secure random token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate UUID v4
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Secure password generation
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// Key derivation for API keys
export const deriveAPIKey = (userId: string, secret: string): string => {
  const data = `${userId}:${Date.now()}:${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Encrypt sensitive fields in database
export const encryptDatabaseField = (value: string): string => {
  const key = process.env.DATABASE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Database encryption key not configured');
  }
  
  const encrypted = encrypt(value, key);
  return JSON.stringify(encrypted);
};

// Decrypt sensitive fields from database
export const decryptDatabaseField = (encryptedValue: string): string => {
  const key = process.env.DATABASE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Database encryption key not configured');
  }
  
  const encrypted = JSON.parse(encryptedValue) as EncryptedData;
  return decrypt(encrypted, key);
};

// File encryption for document storage
export const encryptFile = async (filePath: string, outputPath: string, password: string): Promise<void> => {
  const fs = require('fs').promises;
  const fileData = await fs.readFile(filePath);
  const encrypted = await encryptWithPassword(fileData.toString('base64'), password);
  await fs.writeFile(outputPath, JSON.stringify(encrypted));
};

// File decryption
export const decryptFile = async (encryptedFilePath: string, outputPath: string, password: string): Promise<void> => {
  const fs = require('fs').promises;
  const encryptedData = JSON.parse(await fs.readFile(encryptedFilePath, 'utf8'));
  const decryptedBase64 = await decryptWithPassword(encryptedData, password);
  const fileData = Buffer.from(decryptedBase64, 'base64');
  await fs.writeFile(outputPath, fileData);
};

// Zero-knowledge proof helpers
export const generateProof = (secret: string, challenge: string): string => {
  return crypto.createHmac('sha256', secret).update(challenge).digest('hex');
};

export const verifyProof = (secret: string, challenge: string, proof: string): boolean => {
  const expectedProof = generateProof(secret, challenge);
  return crypto.timingSafeEqual(
    Buffer.from(expectedProof, 'hex'),
    Buffer.from(proof, 'hex')
  );
};

// Interfaces
export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  algorithm: string;
}

export interface PasswordEncryptedData extends EncryptedData {
  salt: string;
  iterations: number;
}

// Key rotation utilities
export const rotateEncryptionKey = async (oldKey: string, newKey: string, data: string[]): Promise<string[]> => {
  const results: string[] = [];
  
  for (const item of data) {
    try {
      const encrypted = JSON.parse(item) as EncryptedData;
      const decrypted = decrypt(encrypted, oldKey);
      const reencrypted = encrypt(decrypted, newKey);
      results.push(JSON.stringify(reencrypted));
    } catch (error) {
      throw new Error(`Key rotation failed for item: ${error.message}`);
    }
  }
  
  return results;
};

// Secure comparison to prevent timing attacks
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// Generate cryptographically secure random numbers
export const secureRandomInt = (min: number, max: number): number => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;
  
  let randomValue;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue > maxValidValue);
  
  return min + (randomValue % range);
};