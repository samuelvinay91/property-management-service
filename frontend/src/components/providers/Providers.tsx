'use client';

import { ApolloProvider } from '@apollo/client';
import apolloClient from '@/lib/apollo-client';
import { AuthProvider } from './AuthProvider';
import { UIProvider } from './UIProvider';
import { I18nProvider } from './I18nProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <I18nProvider>
        <AuthProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </AuthProvider>
      </I18nProvider>
    </ApolloProvider>
  );
}