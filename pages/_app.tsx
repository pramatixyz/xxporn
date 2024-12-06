import '../styles/globals.css'; // Ensure the path and file exist
import type { AppProps } from 'next/app'; // Correct import for AppProps type

// Custom App Component for Next.js
function MyApp({ Component, pageProps }: AppProps) {
  // Render the active page component with its props
  return <Component {...pageProps} />;
}

export default MyApp;
