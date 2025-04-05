import type { AppProps } from 'next/app';
import Head from 'next/head';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SettingsProvider } from "../contexts/SettingsContext";
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId="376383547883-r4rks0kbhittq0h36obbnpoieogp3es9.apps.googleusercontent.com">
      <SettingsProvider>
        {/* Add favicon link */}
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <Component {...pageProps} />
      </SettingsProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;