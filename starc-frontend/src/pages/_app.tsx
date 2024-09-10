import { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId="376383547883-r4rks0kbhittq0h36obbnpoieogp3es9.apps.googleusercontent.com">
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}

export default MyApp;