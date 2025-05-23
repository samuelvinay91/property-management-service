import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { TwoFactorService } from '../services/TwoFactorService';

const logger = {
  info: (message: string, ...args: any[]) => console.log(`ℹ️ [Auth-Resolvers] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`❌ [Auth-Resolvers] ${message}`, ...args)
};

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      return await UserService.findById(context.user.id);
    },

    verifyToken: async (_: any, { token }: { token: string }) => {
      return await AuthService.verifyToken(token);
    }
  },

  Mutation: {
    register: async (_: any, { input }: { input: any }) => {
      logger.info('User registration attempt', { email: input.email, role: input.role });
      return await AuthService.register(input);
    },

    login: async (_: any, { input }: { input: any }) => {
      logger.info('User login attempt', { email: input.email });
      return await AuthService.login(input);
    },

    logout: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await AuthService.logout(context.user.id);
      return true;
    },

    refreshToken: async (_: any, { input }: { input: any }) => {
      return await AuthService.refreshToken(input.refreshToken);
    },

    updateProfile: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      return await UserService.updateProfile(context.user.id, input);
    },

    changePassword: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await AuthService.changePassword(context.user.id, input);
      return true;
    },

    forgotPassword: async (_: any, { input }: { input: any }) => {
      await AuthService.forgotPassword(input.email);
      return true;
    },

    resetPassword: async (_: any, { input }: { input: any }) => {
      await AuthService.resetPassword(input.token, input.newPassword);
      return true;
    },

    sendEmailVerification: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await AuthService.sendEmailVerification(context.user.id);
      return true;
    },

    verifyEmail: async (_: any, { input }: { input: any }) => {
      await AuthService.verifyEmail(input.token);
      return true;
    },

    sendPhoneVerification: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await AuthService.sendPhoneVerification(context.user.id);
      return true;
    },

    verifyPhone: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await AuthService.verifyPhone(context.user.id, input.code);
      return true;
    },

    setupTwoFactor: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      return await TwoFactorService.setup(context.user.id);
    },

    enableTwoFactor: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await TwoFactorService.enable(context.user.id, input.secret, input.code);
      return true;
    },

    disableTwoFactor: async (_: any, { code }: { code: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await TwoFactorService.disable(context.user.id, code);
      return true;
    },

    generateBackupCodes: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      return await TwoFactorService.generateBackupCodes(context.user.id);
    },

    deleteAccount: async (_: any, { password }: { password: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await UserService.deleteAccount(context.user.id, password);
      return true;
    }
  },

  User: {
    __resolveReference: async (user: { id: string }) => {
      return await UserService.findById(user.id);
    },

    fullName: (user: any) => {
      return `${user.firstName} ${user.lastName}`;
    }
  }
};